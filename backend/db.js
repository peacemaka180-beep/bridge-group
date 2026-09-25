import pg from 'pg'

const { Pool } = pg

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

export async function query(text, values = []) {
  return pool.query(text, values)
}

export async function queryOne(text, values = []) {
  return (await query(text, values)).rows[0]
}

export async function queryAll(text, values = []) {
  return (await query(text, values)).rows
}

// Compatibility helpers keep route code concise while every database operation
// remains asynchronous and is executed through the Postgres pool.
export const db = {
  prepare(text) {
    return {
      async get(...values) {
        return queryOne(text, values)
      },
      async all(...values) {
        return queryAll(text, values)
      },
      async run(...values) {
        const insert = /^\s*INSERT/i.test(text)
        const statement = insert && !/\bRETURNING\b/i.test(text) ? `${text} RETURNING id` : text
        const result = await query(statement, values)
        return { lastInsertRowid: result.rows[0]?.id, changes: result.rowCount }
      },
    }
  },
  query,
  queryOne,
  queryAll,
}

export async function seedFinancialLedger() {
  const existing = await db.prepare('SELECT COUNT(*) as count FROM financial_ledger').get()
  if (Number(existing.count) > 0) {
    return
  }

  const users = await db.prepare('SELECT id, role FROM users ORDER BY id ASC').all()
  const investor = users.find((user) => user.role === 'investor')
  const innovator = users.find((user) => user.role === 'innovator')

  if (!investor || !innovator) {
    return
  }

  const entries = [
    { user_id: investor.id, project_id: null, category: 'Investment', direction: 'outflow', amount: 50000, description: 'Primary investment in FarmSense', status: 'posted' },
    { user_id: investor.id, project_id: null, category: 'Return', direction: 'inflow', amount: 14500, description: 'Quarterly distribution from FarmSense', status: 'posted' },
    { user_id: investor.id, project_id: null, category: 'Investment', direction: 'outflow', amount: 75000, description: 'Healthcare expansion commitment', status: 'posted' },
    { user_id: investor.id, project_id: null, category: 'Return', direction: 'inflow', amount: 21000, description: 'PulseCheck revenue share payout', status: 'posted' },
    { user_id: investor.id, project_id: null, category: 'Investment', direction: 'outflow', amount: 40000, description: 'Creative media pipeline allocation', status: 'posted' },
    { user_id: innovator.id, project_id: null, category: 'Payout', direction: 'inflow', amount: 78000, description: 'Capital milestone received from investor', status: 'posted' },
    { user_id: innovator.id, project_id: null, category: 'Payout', direction: 'inflow', amount: 120000, description: 'Growth financing milestone disbursement', status: 'posted' },
  ]

  let balance = 0
  const stmt = db.prepare(`
    INSERT INTO financial_ledger (user_id, project_id, category, direction, amount, balance_after, status, description, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
  `)

  for (const entry of entries) {
    if (entry.direction === 'inflow') {
      balance += Number(entry.amount)
    } else {
      balance -= Number(entry.amount)
    }

    await stmt.run(
      entry.user_id,
      entry.project_id || null,
      entry.category,
      entry.direction,
      Number(entry.amount),
      balance,
      entry.status,
      entry.description,
    )
  }
}

export async function seedPayouts() {
  const existing = await db.prepare('SELECT COUNT(*) as count FROM payouts').get()
  if (Number(existing.count) > 0) {
    return
  }

  const investor = await db.prepare('SELECT id FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1').get('investor')
  if (!investor) {
    return
  }

  const payoutStmt = db.prepare(`
    INSERT INTO payouts (user_id, project_id, amount, status, type, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `)

  await payoutStmt.run(investor.id, null, 14500, 'completed', 'distribution')
  await payoutStmt.run(investor.id, null, 21000, 'pending', 'distribution')
  await payoutStmt.run(investor.id, null, 6800, 'processing', 'fee')
}

export async function seedProjects() {
  const existing = await db.prepare('SELECT COUNT(*) as count FROM projects').get()
  if (Number(existing.count) > 0) {
    return
  }

  const innovator = await db.prepare('SELECT id FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1').get('innovator')
  if (!innovator) {
    return
  }

  const projects = [
    {
      title: 'FarmSense — IoT Soil Monitoring for Smallholders',
      category: 'Agriculture',
      description: 'A low-cost IoT sensor system that helps smallholder farmers monitor soil moisture, pH, and nutrient levels in real time.',
      problem: 'Smallholder farmers struggle with guesswork in irrigation and fertilizer application.',
      solution: 'FarmSense deploys solar-powered sensors that sync with a mobile app to suggest crop-specific actions.',
      stage: 'prototype',
      funding_goal: 250000,
      funding_raised: 175000,
      equity_offered: 15,
      revenue_share_pct: 8,
      image_url: 'https://images.pexels.com/photos/4407311/pexels-photo-4407311.jpeg?auto=compress&cs=tinysrgb&w=800',
      innovator_id: innovator.id,
    },
    {
      title: 'PulseCheck — AI-Powered Diagnostic Assistant for Rural Clinics',
      category: 'Healthcare',
      description: 'A portable AI diagnostic device that helps rural health workers identify common diseases in under five minutes.',
      problem: 'Rural clinics lack accessible diagnostic equipment and delays in basic testing lead to complications.',
      solution: 'PulseCheck combines a portable blood-analysis attachment with an offline AI model on a phone.',
      stage: 'early_revenue',
      funding_goal: 500000,
      funding_raised: 420000,
      equity_offered: 12,
      revenue_share_pct: 6,
      image_url: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
      innovator_id: innovator.id,
    },
    {
      title: 'SolarKiosk — Modular Solar Charging Stations for Off-Grid Communities',
      category: 'Renewable Energy',
      description: 'A modular solar-powered kiosk that provides clean charging, connectivity, and basic electricity access.',
      problem: 'Many communities still lack affordable, reliable electricity and internet access.',
      solution: 'SolarKiosk uses a low-cost modular design and local operator model to create a self-sustaining service economy.',
      stage: 'scaling',
      funding_goal: 800000,
      funding_raised: 650000,
      equity_offered: 10,
      revenue_share_pct: 5,
      image_url: 'https://images.pexels.com/photos/371900/pexels-photo-371900.jpeg?auto=compress&cs=tinysrgb&w=800',
      innovator_id: innovator.id,
    },
  ]

  const stmt = db.prepare(`
    INSERT INTO projects (
      title, category, description, problem, solution, stage, funding_goal,
      funding_raised, equity_offered, revenue_share_pct, status, image_url,
      innovator_id, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'live', $11, $12, NOW(), NOW())
  `)

  for (const project of projects) {
    await stmt.run(
      project.title,
      project.category,
      project.description,
      project.problem,
      project.solution,
      project.stage,
      project.funding_goal,
      project.funding_raised,
      project.equity_offered,
      project.revenue_share_pct,
      project.image_url,
      project.innovator_id,
    )
  }
}

export async function seedInvestments() {
  const existing = await db.prepare('SELECT COUNT(*) as count FROM investments').get()
  if (Number(existing.count) > 0) {
    return
  }

  const investor = await db.prepare('SELECT id FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1').get('investor')
  if (!investor) {
    return
  }

  const projectIds = (await db.prepare('SELECT id FROM projects ORDER BY id ASC LIMIT 3').all()).map((project) => project.id)
  if (!projectIds.length) {
    return
  }

  const insert = db.prepare(`
    INSERT INTO investments (investor_id, project_id, amount, equity_pct, status, created_at)
    VALUES ($1, $2, $3, $4, 'active', NOW())
  `)

  const rows = [
    { project_id: projectIds[0], amount: 50000, equity_pct: 10 },
    { project_id: projectIds[1], amount: 75000, equity_pct: 8 },
    { project_id: projectIds[2], amount: 40000, equity_pct: 6 },
  ]

  for (const row of rows) {
    await insert.run(investor.id, row.project_id, row.amount, row.equity_pct)
  }
}


export default db
