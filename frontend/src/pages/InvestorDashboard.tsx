import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Download,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { investments, portfolioRoiData, profiles, projects, transactions } from '../data/mockData'
import DashboardLayout from '../components/DashboardLayout'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import type { AppNavigationHandler } from '../App'
import InspirationalQuotes, { inspirationalPortraits } from '../components/InspirationalQuotes'

const investor = profiles.find((profile) => profile.is_investor && !profile.is_innovator) ?? profiles[1]

const isFirstTimeInvestor = () => {
  const storageValue = localStorage.getItem('bg_first_time_investor')
  return storageValue === null ? true : storageValue === 'true'
}

type FinanceSummary = {
  totalInflow: number
  totalOutflow: number
  netCashFlow: number
  profitLoss: number
  activeInvestments: number
  ledger: Array<{
    id: number
    user_id: number
    category: string
    direction: 'inflow' | 'outflow'
    amount: number
    balance_after: number
    description: string
    status: string
    created_at: string
  }>
}

const getPortfolioState = () => {
  const freshInvestor = isFirstTimeInvestor()

  if (freshInvestor) {
    return {
      totals: { invested: 0, equity: 0, returns: 0 },
      currentValue: 0,
      watchlist: [],
      ledger: [] as FinanceSummary['ledger'],
    }
  }

  return {
    totals: { invested: 0, equity: 0, returns: 0 },
    currentValue: 0,
    watchlist: [],
    ledger: [] as FinanceSummary['ledger'],
  }
}

type InvestorDashboardProps = {
  onNavigate: AppNavigationHandler
}

function InvestorDashboard({ onNavigate }: InvestorDashboardProps) {
  const [finance, setFinance] = useState<FinanceSummary | null>(null)
  const [realProjects, setRealProjects] = useState<any[]>([])
  const [realInvestments, setRealInvestments] = useState<any[]>([])
  const [realMessages, setRealMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const freshInvestor = isFirstTimeInvestor()
  const portfolioState = getPortfolioState()
  const projectMarket = useMemo(() => {
    const source = realProjects.length ? realProjects : projects
    return source.slice(0, 6).map((project) => {
      const fundingGoal = Number(project.funding_goal || 0)
      const fundingRaised = Number(project.funding_raised || 0)
      const progress = fundingGoal ? Math.min(100, Math.round((fundingRaised / fundingGoal) * 100)) : 0
      const projectedReturns = fundingRaised * (Number(project.revenue_share_pct || 0) / 100)
      return {
        ...project,
        progress,
        projectedReturns,
        roi: Number(project.roi_projection || 0),
      }
    })
  }, [realProjects])
  const liveTotals = useMemo(() => {
    if (!realInvestments.length) {
      return { invested: 0, equity: 0, returns: Number(finance?.totalInflow ?? 0) }
    }

    return realInvestments.reduce(
      (acc, item) => {
        const amount = Number(item.amount || 0)
        const equityPct = Number(item.equity_pct || 0)
        acc.invested += amount
        acc.equity += amount * (equityPct / 100)
        acc.returns += Number(finance?.totalInflow ?? 0) / Math.max(realInvestments.length, 1)
        return acc
      },
      { invested: 0, equity: 0, returns: Number(finance?.totalInflow ?? 0) },
    )
  }, [realInvestments, finance])

  const totals = realInvestments.length ? liveTotals : portfolioState.totals
  const currentValue = realInvestments.length ? Math.max(totals.invested + Number(finance?.profitLoss ?? 0), 0) : portfolioState.currentValue
  const watchlist = realInvestments.length ? realInvestments.slice(0, 3).map((investment) => {
    const project = realProjects.find((item) => item.id === investment.project_id) ?? projects[0]
    return {
      ...investment,
      project,
      progress: Math.min(96, Math.max(65, Math.round((Number(investment.amount || 0) / Math.max(Number(project?.funding_goal || 1), 1)) * 100))),
    }
  }) : portfolioState.watchlist
  const featuredProjects = projects.slice(0, 3).map((project) => ({
    ...project,
    progress: Math.min(96, Math.max(30, Math.round((project.funding_raised / project.funding_goal) * 100))),
  }))

  useEffect(() => {
    const token = localStorage.getItem('bg_token')
    if (!token) {
      setLoading(false)
      return
    }

    const loadDashboardData = async () => {
      try {
        const [projectsResponse, investmentsResponse, financeResponse, messagesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/investments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/finance/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          setRealProjects(projectsData.projects ?? [])
        }

        if (investmentsResponse.ok) {
          const investmentsData = await investmentsResponse.json()
          setRealInvestments(investmentsData.investments ?? [])
        }

        if (financeResponse.ok) {
          const financeData = await financeResponse.json()
          setFinance(financeData)
        }

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          setRealMessages(messagesData.messages ?? [])
        }
      } catch (error) {
        console.error('Investor dashboard data load failed:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const livePortfolioItems = realInvestments.length
    ? realInvestments.map((investment) => {
        const project = realProjects.find((item) => item.id === investment.project_id) ?? projects[0]
        return {
          id: investment.id,
          amount: Number(investment.amount),
          progress: 72,
          project_id: investment.project_id,
          project_title: project?.title ?? 'Project',
          project: {
            image_url: project?.image_url,
            innovator_name: project?.innovator_name ?? 'Founder',
          },
        }
      })
    : watchlist

  const latestMarketWindow = realProjects.length
    ? realProjects.slice(0, 3).map((project) => ({
        ...project,
        progress: Math.min(95, Math.max(25, Math.round((Number(project.funding_raised || 0) / Math.max(Number(project.funding_goal || 1), 1)) * 100))),
      }))
    : featuredProjects

  const investorSignals = [
    { label: 'Pipeline strength', value: '81%', detail: 'Improving this quarter', tone: 'emerald' },
    { label: 'Risk sentiment', value: 'Balanced', detail: 'Founders with traction', tone: 'amber' },
    { label: 'Best sector', value: 'Climate', detail: 'Renewable energy leads', tone: 'sky' },
  ]

  const investorAlerts = [
    { title: 'SolarKiosk reopened diligence', detail: 'Operations deck updated with new community validation data.', time: '12m ago', type: 'High priority' },
    { title: 'FarmSense traction update', detail: 'Farmer retention improved after pilot expansion in two regions.', time: '1h ago', type: 'Positive signal' },
    { title: 'New founder intro', detail: 'Dr. Laila Hassan asked for a founder-to-investor Q&A session.', time: '2h ago', type: 'Warm intro' },
  ]

  const sectorMix = [
    { name: 'Climate', value: 38, color: 'bg-orange-500' },
    { name: 'Health', value: 27, color: 'bg-sky-500' },
    { name: 'AI', value: 22, color: 'bg-violet-500' },
    { name: 'Creative', value: 13, color: 'bg-emerald-500' },
  ]

  const investorGoals = [
    { title: 'Close 2 follow-on checks', target: '2 / 2', progress: 100 },
    { title: 'Review 5 new opportunities', target: '3 / 5', progress: 60 },
    { title: 'Build climate portfolio weight', target: '38% / 40%', progress: 95 },
  ]

  const diligenceCalendar = [
    { time: 'Tue 10:30', title: 'SolarKiosk deep dive', host: 'Operations + founder call' },
    { time: 'Wed 14:00', title: 'FarmSense pilot review', host: 'Market traction discussion' },
    { time: 'Thu 09:00', title: 'PulseCheck governance check', host: 'Clinical risk review' },
  ]

  const [selectedWindow, setSelectedWindow] = useState<'3m' | '6m' | '12m'>('6m')

  useEffect(() => {
    const fetchFinance = async () => {
      const token = localStorage.getItem('bg_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/finance/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Finance summary failed to load')
        }

        const data = await response.json()
        setFinance(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchFinance()
  }, [])

  const financeSummary = useMemo(() => {
    const inflow = finance?.totalInflow ?? (freshInvestor ? 0 : totals.returns)
    const outflow = finance?.totalOutflow ?? (freshInvestor ? 0 : totals.invested)
    const net = finance?.netCashFlow ?? inflow - outflow
    const currentPortfolioValue = finance ? totals.invested + finance.profitLoss : currentValue

    return {
      inflow,
      outflow,
      net,
      currentPortfolioValue,
      roi: finance ? ((finance.profitLoss / Math.max(outflow, 1)) * 100) : (freshInvestor ? 0 : 19.4),
      status: net >= 0 ? 'Profit' : 'Loss',
    }
  }, [finance, freshInvestor, totals.invested, totals.returns, currentValue])

  const recentInvestorMessages = realMessages.length ? realMessages.slice(0, 3) : []

  return (
    <DashboardLayout
      title="Investor dashboard"
      subtitle="Portfolio overview"
      onNavigate={onNavigate}
      onBack={() => onNavigate('landing')}
    >
      <div className="space-y-6">
        {freshInvestor && (
          <section className="rounded-[30px] border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">New investor onboarding</p>
                <h2 className="mt-3 text-3xl font-black text-slate-900">Start building your portfolio with high-potential opportunities.</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Pick a deal, track your progress, and build confidence through smarter early-stage investing.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() => onNavigate('landing')}
                >
                  Explore deals
                </button>
                <button
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
                  onClick={() => onNavigate('project-detail', featuredProjects[0].id)}
                >
                  View featured project
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard title="Portfolio value" value={`$${Math.round(financeSummary.currentPortfolioValue).toLocaleString()}`} change={`${financeSummary.roi.toFixed(1)}%`} trend="up" accent="orange" />
          <StatCard title="Invested" value={`$${totals.invested.toLocaleString()}`} change={loading ? 'Syncing' : `${finance?.activeInvestments ?? investments.length} active bets`} trend="neutral" accent="slate" />
          <StatCard title="Returns" value={`$${Math.round(financeSummary.inflow).toLocaleString()}`} change={loading ? 'Loading ledger' : 'Live payouts'} trend="up" accent="green" />
          <StatCard title="Net cashflow" value={`$${Math.round(financeSummary.net).toLocaleString()}`} change={finance ? 'Updated live' : 'Projected'} trend="up" accent="amber" />
        </section>

        <InspirationalQuotes
          eyebrow="Investor perspective"
          heading="Patience, value, and long-term thinking"
          quotes={[
            { person: 'Warren Buffett', title: 'Investor', quote: 'Price is what you pay. Value is what you get.', image: inspirationalPortraits.warrenBuffett },
            { person: 'Sun Tzu', title: 'Strategist', quote: 'Victorious warriors win first and then go to war.', image: inspirationalPortraits.sunTzu },
            { person: 'Confucius', title: 'Wisdom teacher', quote: 'The superior man is modest in his speech, but exceeds in his actions.', image: inspirationalPortraits.confucius },
          ]}
        />

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bridge Group marketplace</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">All active projects</h3>
            </div>
            <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">View all projects</button>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {projectMarket.map((project) => (
              <button
                key={project.id}
                onClick={() => onNavigate('project-detail', project.id)}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{project.category}</p>
                    <h4 className="mt-2 text-lg font-extrabold text-slate-900">{project.title}</h4>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">{project.roi}% ROI</span>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-white p-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Raised</p>
                    <p className="mt-1 font-bold text-slate-900">${Number(project.funding_raised || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-white p-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Returns</p>
                    <p className="mt-1 font-bold text-slate-900">${Math.round(project.projectedReturns).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Portfolio trend</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Return growth</h3>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                {(['3m', '6m', '12m'] as const).map((window) => (
                  <button
                    key={window}
                    type="button"
                    onClick={() => setSelectedWindow(window)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${selectedWindow === window ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    {window}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioRoiData}>
                  <defs>
                    <linearGradient id="returnsFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => {
                      const numeric = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0)
                      return [`$${numeric.toLocaleString()}`, 'Portfolio value']
                    }}
                    contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} fill="url(#returnsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Snapshot</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Current view</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-sm text-slate-600">Portfolio value</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-slate-900">${currentValue.toLocaleString()}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">+19%</span>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Cash on hand</span>
                  <span className="font-semibold text-slate-900">$74K</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Active investments</span>
                  <span className="font-semibold text-slate-900">{investments.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Yield this quarter</span>
                  <span className="font-semibold text-slate-900">$18.4K</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Portfolio analytics</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Revenue, ROI and profit/loss</h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${financeSummary.status === 'Profit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {financeSummary.status}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Revenue inflow</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">${Math.round(financeSummary.inflow).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Capital outflow</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">${Math.round(financeSummary.outflow).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Net ROI</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{Math.max(0, financeSummary.roi).toFixed(1)}%</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                <span>Net position</span>
                <span className={`font-bold ${financeSummary.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${Math.round(financeSummary.net).toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${financeSummary.net >= 0 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-rose-500 to-orange-400'}`}
                  style={{ width: `${Math.min(100, Math.max(10, Math.abs(financeSummary.net) / Math.max(financeSummary.outflow || 1, 1) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI view</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Signal summary</h3>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">
                <Sparkles className="h-3.5 w-3.5" />
                AI view
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {investorSignals.map((signal) => (
                <div key={signal.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{signal.label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">{signal.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{signal.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {investorGoals.map((goal) => (
                <div key={goal.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{goal.title}</p>
                    <span className="text-xs font-semibold text-slate-500">{goal.target}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Direct messaging</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">One-on-one with innovators</h3>
              </div>
              <button className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">New message</button>
            </div>

            <div className="space-y-3">
              {recentInvestorMessages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={message.sender_avatar} alt={message.sender_name} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900">{message.sender_name}</p>
                        <p className="text-xs text-slate-500">{message.project_id ? 'Project chat' : 'Investor note'}</p>
                      </div>
                    </div>
                    <MessageSquareText className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{message.content}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>{new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <button className="text-orange-600">Open thread</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Allocation</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Sector mix</h3>
            </div>

            <div className="space-y-4">
              {sectorMix.map((sector) => (
                <div key={sector.name}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                    <span>{sector.name}</span>
                    <span className="font-semibold text-slate-900">{sector.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full rounded-full ${sector.color}`} style={{ width: `${sector.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Direct messaging</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">One-on-one with innovators</h3>
              </div>
              <button className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">New message</button>
            </div>

            <div className="space-y-3">
              {recentInvestorMessages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={message.sender_avatar} alt={message.sender_name} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900">{message.sender_name}</p>
                        <p className="text-xs text-slate-500">{message.project_id ? `Project chat` : 'Investor note'}</p>
                      </div>
                    </div>
                    <MessageSquareText className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{message.content}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>{new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <button className="text-orange-600">Open thread</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Investments</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Active portfolio</h3>
              </div>
              <button className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">View all</button>
            </div>

            <div className="space-y-4">
              {watchlist.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-lg font-extrabold text-slate-900">Your portfolio is ready to start</p>
                    <p className="mt-2 text-sm text-slate-600">
                      You have not invested yet, but these curated opportunities are a strong place to begin.
                    </p>
                  </div>

                  {featuredProjects.map((project) => (
                    <button
                      key={project.id}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50"
                      onClick={() => onNavigate('project-detail', project.id)}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <img src={project.image_url} alt={project.title} className="h-16 w-16 rounded-2xl object-cover" />
                          <div>
                            <p className="text-base font-bold text-slate-900">{project.title}</p>
                            <p className="text-sm text-slate-500">{project.innovator_name}</p>
                          </div>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-sm text-slate-500">Projected ROI</p>
                          <p className="text-lg font-bold text-slate-900">{project.roi_projection}%</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                          <span>Funding progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <ProgressBar value={project.progress} color="#f97316" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                livePortfolioItems.map((item) => (
                  <button
                    key={item.id}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50"
                    onClick={() => onNavigate('project-detail', item.project_id)}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <img src={item.project?.image_url} alt={item.project_title} className="h-16 w-16 rounded-2xl object-cover" />
                        <div>
                          <p className="text-base font-bold text-slate-900">{item.project_title}</p>
                          <p className="text-sm text-slate-500">{item.project?.innovator_name}</p>
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-sm text-slate-500">Invested</p>
                        <p className="text-lg font-bold text-slate-900">${item.amount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Funding progress</span>
                        <span>{item.progress}%</span>
                      </div>
                      <ProgressBar value={item.progress} color="#f97316" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Insights</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Market pulse</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Top category</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">+12%</span>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">Renewable Energy</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Best performer</p>
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-xl font-extrabold text-slate-900">SolarKiosk</p>
                <p className="text-sm text-slate-600">Projected ROI: 32%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Activity</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Recent transactions</h3>
              </div>
              <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                Export
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {freshInvestor ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <p className="text-lg font-extrabold text-slate-900">No transactions yet</p>
                  <p className="mt-2 text-sm text-slate-600">Your account is ready for a first investment when you are ready.</p>
                </div>
              ) : (
                <>
                  {(finance?.ledger ?? []).slice(0, 6).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div>
                        <p className="font-semibold text-slate-900">{entry.category}</p>
                        <p className="text-xs text-slate-500">{entry.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${entry.direction === 'inflow' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {entry.direction === 'inflow' ? '+' : '-'}${entry.amount.toLocaleString()}
                        </p>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{entry.direction}</p>
                      </div>
                    </div>
                  ))}

                  {!finance && (
                    transactions.slice(0, 4).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div>
                          <p className="font-semibold text-slate-900">{transaction.project_title}</p>
                          <p className="text-xs text-slate-500">{transaction.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">+${transaction.amount.toLocaleString()}</p>
                          <p className="text-xs uppercase tracking-[0.12em] text-emerald-600">{transaction.type}</p>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Alerts</p>
                  <h3 className="mt-2 text-xl font-extrabold text-slate-900">Deal radar</h3>
                </div>
                <Bell className="h-4 w-4 text-orange-600" />
              </div>

              <div className="space-y-3">
                {investorAlerts.map((alert) => (
                  <div key={alert.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{alert.title}</p>
                      <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">{alert.type}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{alert.detail}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{alert.time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Diligence</p>
                  <h3 className="mt-2 text-xl font-extrabold text-slate-900">Upcoming calls</h3>
                </div>
                <CalendarClock className="h-4 w-4 text-sky-600" />
              </div>

              <div className="space-y-3">
                {diligenceCalendar.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.time}</p>
                    <p className="mt-1 font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.host}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Profile</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Investor overview</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <img src={investor.avatar_url} alt={investor.full_name} className="h-14 w-14 rounded-full object-cover" />
              <div>
                <p className="text-lg font-bold text-slate-900">{investor.full_name}</p>
                <p className="text-sm text-slate-600">{investor.company}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span>Portfolio health</span>
                <span className="font-semibold text-emerald-600">Strong</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span>Risk appetite</span>
                <span className="font-semibold text-slate-900">Balanced</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span>Primary focus</span>
                <span className="font-semibold text-slate-900">Climate + AI</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trust score</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Due diligence</h3>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Founder quality</p>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">92%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Market signal</p>
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">8.6/10</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default InvestorDashboard
