import { useCallback, useEffect, useRef, useState } from 'react'
import AdminDashboard from './pages/AdminDashboard'
import AdminReviewPage from './pages/AdminReviewPage'
import AuthPage from './pages/AuthPage'
import DepartmentReviewPage from './pages/DepartmentReviewPage'
import IdeaRequestPage from './pages/IdeaRequestPage'
import InnovatorDashboard from './pages/InnovatorDashboard'
import InvestorDashboard from './pages/InvestorDashboard'
import LandingPage from './pages/LandingPage'
import ProjectApprovalPage from './pages/ProjectApprovalPage'
import ProjectDetail from './pages/ProjectDetail'
import { projects } from './data/mockData'
import { clearSession, getToken, getUser, homeFor } from './lib/auth'

export type AppPage =
  | 'landing'
  | 'investor'
  | 'innovator'
  | 'admin'
  | 'admin-review'
  | 'idea-request'
  | 'department-review'
  | 'auth'
  | 'project-detail'
  | 'project-approval'
export type AppNavigationHandler = (page: AppPage, projectId?: string) => void

const ALL_PAGES: AppPage[] = [
  'landing', 'investor', 'innovator', 'admin', 'admin-review',
  'idea-request', 'department-review', 'auth', 'project-detail', 'project-approval',
]

// Pages anyone can open without signing in.
const PUBLIC_PAGES: AppPage[] = ['landing', 'auth', 'project-detail']

// Pages each role may open. Edit this list if your rules differ.
const ROLE_PAGES: Record<string, AppPage[]> = {
  investor: ['investor'],
  innovator: ['innovator', 'idea-request'],
  admin: ['admin', 'admin-review', 'department-review', 'project-approval', 'investor', 'innovator', 'idea-request'],
}

type Route = { page: AppPage; projectId?: string; resetToken?: string }

// Returns false (and clears the session) if the saved JWT has expired.
function tokenIsValid(): boolean {
  const token = getToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      clearSession()
      return false
    }
    return true
  } catch {
    return true // not decodable: let the server decide
  }
}

function guard(page: AppPage): AppPage {
  // Already signed in? Skip the sign-in page and go to your dashboard.
  if (page === 'auth') {
    const user = getUser()
    return tokenIsValid() && user ? homeFor(user.role) : 'auth'
  }
  if (PUBLIC_PAGES.includes(page)) return page
  if (!tokenIsValid()) return 'auth'
  const role = getUser()?.role
  if (role && ROLE_PAGES[role]?.includes(page)) return page
  return homeFor(role)
}



function readRoute(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [p, id, token] = raw.split('/')
  const requested = ALL_PAGES.includes(p as AppPage) ? (p as AppPage) : null
  if (requested === 'auth' && id === 'reset' && token) {
    return { page: 'auth', resetToken: decodeURIComponent(token) }
  }
  const projectId = id ? decodeURIComponent(id) : undefined

  if (!requested) {
    return { page: tokenIsValid() ? homeFor(getUser()?.role) : 'landing' }
  }
  return { page: guard(requested), projectId }
}

function toHash(page: AppPage, projectId?: string, resetToken?: string) {
  if (page === 'auth' && resetToken) return `#/auth/reset/${encodeURIComponent(resetToken)}`
  return `#/${page}${projectId ? `/${encodeURIComponent(projectId)}` : ''}`
}

function App() {
  const [route, setRoute] = useState<Route>(readRoute)
  const lastProjectId = useRef<string | null>(route.projectId ?? projects[0]?.id ?? null)

  if (route.projectId) lastProjectId.current = route.projectId
  const selectedProjectId = route.projectId ?? lastProjectId.current

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const target = toHash(route.page, route.projectId, route.resetToken)
    if (window.location.hash !== target) {
      window.history.replaceState(null, '', target)
    }
    window.scrollTo(0, 0)
  }, [route])

  const handleNavigate: AppNavigationHandler = useCallback((nextPage, projectId) => {
    const page = guard(nextPage)
    const id = projectId ?? lastProjectId.current ?? undefined
    const needsId = page === 'project-detail' || page === 'department-review' || page === 'project-approval'
    const next: Route = { page, projectId: needsId ? id : undefined }
    const hash = toHash(next.page, next.projectId)
    if (window.location.hash === hash) {
      setRoute(next)
    } else {
      window.location.hash = hash
    }
  }, [])

  const { page } = route
  const fallbackId = selectedProjectId ?? projects[0]?.id ?? 'idea-1'

  if (page === 'investor') return <InvestorDashboard onNavigate={handleNavigate} />
  if (page === 'innovator') return <InnovatorDashboard onNavigate={handleNavigate} />
  if (page === 'idea-request') return <IdeaRequestPage onNavigate={handleNavigate} />
  if (page === 'admin') return <AdminDashboard onNavigate={handleNavigate} />
  if (page === 'admin-review') return <AdminReviewPage onNavigate={handleNavigate} />
  if (page === 'department-review') return <DepartmentReviewPage onNavigate={handleNavigate} ideaId={fallbackId} />
  if (page === 'project-approval') return <ProjectApprovalPage onNavigate={handleNavigate} ideaId={fallbackId} />
  if (page === 'auth') return <AuthPage onNavigate={handleNavigate} resetToken={route.resetToken} />
  if (page === 'project-detail') return <ProjectDetail projectId={fallbackId} onNavigate={handleNavigate} />

  return <LandingPage onNavigate={handleNavigate} />
}

export default App