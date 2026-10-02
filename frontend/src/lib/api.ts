// frontend/src/lib/api.ts
//
// Thin client around the Bridge Group backend (backend/server.js).
// Every function throws an Error with the backend's `message` on failure,
// so callers can just try/catch and show err.message.

import { API_BASE_URL } from '../config'
import { getToken, clearSession, type SessionUser } from './auth'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // Session expired or invalid — clear it so the UI can fall back to the auth page.
  if (response.status === 401) {
    clearSession()
  }

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.message || `Request failed (${response.status})`)
  }

  return body as T
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export type AuthResponse = {
  token: string
  refreshToken: string | null
  user: SessionUser
}

export function login(email: string, password: string, role?: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  })
}

export function register(input: {
  full_name: string
  email: string
  password: string
  role: 'innovator' | 'investor'
  company?: string
  bio?: string
  avatar_url?: string
}) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function bootstrapAdmin(input: { key: string; full_name: string; email: string; password: string }) {
  const { key, ...account } = input
  return request<AuthResponse>('/api/auth/bootstrap-admin', {
    method: 'POST',
    headers: { 'x-bootstrap-admin-key': key },
    body: JSON.stringify(account),
  })
}

export function requestPasswordReset(email: string) {
  return request<{ message: string }>('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function confirmPasswordReset(token: string, password: string) {
  return request<{ message: string }>('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export function logout() {
  return request<{ message: string }>('/api/auth/logout', { method: 'POST' })
}

export function getProfile() {
  return request<{ user: SessionUser }>('/api/profile/me')
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export function getProjects() {
  return request<{ projects: any[] }>('/api/projects')
}

export function getProject(id: string | number) {
  return request<{ project: any }>(`/api/projects/${id}`)
}

export function createProject(input: Record<string, unknown>) {
  return request<{ project: any }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function approveProject(input: Record<string, unknown>) {
  return request<{ project: any }>('/api/projects/approve', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ---------------------------------------------------------------------------
// Idea requests
// ---------------------------------------------------------------------------
export function getIdeas() {
  return request<{ ideas: any[] }>('/api/ideas')
}

export function getIdea(id: string | number) {
  return request<{ idea: any }>(`/api/ideas/${id}`)
}

export function createIdea(input: Record<string, unknown>) {
  return request<{ idea: any }>('/api/ideas', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateIdeaStatus(id: string | number, input: Record<string, unknown>) {
  return request<{ idea: any }>(`/api/ideas/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

// ---------------------------------------------------------------------------
// Investments
// ---------------------------------------------------------------------------
export function getInvestments() {
  return request<{ investments: any[] }>('/api/investments')
}

export function createInvestment(input: { project_id: number; amount: number; equity_pct?: number }) {
  return request<{ investment: any }>('/api/investments', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------
export function getFinanceSummary() {
  return request<Record<string, any>>('/api/finance/summary')
}

export function getFinanceLedger() {
  return request<{ ledger: any[] }>('/api/finance/ledger')
}

export function createLedgerEntry(input: Record<string, unknown>) {
  return request<{ entry: any }>('/api/finance/ledger', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getAdminFinance() {
  return request<Record<string, any>>('/api/admin/finance')
}

export function getMonetizationSummary() {
  return request<Record<string, any>>('/api/monetization/summary')
}

export function getPortfolioSummary() {
  return request<Record<string, any>>('/api/portfolio/summary')
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export function getMessages() {
  return request<{ messages: any[] }>('/api/messages')
}

export function sendMessage(input: { receiver_id: number; project_id?: number | null; content: string }) {
  return request<{ message: any }>('/api/messages', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------
export function getCommunityPosts(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return request<{ posts: any[] }>(`/api/community/posts${query}`)
}

export function createCommunityPost(input: { category: string; title: string; content: string }) {
  return request<{ post: any }>('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
