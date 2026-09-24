import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import db, { seedFinancialLedger, seedInvestments, seedPayouts, seedProjects } from './db.js'
import {
  comparePassword,
  ensureSeedUsers,
  hashPassword,
  isStrongPassword,
  isValidEmail,
  requireAuth,
  requireRole,
  revokeToken,
  signToken,
} from './auth.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean)
const isDemoMode = process.env.ENABLE_DEMO_DATA === 'true'

app.set('trust proxy', 1)

const isAllowedOrigin = (origin) => {
  if (!origin) return true

  try {
    const parsed = new URL(origin)
    const normalizedOrigin = `${parsed.protocol}//${parsed.host}`
    const hostname = parsed.hostname
    const port = Number(parsed.port || '80')
    if (allowedOrigins.includes(normalizedOrigin)) return true
    if (['localhost', '127.0.0.1', 'bridgegroup.local'].includes(hostname)) {
      return ((port >= 3000 && port <= 3999) || (port >= 5173 && port <= 5199) || port === 80)
    }
    return hostname.endsWith('.vercel.app') || hostname.endsWith('.netlify.app') || hostname.endsWith('.github.dev') || hostname.endsWith('.pages.dev')
  } catch {
    return false
  }
}

app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'http://localhost:4000', 'http://localhost:3000'],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}))
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('CORS origin not allowed'))
  },
  credentials: true,
}))
const sanitizeText = (value) => {
  if (typeof value !== 'string') return ''
  return value.replace(/[<>]/g, '').trim()
}

const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body

  for (const key of Object.keys(body)) {
    if (typeof body[key] === 'string') {
      body[key] = sanitizeText(body[key])
    } else if (Array.isArray(body[key])) {
      body[key] = body[key].map((item) => (typeof item === 'string' ? sanitizeText(item) : item))
    }
  }

  return body
}

app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeBody(req.body)
  }
  next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
})

app.use('/api/auth', authLimiter)

app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.warn(`[security] ${req.method} ${req.originalUrl} -> ${res.statusCode}`)
    }
  })
  next()
})

if (isDemoMode) {
  ensureSeedUsers()
  seedProjects()
  seedInvestments()
  seedFinancialLedger()
  seedPayouts()
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'bridge-group-api' })
})

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeToken(authHeader.split(' ')[1])
  }

  res.json({ message: 'Logged out successfully.' })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body || {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (!normalizedEmail || !password || !isValidEmail(normalizedEmail) || !isStrongPassword(password)) {
    return res.status(400).json({ message: 'Please provide a valid email and a password with at least 8 characters, including a number.' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail)
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const matches = comparePassword(password, user.password_hash)
  if (!matches) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  if (role && user.role !== role) {
    return res.status(403).json({ message: `This account is not registered as a ${role}.` })
  }

  const token = signToken(user)
  res.json({
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      company: user.company,
      bio: user.bio,
      avatar_url: user.avatar_url,
    },
  })
})

app.post('/api/auth/register', (req, res) => {
  const { full_name, email, password, role, company, bio, avatar_url } = req.body || {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const safeFullName = sanitizeText(full_name || '')

  if (!safeFullName || !normalizedEmail || !password || !role || !isValidEmail(normalizedEmail) || !isStrongPassword(password)) {
    return res.status(400).json({ message: 'Full name, a valid email, and a strong password are required.' })
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)
  if (exists) {
    return res.status(409).json({ message: 'An account already exists with that email.' })
  }

  const user = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role, company, bio, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    full_name,
    email.toLowerCase(),
    hashPassword(password),
    role,
    company || '',
    bio || '',
    avatar_url || '',
  )

  const createdUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.lastInsertRowid)
  const token = signToken(createdUser)

  res.status(201).json({
    token,
    user: {
      id: createdUser.id,
      full_name: createdUser.full_name,
      email: createdUser.email,
      role: createdUser.role,
      company: createdUser.company,
      bio: createdUser.bio,
      avatar_url: createdUser.avatar_url,
    },
  })
})

app.get('/api/profile/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, full_name, email, role, company, bio, avatar_url FROM users WHERE id = ?').get(req.user.id)

  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  res.json({ user })
})

app.get('/api/ideas', requireAuth, (req, res) => {
  if (req.user.role === 'innovator') {
    const ideas = db.prepare('SELECT * FROM idea_requests WHERE innovator_id = ? ORDER BY created_at DESC').all(req.user.id)
    return res.json({ ideas })
  }

  if (req.user.role === 'admin' || req.user.role === 'investor') {
    const ideas = db.prepare('SELECT * FROM idea_requests ORDER BY created_at DESC').all()
    return res.json({ ideas })
  }

  return res.status(403).json({ message: 'You do not have permission to view idea requests.' })
})

app.get('/api/ideas/:id', requireAuth, (req, res) => {
  const idea = db.prepare('SELECT * FROM idea_requests WHERE id = ?').get(req.params.id)

  if (!idea) {
    return res.status(404).json({ message: 'Idea request not found.' })
  }

  if (req.user.role !== 'admin' && req.user.role !== 'investor' && idea.innovator_id !== req.user.id) {
    return res.status(403).json({ message: 'You do not have access to this idea request.' })
  }

  res.json({ idea })
})

app.post('/api/ideas', requireAuth, requireRole('innovator', 'admin'), (req, res) => {
  const { title, category, field, problem, solution, pitch, founder_name, email } = req.body || {}

  if (!title || !category || !field || !problem || !solution || !pitch || !founder_name || !email) {
    return res.status(400).json({ message: 'All idea request fields are required.' })
  }

  const result = db.prepare(`
    INSERT INTO idea_requests (
      innovator_id, title, category, field, problem, solution, pitch,
      founder_name, email, status, score, department, review_summary, admin_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 0, NULL, NULL, NULL, datetime('now'), datetime('now'))
  `).run(
    req.user.id,
    title,
    category,
    field,
    problem,
    solution,
    pitch,
    founder_name,
    email,
  )

  const idea = db.prepare('SELECT * FROM idea_requests WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ idea })
})

app.patch('/api/ideas/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  const { status, score, department, review_summary, admin_notes } = req.body || {}
  const existing = db.prepare('SELECT * FROM idea_requests WHERE id = ?').get(req.params.id)

  if (!existing) {
    return res.status(404).json({ message: 'Idea request not found.' })
  }

  const update = db.prepare(`
    UPDATE idea_requests
    SET status = COALESCE(?, status),
        score = COALESCE(?, score),
        department = COALESCE(?, department),
        review_summary = COALESCE(?, review_summary),
        admin_notes = COALESCE(?, admin_notes),
        updated_at = datetime('now')
    WHERE id = ?
  `)

  update.run(status ?? null, score ?? null, department ?? null, review_summary ?? null, admin_notes ?? null, req.params.id)

  const idea = db.prepare('SELECT * FROM idea_requests WHERE id = ?').get(req.params.id)
  res.json({ idea })
})

app.get('/api/projects', requireAuth, (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  res.json({ projects })
})

app.get('/api/monetization/summary', requireAuth, requireRole('admin', 'investor'), (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  const approvedProjects = projects.filter((project) => project.status === 'live')
  const totalFundingGoal = projects.reduce((sum, project) => sum + Number(project.funding_goal || 0), 0)
  const totalRaised = projects.reduce((sum, project) => sum + Number(project.funding_raised || 0), 0)
  const avgRoi = approvedProjects.length
    ? approvedProjects.reduce((sum, project) => sum + Number(project.revenue_share_pct || 0), 0) / approvedProjects.length
    : 0

  res.json({
    totalProjects: projects.length,
    approvedProjects: approvedProjects.length,
    totalFundingGoal,
    totalRaised,
    averageRevenueShare: Number(avgRoi.toFixed(2)),
    projects: approvedProjects.map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      fundingGoal: Number(project.funding_goal),
      fundingRaised: Number(project.funding_raised),
      revenueSharePct: Number(project.revenue_share_pct),
      equityOffered: Number(project.equity_offered),
    })),
  })
})

app.post('/api/projects/approve', requireAuth, requireRole('admin'), (req, res) => {
  const {
    idea_id,
    title,
    category,
    description,
    problem,
    solution,
    funding_goal,
    equity_offered,
    revenue_share_pct,
    roi_projection,
    innovator_id,
  } = req.body || {}

  if (!title || !category || !description || !problem || !solution || !funding_goal) {
    return res.status(400).json({ message: 'Project title, category, description, problem, solution, and funding goal are required.' })
  }

  const idea = idea_id ? db.prepare('SELECT * FROM idea_requests WHERE id = ?').get(idea_id) : null
  const creatorId = innovator_id || (idea ? idea.innovator_id : req.user.id)

  const insert = db.prepare(`
    INSERT INTO projects (
      title, category, description, problem, solution, stage, funding_goal,
      funding_raised, equity_offered, revenue_share_pct, status, image_url,
      innovator_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'approved', ?, 0, ?, ?, 'live', '', ?, datetime('now'), datetime('now'))
  `)

  const result = insert.run(
    title,
    category,
    description,
    problem,
    solution,
    Number(funding_goal),
    Number(equity_offered || 0),
    Number(revenue_share_pct || 8),
    creatorId,
  )

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)

  if (idea) {
    db.prepare(`
      UPDATE idea_requests
      SET status = 'approved', score = COALESCE(score, 0) + 5, department = COALESCE(department, 'Product & Strategy'), updated_at = datetime('now')
      WHERE id = ?
    `).run(idea.id)
  }

  res.status(201).json({
    project: {
      ...project,
      roi_projection: Number(roi_projection || 20),
      funding_goal: Number(project.funding_goal),
      funding_raised: Number(project.funding_raised),
      equity_offered: Number(project.equity_offered),
      revenue_share_pct: Number(project.revenue_share_pct),
    },
  })
})

app.get('/api/finance/summary', requireAuth, (req, res) => {
  const ledger = db.prepare('SELECT * FROM financial_ledger WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
  const inflow = ledger.filter((entry) => entry.direction === 'inflow').reduce((sum, entry) => sum + Number(entry.amount), 0)
  const outflow = ledger.filter((entry) => entry.direction === 'outflow').reduce((sum, entry) => sum + Number(entry.amount), 0)
  const net = inflow - outflow

  const activeInvestments = db.prepare('SELECT COUNT(*) as count FROM investments WHERE investor_id = ?').get(req.user.id)?.count ?? 0

  res.json({
    totalInflow: inflow,
    totalOutflow: outflow,
    netCashFlow: net,
    profitLoss: net,
    activeInvestments,
    ledger,
  })
})

app.get('/api/finance/ledger', requireAuth, (req, res) => {
  const ledger = db.prepare('SELECT * FROM financial_ledger WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
  res.json({ ledger })
})

app.get('/api/admin/finance', requireAuth, requireRole('admin'), (req, res) => {
  const ledger = db.prepare('SELECT * FROM financial_ledger ORDER BY created_at DESC').all()
  const payouts = db.prepare('SELECT * FROM payouts ORDER BY created_at DESC').all()

  const totalRevenue = ledger
    .filter((entry) => entry.direction === 'inflow')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)

  const totalExpenses = ledger
    .filter((entry) => entry.direction === 'outflow')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)

  const fees = totalRevenue * 0.07
  const netProfit = totalRevenue - totalExpenses - fees
  const withdrawals = payouts.reduce((sum, payout) => sum + Number(payout.amount), 0)

  res.json({
    totalRevenue,
    totalExpenses,
    fees,
    netProfit,
    withdrawals,
    payouts,
    ledger,
    cashFlow: totalRevenue - totalExpenses,
  })
})

app.post('/api/finance/ledger', requireAuth, requireRole('investor', 'admin'), (req, res) => {
  const { project_id, category, direction, amount, description, status = 'posted' } = req.body || {}

  if (!category || !direction || !amount || !description) {
    return res.status(400).json({ message: 'Category, direction, amount, and description are required.' })
  }

  const currentBalance = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM financial_ledger WHERE user_id = ?').get(req.user.id)?.total ?? 0
  const numericAmount = Number(amount)
  const balanceAfter = direction === 'inflow' ? Number(currentBalance) + numericAmount : Number(currentBalance) - numericAmount

  const result = db.prepare(`
    INSERT INTO financial_ledger (user_id, project_id, category, direction, amount, balance_after, status, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(req.user.id, project_id || null, category, direction, numericAmount, balanceAfter, status, description)

  const entry = db.prepare('SELECT * FROM financial_ledger WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ entry })
})

app.get('/api/projects/:id', requireAuth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) {
    return res.status(404).json({ message: 'Project not found.' })
  }

  const innovator = db.prepare('SELECT id, full_name, email, company, bio, avatar_url FROM users WHERE id = ?').get(project.innovator_id)
  res.json({ project: { ...project, innovator } })
})

app.post('/api/projects', requireAuth, requireRole('innovator', 'admin'), (req, res) => {
  const { title, category, description, problem, solution, stage, funding_goal, equity_offered, revenue_share_pct, image_url } = req.body || {}

  if (!title || !category || !description || !problem || !solution || !stage || !funding_goal) {
    return res.status(400).json({ message: 'Missing required project fields.' })
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const insert = db.prepare(`
    INSERT INTO projects (
      title, category, description, problem, solution, stage, funding_goal,
      funding_raised, equity_offered, revenue_share_pct, status, image_url, innovator_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'live', ?, ?, datetime('now'), datetime('now'))
  `)

  const result = insert.run(
    title,
    category,
    description,
    problem,
    solution,
    stage,
    Number(funding_goal),
    Number(equity_offered || 0),
    Number(revenue_share_pct || 0),
    image_url || '',
    req.user.id,
  )

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ project })
})

app.get('/api/investments', requireAuth, requireRole('investor', 'admin'), (req, res) => {
  const investments = db.prepare(`
    SELECT i.*, p.title AS project_title, p.image_url, p.category, p.funding_goal, p.funding_raised, p.revenue_share_pct
    FROM investments i
    LEFT JOIN projects p ON p.id = i.project_id
    WHERE i.investor_id = ?
    ORDER BY i.created_at DESC
  `).all(req.user.id)

  res.json({ investments })
})

app.post('/api/investments', requireAuth, requireRole('investor', 'admin'), (req, res) => {
  const { project_id, amount, equity_pct } = req.body || {}

  if (!project_id || !amount) {
    return res.status(400).json({ message: 'Project and amount are required.' })
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id)
  if (!project) {
    return res.status(404).json({ message: 'Project not found.' })
  }

  const result = db.prepare(`
    INSERT INTO investments (investor_id, project_id, amount, equity_pct, status, created_at)
    VALUES (?, ?, ?, ?, 'active', datetime('now'))
  `).run(req.user.id, project_id, Number(amount), Number(equity_pct || 0))

  const investment = db.prepare('SELECT * FROM investments WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ investment })
})

app.get('/api/messages', requireAuth, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, s.full_name AS sender_name, s.avatar_url AS sender_avatar, r.full_name AS receiver_name, r.avatar_url AS receiver_avatar
    FROM messages m
    LEFT JOIN users s ON s.id = m.sender_id
    LEFT JOIN users r ON r.id = m.receiver_id
    WHERE m.sender_id = ? OR m.receiver_id = ?
    ORDER BY m.created_at DESC
  `).all(req.user.id, req.user.id)

  res.json({ messages })
})

app.post('/api/messages', requireAuth, (req, res) => {
  const { receiver_id, project_id, content } = req.body || {}
  const safeContent = typeof content === 'string' ? content.trim() : ''

  if (!receiver_id || !safeContent) {
    return res.status(400).json({ message: 'Receiver and message content are required.' })
  }

  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiver_id)
  if (!receiver) {
    return res.status(404).json({ message: 'Recipient not found.' })
  }

  if (Number(receiver.id) === Number(req.user.id)) {
    return res.status(400).json({ message: 'You cannot message yourself.' })
  }

  const result = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, project_id, content, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(req.user.id, receiver_id, project_id || null, safeContent)

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ message })
})

app.get('/api/community/posts', requireAuth, (req, res) => {
  const categoryFilter = typeof req.query.category === 'string' ? req.query.category.trim() : ''
  const posts = db.prepare(`
    SELECT cp.*, u.full_name AS author_name, u.role AS author_role, u.avatar_url AS author_avatar
    FROM community_posts cp
    LEFT JOIN users u ON u.id = cp.author_id
    WHERE (? = '' OR cp.category = ?)
    ORDER BY cp.created_at DESC
  `).all(categoryFilter, categoryFilter)

  res.json({ posts })
})

app.post('/api/community/posts', requireAuth, (req, res) => {
  const { category, title, content } = req.body || {}
  const safeTitle = typeof title === 'string' ? title.trim() : ''
  const safeContent = typeof content === 'string' ? content.trim() : ''

  if (!category || !safeTitle || !safeContent) {
    return res.status(400).json({ message: 'Category, title, and content are required.' })
  }

  const user = db.prepare('SELECT id, full_name, role FROM users WHERE id = ?').get(req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const result = db.prepare(`
    INSERT INTO community_posts (category, author_id, author_name, author_role, title, content, replies, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `).run(category, user.id, user.full_name, user.role, safeTitle, safeContent)

  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ post })
})

app.get('/api/portfolio/summary', requireAuth, requireRole('investor', 'admin'), (req, res) => {
  const investments = db.prepare(`
    SELECT i.*, p.title AS project_title, p.funding_goal, p.funding_raised, p.revenue_share_pct, p.image_url
    FROM investments i
    LEFT JOIN projects p ON p.id = i.project_id
    WHERE i.investor_id = ?
  `).all(req.user.id)

  const totalInvested = investments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalEquity = investments.reduce((sum, item) => sum + (Number(item.amount || 0) * Number(item.equity_pct || 0) / 100), 0)
  const ledger = db.prepare('SELECT * FROM financial_ledger WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
  const inflow = ledger.filter((entry) => entry.direction === 'inflow').reduce((sum, entry) => sum + Number(entry.amount), 0)
  const outflow = ledger.filter((entry) => entry.direction === 'outflow').reduce((sum, entry) => sum + Number(entry.amount), 0)

  res.json({
    totalInvested,
    totalEquity,
    totalInflow: inflow,
    totalOutflow: outflow,
    profitLoss: inflow - outflow,
    activeInvestments: investments.length,
    investments,
    ledger,
  })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Bridge Group API running on http://localhost:${PORT}`)
})
