import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbDir = path.join(__dirname, 'data')
fs.mkdirSync(dbDir, { recursive: true })

const dbPath = path.join(dbDir, 'bridge-group.db')
const db = new DatabaseSync(dbPath)

export function seedFinancialLedger() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM financial_ledger').get()
  if (Number(existing.count) > 0) {
    return
  }

  const users = db.prepare('SELECT id, role FROM users ORDER BY id ASC').all()
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `)

  for (const entry of entries) {
    if (entry.direction === 'inflow') {
      balance += Number(entry.amount)
    } else {
      balance -= Number(entry.amount)
    }

    stmt.run(
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

export function seedPayouts() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM payouts').get()
  if (Number(existing.count) > 0) {
    return
  }

  const investor = db.prepare('SELECT id FROM users WHERE role = ? ORDER BY id ASC LIMIT 1').get('investor')
  if (!investor) {
    return
  }

  const payoutStmt = db.prepare(`
    INSERT INTO payouts (user_id, project_id, amount, status, type, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `)

  payoutStmt.run(investor.id, null, 14500, 'completed', 'distribution')
  payoutStmt.run(investor.id, null, 21000, 'pending', 'distribution')
  payoutStmt.run(investor.id, null, 6800, 'processing', 'fee')
}

export function seedProjects() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM projects').get()
  if (Number(existing.count) > 0) {
    return
  }

  const innovator = db.prepare('SELECT id FROM users WHERE role = ? ORDER BY id ASC LIMIT 1').get('innovator')
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', ?, ?, datetime('now'), datetime('now'))
  `)

  for (const project of projects) {
    stmt.run(
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

export function seedInvestments() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM investments').get()
  if (Number(existing.count) > 0) {
    return
  }

  const investor = db.prepare('SELECT id FROM users WHERE role = ? ORDER BY id ASC LIMIT 1').get('investor')
  if (!investor) {
    return
  }

  const projectIds = db.prepare('SELECT id FROM projects ORDER BY id ASC LIMIT 3').all().map((project) => project.id)
  if (!projectIds.length) {
    return
  }

  const insert = db.prepare(`
    INSERT INTO investments (investor_id, project_id, amount, equity_pct, status, created_at)
    VALUES (?, ?, ?, ?, 'active', datetime('now'))
  `)

  const rows = [
    { project_id: projectIds[0], amount: 50000, equity_pct: 10 },
    { project_id: projectIds[1], amount: 75000, equity_pct: 8 },
    { project_id: projectIds[2], amount: 40000, equity_pct: 6 },
  ]

  for (const row of rows) {
    insert.run(investor.id, row.project_id, row.amount, row.equity_pct)
  }
}

db.exec('PRAGMA journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('innovator','investor','admin')),
    company TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    stage TEXT NOT NULL,
    funding_goal REAL NOT NULL,
    funding_raised REAL NOT NULL DEFAULT 0,
    equity_offered REAL NOT NULL DEFAULT 0,
    revenue_share_pct REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'live',
    image_url TEXT,
    innovator_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (innovator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    equity_pct REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investor_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_id INTEGER NOT NULL,
    project_title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investment_id) REFERENCES investments(id)
  );

  CREATE TABLE IF NOT EXISTS financial_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER,
    category TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('inflow','outflow')),
    amount REAL NOT NULL,
    balance_after REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'posted',
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    type TEXT NOT NULL DEFAULT 'distribution',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    project_id INTEGER,
    content TEXT NOT NULL,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    replies INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS idea_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    innovator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    field TEXT NOT NULL,
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    pitch TEXT NOT NULL,
    founder_name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted',
    score INTEGER DEFAULT 0,
    department TEXT,
    review_summary TEXT,
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (innovator_id) REFERENCES users(id)
  );
`)

export default db
