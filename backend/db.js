import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Configure the Supabase Postgres connection string in the Render backend environment.')
}

const pool = new Pool({ connectionString, max: 5 })

function toPostgres(sql) {
  let parameterIndex = 0
  return sql
    .replace(/datetime\('now'\)/gi, 'now()')
    .replace(/\?/g, () => `$${++parameterIndex}`)
}

export const db = {
  prepare(sql) {
    return {
      async get(...params) {
        const result = await pool.query(toPostgres(sql), params)
        return result.rows[0]
      },
      async all(...params) {
        const result = await pool.query(toPostgres(sql), params)
        return result.rows
      },
      async run(...params) {
        let statement = toPostgres(sql)
        if (/^\s*insert\b/i.test(statement) && !/\breturning\b/i.test(statement)) {
          statement += ' RETURNING id'
        }
        const result = await pool.query(statement, params)
        return { lastInsertRowid: result.rows[0]?.id, changes: result.rowCount }
      },
    }
  },
  query(sql, params = []) {
    return pool.query(sql, params)
  },
  async close() {
    await pool.end()
  },
}

export async function seedFinancialLedger() {
  const users = await db.prepare('SELECT id, role FROM users ORDER BY id ASC').all()
  const investor = users.find((user) => user.role === 'investor')
  const innovator = users.find((user) => user.role === 'innovator')
  if (!investor || !innovator) return

  const existing = await db.prepare('SELECT COUNT(*) AS count FROM financial_ledger').get()
  if (Number(existing.count) > 0) return

  const entries = [
    { user_id: investor.id, category: 'Investment', direction: 'outflow', amount: 50000, description: 'Primary investment in FarmSense' },
    { user_id: investor.id, category: 'Return', direction: 'inflow', amount: 14500, description: 'Quarterly distribution from FarmSense' },
    { user_id: investor.id, category: 'Investment', direction: 'outflow', amount: 75000, description: 'Healthcare expansion commitment' },
    { user_id: investor.id, category: 'Return', direction: 'inflow', amount: 21000, description: 'PulseCheck revenue share payout' },
    { user_id: investor.id, category: 'Investment', direction: 'outflow', amount: 40000, description: 'Creative media pipeline allocation' },
    { user_id: innovator.id, category: 'Payout', direction: 'inflow', amount: 78000, description: 'Capital milestone received from investor' },
    { user_id: innovator.id, category: 'Payout', direction: 'inflow', amount: 120000, description: 'Growth financing milestone disbursement' },
  ]
  let balance = 0
  for (const entry of entries) {
    balance += entry.direction === 'inflow' ? entry.amount : -entry.amount
    await db.prepare(`INSERT INTO financial_ledger (user_id, category, direction, amount, balance_after, status, description)
      VALUES (?, ?, ?, ?, ?, 'posted', ?)`).run(entry.user_id, entry.category, entry.direction, entry.amount, balance, entry.description)
  }
}

export async function seedPayouts() {
  const existing = await db.prepare('SELECT COUNT(*) AS count FROM payouts').get()
  if (Number(existing.count) > 0) return
  const investor = await db.prepare("SELECT id FROM users WHERE role = 'investor' ORDER BY id ASC LIMIT 1").get()
  if (!investor) return
  const insert = db.prepare('INSERT INTO payouts (user_id, amount, status, type) VALUES (?, ?, ?, ?)')
  await insert.run(investor.id, 14500, 'completed', 'distribution')
  await insert.run(investor.id, 21000, 'pending', 'distribution')
  await insert.run(investor.id, 6800, 'processing', 'fee')
}

export async function seedProjects() {
  const existing = await db.prepare('SELECT COUNT(*) AS count FROM projects').get()
  if (Number(existing.count) > 0) return
  const innovator = await db.prepare("SELECT id FROM users WHERE role = 'innovator' ORDER BY id ASC LIMIT 1").get()
  if (!innovator) return
  const projects = [
    ['FarmSense — IoT Soil Monitoring for Smallholders', 'Agriculture', 'A low-cost IoT sensor system that helps smallholder farmers monitor soil moisture, pH, and nutrient levels in real time.', 'Smallholder farmers struggle with guesswork in irrigation and fertilizer application.', 'FarmSense deploys solar-powered sensors that sync with a mobile app to suggest crop-specific actions.', 'prototype', 250000, 175000, 15, 8, 'https://images.pexels.com/photos/4407311/pexels-photo-4407311.jpeg?auto=compress&cs=tinysrgb&w=800'],
    ['PulseCheck — AI-Powered Diagnostic Assistant for Rural Clinics', 'Healthcare', 'A portable AI diagnostic device that helps rural health workers identify common diseases in under five minutes.', 'Rural clinics lack accessible diagnostic equipment and delays in basic testing lead to complications.', 'PulseCheck combines a portable blood-analysis attachment with an offline AI model on a phone.', 'early_revenue', 500000, 420000, 12, 6, 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800'],
    ['SolarKiosk — Modular Solar Charging Stations for Off-Grid Communities', 'Renewable Energy', 'A modular solar-powered kiosk that provides clean charging, connectivity, and basic electricity access.', 'Many communities still lack affordable, reliable electricity and internet access.', 'SolarKiosk uses a low-cost modular design and local operator model to create a self-sustaining service economy.', 'scaling', 800000, 650000, 10, 5, 'https://images.pexels.com/photos/371900/pexels-photo-371900.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ]
  const insert = db.prepare(`INSERT INTO projects (title, category, description, problem, solution, stage, funding_goal,
    funding_raised, equity_offered, revenue_share_pct, status, image_url, innovator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', ?, ?)`)
  for (const project of projects) await insert.run(...project, innovator.id)
}

export async function seedInvestments() {
  const existing = await db.prepare('SELECT COUNT(*) AS count FROM investments').get()
  if (Number(existing.count) > 0) return
  const investor = await db.prepare("SELECT id FROM users WHERE role = 'investor' ORDER BY id ASC LIMIT 1").get()
  const projects = await db.prepare('SELECT id FROM projects ORDER BY id ASC LIMIT 3').all()
  if (!investor || !projects.length) return
  const insert = db.prepare("INSERT INTO investments (investor_id, project_id, amount, equity_pct, status) VALUES (?, ?, ?, ?, 'active')")
  const rows = [[50000, 10], [75000, 8], [40000, 6]]
  for (const [index, row] of rows.entries()) {
    if (projects[index]) await insert.run(investor.id, projects[index].id, row[0], row[1])
  }
}

export default db
