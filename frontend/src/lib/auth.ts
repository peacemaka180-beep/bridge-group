// frontend/src/lib/auth.ts
//
// Local storage helpers for the logged-in session. Keys match the
// `bg_token` / `bg_user` convention already used across the dashboard
// pages (AdminDashboard, InvestorDashboard, InnovatorDashboard, etc).
// The backend issues a stateless JWT (see backend/auth.js createToken),
// so "logging out" just means discarding it here — nothing to
// invalidate server-side.

export type SessionUser = {
  id: number
  full_name: string
  email: string
  role: 'innovator' | 'investor' | 'admin'
  company?: string | null
  bio?: string | null
  avatar_url?: string | null
}

const TOKEN_KEY = 'bg_token'
const USER_KEY = 'bg_user'
const SEEN_KEY = 'bg_seen_users'

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))

  // Existing pages key their "first time" onboarding banners off these.
  // They are true only the first time this account signs in on this browser.
  let seen: number[] = []
  try {
    seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
  } catch {
    seen = []
  }
  const isFirstVisit = !seen.includes(user.id)
  if (isFirstVisit) {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, user.id]))
  }
  localStorage.setItem('bg_first_time_investor', String(isFirstVisit && user.role === 'investor'))
  localStorage.setItem('bg_first_time_founder', String(isFirstVisit && user.role === 'innovator'))
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isLoggedIn(): boolean {
  return Boolean(getToken())
}

export function homeFor(role?: string): 'admin' | 'innovator' | 'investor' | 'landing' {
  if (role === 'admin') return 'admin'
  if (role === 'innovator') return 'innovator'
  if (role === 'investor') return 'investor'
  return 'landing'
}