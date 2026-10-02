import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from './db.js'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!JWT_SECRET) throw new Error('JWT_SECRET is required')

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isStrongPassword(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

export function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password, hash) {
  if (typeof hash !== 'string' || !hash) return Promise.resolve(false)
  return bcrypt.compare(password, hash)
}

export function createToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  let payload
  try {
    payload = jwt.verify(authHeader.slice('Bearer '.length), JWT_SECRET)
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' })
  }

  const user = await db
    .prepare('SELECT id, full_name, email, role, company, bio, avatar_url FROM users WHERE id = $1')
    .get(payload.sub)

  if (!user) {
    return res.status(401).json({ message: 'Account no longer exists.' })
  }

  req.user = user
  next()
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' })
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' })
    }
    next()
  }
}