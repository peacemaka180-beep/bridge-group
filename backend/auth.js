import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import db from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
const revokedTokens = new Set()

export function revokeToken(token) {
  if (typeof token === 'string' && token.trim()) {
    revokedTokens.add(token)
  }
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isStrongPassword(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  )
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const token = authHeader.split(' ')[1]
    if (revokedTokens.has(token)) {
      return res.status(401).json({ message: 'Session revoked.' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' })
    }

    next()
  }
}

export async function ensureSeedUsers() {
  if (process.env.ENABLE_DEMO_DATA !== 'true') {
    return
  }

  const existing = await db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (Number(existing.count) > 0) {
    return
  }

  const users = [
    {
      full_name: 'Amara Okafor',
      email: 'amara@bridgegroup.co',
      password: 'password123',
      role: 'innovator',
      company: 'FarmSense',
      bio: 'Agricultural innovator building climate-smart tools for smallholders.',
      avatar_url: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      full_name: 'James Mwangi',
      email: 'james@bridgegroup.co',
      password: 'password123',
      role: 'investor',
      company: 'Horizon Capital',
      bio: 'Venture partner focused on growth-stage African startups.',
      avatar_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      full_name: 'Bridge Group Admin',
      email: 'admin@bridgegroup.co',
      password: 'password123',
      role: 'admin',
      company: 'Bridge Group',
      bio: 'Platform administrator and ecosystem operator.',
      avatar_url: 'https://images.pexels.com/photos/5384445/pexels-photo-5384445.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
  ]

  const insert = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role, company, bio, avatar_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `)

  for (const user of users) {
    await insert.run(
      user.full_name,
      user.email,
      hashPassword(user.password),
      user.role,
      user.company,
      user.bio,
      user.avatar_url,
    )
  }
}
