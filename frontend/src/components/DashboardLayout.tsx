import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, ChevronRight, Home, LogOut, Search, Settings, Sparkles, UserCircle2 } from 'lucide-react'
import type { AppNavigationHandler, AppPage } from '../App'
import { clearSession, getUser, homeFor } from '../lib/auth'

type DashboardLayoutProps = {
  title: string
  subtitle: string
  onNavigate: AppNavigationHandler
  onBack: () => void
  children: ReactNode
  onSearch?: (query: string) => void
  notifications?: { id: string; text: string; time?: string }[]
}

type OpenMenu = 'bell' | 'settings' | null
type ViewKey = 'finance' | 'review' | 'investor' | 'innovator'

// Admins can open every view. These are the switcher buttons.
const ADMIN_VIEWS: { label: string; page: AppPage; key: ViewKey }[] = [
  { label: 'Admin finance', page: 'admin', key: 'finance' },
  { label: 'Review ideas', page: 'admin-review', key: 'review' },
  { label: 'Investor view', page: 'investor', key: 'investor' },
  { label: 'Innovator view', page: 'innovator', key: 'innovator' },
]

const BREADCRUMBS: Record<ViewKey, string> = {
  finance: 'Admin finance',
  review: 'Idea review',
  investor: 'Investor overview',
  innovator: 'Innovator overview',
}

// Works out which view this page is from its title.
function viewFromTitle(title: string): ViewKey {
  const lower = title.toLowerCase()
  if (lower.includes('innovator')) return 'innovator'
  if (lower.includes('review')) return 'review'
  if (lower.includes('admin')) return 'finance'
  return 'investor'
}

function DashboardLayout({ title, subtitle, onNavigate, onBack, children, onSearch, notifications = [] }: DashboardLayoutProps) {
  const user = getUser()
  const isAdmin = user?.role === 'admin'
  const currentViewKey = viewFromTitle(title)
  const breadcrumbLabel = BREADCRUMBS[currentViewKey]
  const [menu, setMenu] = useState<OpenMenu>(null)
  const [query, setQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const signOut = () => {
    clearSession()
    onNavigate('landing')
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) onSearch(query.trim())
  }

  const iconBtn =
    'relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:text-orange-600'
  const menuItem = 'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-orange-50'

  return (
    <div className="min-h-screen bg-[#f7f1ea] text-slate-900">
      <header className="border-b border-slate-200 bg-[#f7f1ea]/80 backdrop-blur-md">
        <div className="container-shell flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-orange-200"
              onClick={onBack}
            >
              ←
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{subtitle}</p>
              <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
            </div>
          </div>

          <div ref={menuRef} className="relative hidden items-center gap-3 md:flex">
            <form
              onSubmit={submitSearch}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500"
            >
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search opportunities"
                className="w-44 bg-transparent text-slate-800 outline-none placeholder:text-slate-500"
              />
            </form>

            <button type="button" aria-label="Notifications" className={iconBtn} onClick={() => setMenu(menu === 'bell' ? null : 'bell')}>
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#f97316]" />}
            </button>

            <button type="button" aria-label="Settings" className={iconBtn} onClick={() => setMenu(menu === 'settings' ? null : 'settings')}>
              <Settings className="h-4 w-4" />
            </button>

            {menu === 'bell' && (
              <div className="absolute right-0 top-14 z-30 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Notifications</p>
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-500">You're all caught up.</p>
                ) : (
                  <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.id} className="px-4 py-3 text-sm text-slate-700">
                        {n.text}
                        {n.time && <span className="mt-0.5 block text-xs text-slate-400">{n.time}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {menu === 'settings' && (
              <div className="absolute right-0 top-14 z-30 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                  <UserCircle2 className="h-8 w-8 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user?.full_name ?? 'Guest'}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email ?? 'Not signed in'}</p>
                  </div>
                </div>
                <button type="button" className={menuItem} onClick={() => { setMenu(null); onNavigate(homeFor(user?.role)) }}>
                  <Home className="h-4 w-4" /> My dashboard
                </button>
                <button type="button" className={menuItem} onClick={() => { setMenu(null); onNavigate('landing') }}>
                  <Sparkles className="h-4 w-4" /> Back to home page
                </button>
                <button type="button" className={`${menuItem} border-t border-slate-100 text-red-600`} onClick={signOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container-shell py-6">
        {isAdmin && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 p-3">
            <span className="mr-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Admin view</span>
            {ADMIN_VIEWS.map((view) => (
              <button
                key={view.key}
                type="button"
                onClick={() => onNavigate(view.page)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  view.key === currentViewKey
                    ? 'bg-slate-900 text-white'
                    : 'border border-orange-200 bg-white text-slate-700 hover:border-orange-400'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <button type="button" className="hover:text-orange-600" onClick={() => onNavigate(homeFor(user?.role))}>
              Dashboard
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-slate-900">{breadcrumbLabel}</span>
          </div>

          {!isAdmin && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600"
              onClick={() => onNavigate(user?.role === 'innovator' ? 'idea-request' : 'investor')}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {user?.role === 'innovator' ? 'Submit an idea' : 'Explore more'}
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}

export default DashboardLayout