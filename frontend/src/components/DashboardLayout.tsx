import type { ReactNode } from 'react'
import { Bell, ChevronRight, Search, Settings, Sparkles } from 'lucide-react'
import type { AppNavigationHandler } from '../App'

type DashboardLayoutProps = {
  title: string
  subtitle: string
  onNavigate: AppNavigationHandler
  onBack: () => void
  children: ReactNode
}

function DashboardLayout({ title, subtitle, onNavigate, onBack, children }: DashboardLayoutProps) {
  const breadcrumbLabel = title.toLowerCase().includes('innovator') ? 'Innovator overview' : 'Investor overview'

  return (
    <div className="min-h-screen bg-[#f7f1ea] text-slate-900">
      <header className="border-b border-slate-200 bg-[#f7f1ea]/80 backdrop-blur-md">
        <div className="container-shell flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700"
              onClick={onBack}
            >
              ←
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{subtitle}</p>
              <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              Search opportunities
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
              <Bell className="h-4 w-4" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="container-shell py-6">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-slate-900">{breadcrumbLabel}</span>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-3 py-2 text-xs font-semibold text-white"
            onClick={() => onNavigate('landing')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Explore more
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

export default DashboardLayout
