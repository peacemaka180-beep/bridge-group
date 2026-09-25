import db from './db.js'

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '')
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required')

const supabaseRequest = async (path, options = {}) => {
  const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    ...options,
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.msg || body.error_description || body.message || 'Supabase authentication failed')
  return body
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isStrongPassword(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

export async function signUp({ email, password, metadata }) {
  return supabaseRequest('/signup', { method: 'POST', body: JSON.stringify({ email, password, data: metadata }) })
}

export async function signIn(email, password) {
  return supabaseRequest('/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export async function signOut(accessToken) {
  await supabaseRequest('/logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
}

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required.' })

  try {
    const accessToken = authHeader.slice('Bearer '.length)
    const authUser = await supabaseRequest('/user', { headers: { Authorization: `Bearer ${accessToken}` } })
    const user = await db.prepare('SELECT id, full_name, email, role, company, bio, avatar_url FROM users WHERE auth_user_id = $1').get(authUser.id)
    if (!user) return res.status(403).json({ message: 'Account profile is not configured.' })
    req.user = user
    req.authUser = authUser
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired Supabase session.' })
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' })
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'You do not have permission to access this resource.' })
    next()
  }
}
