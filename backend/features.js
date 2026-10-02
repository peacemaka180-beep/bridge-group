import crypto from 'node:crypto'
import express from 'express'
import db, { pool } from './db.js'
import { requireAuth, requireRole } from './auth.js'

const router = express.Router()

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Creates the tables the first time the server starts. Safe to run every time.
try {
  await db.query(`
    CREATE TABLE IF NOT EXISTS call_requests (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER,
      proposed_time TIMESTAMPTZ NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      meeting_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS community_replies (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
} catch (error) {
  console.error('[features] Could not create tables:', error)
}

const CALL_SELECT = `
  SELECT c.*,
         rq.full_name AS requester_name, rq.avatar_url AS requester_avatar,
         rc.full_name AS receiver_name, rc.avatar_url AS receiver_avatar,
         p.title AS project_title
  FROM call_requests c
  LEFT JOIN users rq ON rq.id = c.requester_id
  LEFT JOIN users rc ON rc.id = c.receiver_id
  LEFT JOIN projects p ON p.id = c.project_id
`

const getCall = (id) => db.prepare(`${CALL_SELECT} WHERE c.id = $1`).get(id)

/* ------------------------------ Calls ------------------------------ */

// Calls I requested or that were requested of me.
router.get('/calls', requireAuth, async (req, res) => {
  const calls = await db
    .prepare(`${CALL_SELECT} WHERE c.requester_id = $1 OR c.receiver_id = $1 ORDER BY c.proposed_time DESC`)
    .all(req.user.id)
  res.json({ calls })
})

// Ask someone for a call at a proposed time.
router.post('/calls', requireAuth, async (req, res) => {
  const { receiver_id, project_id, proposed_time, note } = req.body || {}

  if (!receiver_id || !proposed_time) {
    return res.status(400).json({ message: 'Choose who to call and a time.' })
  }

  const when = new Date(proposed_time)
  if (Number.isNaN(when.getTime())) {
    return res.status(400).json({ message: 'That date and time is not valid.' })
  }
  if (when.getTime() < Date.now()) {
    return res.status(400).json({ message: 'Pick a time in the future.' })
  }

  const receiver = await db.prepare('SELECT id FROM users WHERE id = $1').get(receiver_id)
  if (!receiver) {
    return res.status(404).json({ message: 'Recipient not found.' })
  }
  if (Number(receiver.id) === Number(req.user.id)) {
    return res.status(400).json({ message: 'You cannot request a call with yourself.' })
  }

  const result = await db
    .prepare(`
      INSERT INTO call_requests (requester_id, receiver_id, project_id, proposed_time, note, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
    `)
    .run(req.user.id, receiver.id, project_id || null, when.toISOString(), String(note || '').slice(0, 1000))

  res.status(201).json({ call: await getCall(result.lastInsertRowid) })
})

// accept / decline (the person asked), cancel (the person who asked).
router.patch('/calls/:id', requireAuth, async (req, res) => {
  const { action } = req.body || {}
  const call = await db.prepare('SELECT * FROM call_requests WHERE id = $1').get(req.params.id)

  if (!call) return res.status(404).json({ message: 'Call request not found.' })

  const me = Number(req.user.id)
  const isReceiver = Number(call.receiver_id) === me
  const isRequester = Number(call.requester_id) === me
  if (!isReceiver && !isRequester) {
    return res.status(403).json({ message: 'You are not part of this call.' })
  }

  if (action === 'accept' || action === 'decline') {
    if (!isReceiver) return res.status(403).json({ message: 'Only the person asked can answer this request.' })
    if (call.status !== 'pending') return res.status(400).json({ message: 'This request was already answered.' })

    if (action === 'accept') {
      // Free Jitsi Meet room: no account or API key needed. Anyone with the link can join.
      const room = `BridgeGroup-${crypto.randomBytes(6).toString('hex')}`
      await db
        .prepare(`UPDATE call_requests SET status = 'accepted', meeting_url = $1, updated_at = NOW() WHERE id = $2`)
        .run(`https://meet.jit.si/${room}`, call.id)
    } else {
      await db.prepare(`UPDATE call_requests SET status = 'declined', updated_at = NOW() WHERE id = $1`).run(call.id)
    }
  } else if (action === 'cancel') {
    if (!isRequester) return res.status(403).json({ message: 'Only the person who asked can cancel.' })
    if (!['pending', 'accepted'].includes(call.status)) {
      return res.status(400).json({ message: 'This request can no longer be cancelled.' })
    }
    await db.prepare(`UPDATE call_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`).run(call.id)
  } else {
    return res.status(400).json({ message: 'Action must be accept, decline or cancel.' })
  }

  res.json({ call: await getCall(call.id) })
})

/* --------------------------- Discussion replies --------------------------- */

const REPLY_SELECT = `
  SELECT r.*, u.full_name AS author_name, u.role AS author_role, u.avatar_url AS author_avatar
  FROM community_replies r
  LEFT JOIN users u ON u.id = r.author_id
`

router.get('/community/posts/:id/replies', requireAuth, async (req, res) => {
  const replies = await db.prepare(`${REPLY_SELECT} WHERE r.post_id = $1 ORDER BY r.created_at ASC`).all(req.params.id)
  res.json({ replies })
})

router.post('/community/posts/:id/replies', requireAuth, async (req, res) => {
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  if (!content) return res.status(400).json({ message: 'Write a reply first.' })
  if (content.length > 2000) return res.status(400).json({ message: 'Replies can be up to 2000 characters.' })

  const post = await db.prepare('SELECT id FROM community_posts WHERE id = $1').get(req.params.id)
  if (!post) return res.status(404).json({ message: 'Discussion not found.' })

  const result = await db
    .prepare('INSERT INTO community_replies (post_id, author_id, content, created_at) VALUES ($1, $2, $3, NOW())')
    .run(post.id, req.user.id, content)

  await db.prepare('UPDATE community_posts SET replies = COALESCE(replies, 0) + 1 WHERE id = $1').run(post.id)

  const reply = await db.prepare(`${REPLY_SELECT} WHERE r.id = $1`).get(result.lastInsertRowid)
  res.status(201).json({ reply })
})

/* ------------------------------- Guidance ------------------------------- */

// Sends a guidance request to the first admin as a normal message,
// so it shows up in the existing messages inbox.
router.post('/guidance', requireAuth, async (req, res) => {
  const { topic, preferred_time, note } = req.body || {}
  if (!topic) return res.status(400).json({ message: 'Choose what you need guidance on.' })

  const admin = await db.prepare(`SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`).get()
  if (!admin) {
    return res.status(404).json({ message: 'No advisor is available to receive requests yet.' })
  }

  const parts = [`Guidance request: ${topic}.`]
  if (preferred_time) parts.push(`Preferred time: ${preferred_time}.`)
  if (note) parts.push(`Notes: ${String(note).slice(0, 1000)}`)

  await db
    .prepare('INSERT INTO messages (sender_id, receiver_id, project_id, content, created_at) VALUES ($1, $2, NULL, $3, NOW())')
    .run(req.user.id, admin.id, parts.join(' '))

  res.status(201).json({ message: 'Guidance request sent.' })
})

/* -------------------------------- Investing -------------------------------- */

// Records an investment AND moves the numbers that the dashboards read:
//   1. investments row            (investor's portfolio)
//   2. projects.funding_raised    (progress bars)
//   3. ledger outflow for investor, ledger inflow for founder
// All in one transaction: either everything is saved or nothing is.
// Note: this records the commitment. It does not move real money.
router.post('/invest', requireAuth, requireRole('investor', 'admin'), async (req, res) => {
  const projectId = req.body?.project_id
  const amount = Number(req.body?.amount)

  if (!projectId || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Enter an amount greater than zero.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // FOR UPDATE locks the row so two investors can't overfund at the same moment.
    const { rows: projectRows } = await client.query('SELECT * FROM projects WHERE id = $1 FOR UPDATE', [projectId])
    const project = projectRows[0]

    if (!project) throw new HttpError(404, 'Project not found.')
    if (project.status !== 'live') throw new HttpError(400, 'This project is not open for investment.')
    if (Number(project.innovator_id) === Number(req.user.id)) {
      throw new HttpError(400, 'You cannot invest in your own project.')
    }

    const goal = Number(project.funding_goal || 0)
    const raised = Number(project.funding_raised || 0)
    const remaining = goal - raised

    if (remaining <= 0) throw new HttpError(400, 'This project is already fully funded.')
    if (amount > remaining) {
      throw new HttpError(400, `Only $${remaining.toLocaleString()} is still available for this project.`)
    }

    // Your share of the equity on offer, in proportion to how much of the goal you fund.
    const equityPct = goal > 0 ? Number(((amount / goal) * Number(project.equity_offered || 0)).toFixed(4)) : 0

    const { rows: investmentRows } = await client.query(
      `INSERT INTO investments (investor_id, project_id, amount, equity_pct, status, created_at)
       VALUES ($1, $2, $3, $4, 'active', NOW()) RETURNING *`,
      [req.user.id, project.id, amount, equityPct],
    )

    const { rows: updatedRows } = await client.query(
      'UPDATE projects SET funding_raised = COALESCE(funding_raised, 0) + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [amount, project.id],
    )

    const balanceOf = async (userId) => {
      const { rows } = await client.query(
        `SELECT COALESCE(SUM(CASE WHEN direction = 'inflow' THEN amount ELSE -amount END), 0) AS total
         FROM financial_ledger WHERE user_id = $1`,
        [userId],
      )
      return Number(rows[0]?.total ?? 0)
    }

    const investorBalance = (await balanceOf(req.user.id)) - amount
    await client.query(
      `INSERT INTO financial_ledger (user_id, project_id, category, direction, amount, balance_after, status, description, created_at)
       VALUES ($1, $2, 'Investment', 'outflow', $3, $4, 'posted', $5, NOW())`,
      [req.user.id, project.id, amount, investorBalance, `Investment in ${project.title}`],
    )

    const founderBalance = (await balanceOf(project.innovator_id)) + amount
    await client.query(
      `INSERT INTO financial_ledger (user_id, project_id, category, direction, amount, balance_after, status, description, created_at)
       VALUES ($1, $2, 'Payout', 'inflow', $3, $4, 'posted', $5, NOW())`,
      [project.innovator_id, project.id, amount, founderBalance, `Investment received from ${req.user.full_name}`],
    )

    await client.query('COMMIT')
    res.status(201).json({ investment: investmentRows[0], project: updatedRows[0] })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    if (error instanceof HttpError) return res.status(error.status).json({ message: error.message })
    throw error
  } finally {
    client.release()
  }
})

/* ------------------------- Admin: investor portfolios ------------------------- */

// One row per investor with their totals, so the admin can see everyone at a glance.
router.get('/admin/investors', requireAuth, requireRole('admin'), async (req, res) => {
  const rows = await db
    .prepare(`
      SELECT u.id, u.full_name, u.email, u.company, u.avatar_url,
             COALESCE(inv.total_invested, 0) AS total_invested,
             COALESCE(inv.positions, 0) AS positions,
             COALESCE(led.inflow, 0) AS inflow,
             COALESCE(led.outflow, 0) AS outflow
      FROM users u
      LEFT JOIN (
        SELECT investor_id, SUM(amount) AS total_invested, COUNT(*)::int AS positions
        FROM investments GROUP BY investor_id
      ) inv ON inv.investor_id = u.id
      LEFT JOIN (
        SELECT user_id,
               SUM(CASE WHEN direction = 'inflow' THEN amount ELSE 0 END) AS inflow,
               SUM(CASE WHEN direction = 'outflow' THEN amount ELSE 0 END) AS outflow
        FROM financial_ledger GROUP BY user_id
      ) led ON led.user_id = u.id
      WHERE u.role = 'investor'
      ORDER BY COALESCE(inv.total_invested, 0) DESC, u.full_name ASC
    `)
    .all()

  const investors = rows.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    company: row.company,
    avatar_url: row.avatar_url,
    total_invested: Number(row.total_invested),
    positions: Number(row.positions),
    inflow: Number(row.inflow),
    outflow: Number(row.outflow),
  }))

  res.json({ investors })
})

// One investor's full portfolio, in the same shape the investor dashboard already reads.
router.get('/admin/investors/:id/portfolio', requireAuth, requireRole('admin'), async (req, res) => {
  const investor = await db
    .prepare(`SELECT id, full_name, email, company, avatar_url FROM users WHERE id = $1 AND role = 'investor'`)
    .get(req.params.id)
  if (!investor) return res.status(404).json({ message: 'Investor not found.' })

  const investments = await db
    .prepare(`
      SELECT i.*, p.title AS project_title, p.image_url, p.category, p.funding_goal, p.funding_raised, p.revenue_share_pct
      FROM investments i
      LEFT JOIN projects p ON p.id = i.project_id
      WHERE i.investor_id = $1
      ORDER BY i.created_at DESC
    `)
    .all(investor.id)

  const ledger = await db
    .prepare('SELECT * FROM financial_ledger WHERE user_id = $1 ORDER BY created_at DESC')
    .all(investor.id)

  const inflow = ledger.filter((e) => e.direction === 'inflow').reduce((sum, e) => sum + Number(e.amount), 0)
  const outflow = ledger.filter((e) => e.direction === 'outflow').reduce((sum, e) => sum + Number(e.amount), 0)

  res.json({
    investor,
    investments,
    finance: {
      totalInflow: inflow,
      totalOutflow: outflow,
      netCashFlow: inflow - outflow,
      profitLoss: inflow - outflow,
      activeInvestments: investments.length,
      ledger,
    },
  })
})

export default router