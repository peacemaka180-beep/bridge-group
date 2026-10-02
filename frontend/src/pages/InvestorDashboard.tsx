import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  CalendarClock,
  Download,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
  X,
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
import { API_BASE_URL } from '../config'
import { portfolioRoiData, profiles, projects, transactions } from '../data/mockData'
import DashboardLayout from '../components/DashboardLayout'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import type { AppNavigationHandler } from '../App'
import { clearSession, getToken, getUser } from '../lib/auth'

const demoInvestor = profiles.find((profile) => profile.is_investor && !profile.is_innovator) ?? profiles[1]

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

type InvestorRow = {
  id: number
  full_name: string
  email: string
  company: string | null
  avatar_url: string | null
  total_invested: number
  positions: number
  inflow: number
  outflow: number
}

/* ---------- small helpers for downloads and calendar invites ---------- */

const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const pad = (n: number) => String(n).padStart(2, '0')

// Turns a label like "Tue 10:30" into the next date that falls on that day/time.
function nextSlot(label: string): Date | null {
  const [day, clock] = label.split(' ')
  const [h, m] = (clock ?? '').split(':').map(Number)
  if (!(day in DAY_INDEX) || Number.isNaN(h) || Number.isNaN(m)) return null
  const d = new Date()
  d.setHours(h, m, 0, 0)
  d.setDate(d.getDate() + ((DAY_INDEX[day] - d.getDay() + 7) % 7))
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 7)
  return d
}

const icsStamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
const money = (value: unknown) => `$${Math.round(Number(value) || 0).toLocaleString()}`

type InvestorDashboardProps = {
  onNavigate: AppNavigationHandler
}

type Composer = { projectId: string; receiverId?: string; replyTo?: any } | null

function InvestorDashboard({ onNavigate }: InvestorDashboardProps) {
  const currentUser = getUser()
  const isAdmin = currentUser?.role === 'admin'

  const [finance, setFinance] = useState<FinanceSummary | null>(null)
  const [realProjects, setRealProjects] = useState<any[]>([])
  const [realInvestments, setRealInvestments] = useState<any[]>([])
  const [realMessages, setRealMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portfolioLoading, setPortfolioLoading] = useState(true)

  // Admin only: every investor, and which one the dashboard is showing.
  const [investorList, setInvestorList] = useState<InvestorRow[]>([])
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null)

  // UI state for the buttons that used to do nothing
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [showAllPortfolio, setShowAllPortfolio] = useState(false)
  const [selectedWindow, setSelectedWindow] = useState<'3m' | '6m' | '12m'>('6m')
  const [composer, setComposer] = useState<Composer>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [composeError, setComposeError] = useState('')
  const [notice, setNotice] = useState('')

  // Admins never see the new-investor onboarding.
  const freshInvestor = isFirstTimeInvestor() && !isAdmin

  const showNotice = (text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` })

  const handleExpiredSession = () => {
    clearSession()
    onNavigate('auth')
  }

  const selectedInvestor = investorList.find((item) => item.id === selectedInvestorId) ?? null

  /* ---------- marketplace list (search + view all) ---------- */

  const allMarket = useMemo(() => {
    const source = realProjects.length ? realProjects : projects
    return source.map((project) => {
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

  const filteredMarket = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allMarket
    return allMarket.filter((project) =>
      [project.title, project.category, project.category_name, project.innovator_name]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    )
  }, [allMarket, searchQuery])

  const visibleMarket = showAllProjects || searchQuery.trim() ? filteredMarket : filteredMarket.slice(0, 6)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query) document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const featuredProjects = projects.slice(0, 3).map((project) => ({
    ...project,
    progress: Math.min(96, Math.max(30, Math.round((project.funding_raised / project.funding_goal) * 100))),
  }))

  /* ---------- data loading ---------- */

  const refreshMessages = async () => {
    const response = await fetch(`${API_BASE_URL}/api/messages`, { headers: authHeaders() })
    if (response.status === 401) return handleExpiredSession()
    if (response.ok) {
      const data = await response.json()
      setRealMessages(data.messages ?? [])
    }
  }

  // 1. Things every viewer needs: projects, messages (and the investor list for admins).
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const responses = await Promise.all([
          fetch(`${API_BASE_URL}/api/projects`, { headers }),
          fetch(`${API_BASE_URL}/api/messages`, { headers }),
          ...(isAdmin ? [fetch(`${API_BASE_URL}/api/admin/investors`, { headers })] : []),
        ])

        if (responses.some((r) => r.status === 401)) {
          handleExpiredSession()
          return
        }

        const [projectsResponse, messagesResponse, investorsResponse] = responses

        if (projectsResponse.ok) {
          const data = await projectsResponse.json()
          setRealProjects(data.projects ?? [])
        }
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setRealMessages(data.messages ?? [])
        }
        if (investorsResponse?.ok) {
          const data = await investorsResponse.json()
          const list: InvestorRow[] = data.investors ?? []
          setInvestorList(list)
          setSelectedInvestorId((current) => current ?? list[0]?.id ?? null)
        }
      } catch (error) {
        console.error('Investor dashboard data load failed:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. The portfolio: your own, or (for admins) the investor picked above.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setPortfolioLoading(false)
      return
    }

    if (isAdmin && selectedInvestorId == null) {
      setRealInvestments([])
      setFinance(null)
      setPortfolioLoading(false)
      return
    }

    let cancelled = false
    const headers = { Authorization: `Bearer ${token}` }

    const loadPortfolio = async () => {
      setPortfolioLoading(true)
      try {
        if (isAdmin) {
          const response = await fetch(`${API_BASE_URL}/api/admin/investors/${selectedInvestorId}/portfolio`, { headers })
          if (response.status === 401) return handleExpiredSession()
          if (cancelled) return
          if (response.ok) {
            const data = await response.json()
            setRealInvestments(data.investments ?? [])
            setFinance(data.finance ?? null)
          }
        } else {
          const [investmentsResponse, financeResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/investments`, { headers }),
            fetch(`${API_BASE_URL}/api/finance/summary`, { headers }),
          ])
          if (investmentsResponse.status === 401 || financeResponse.status === 401) return handleExpiredSession()
          if (cancelled) return
          if (investmentsResponse.ok) {
            const data = await investmentsResponse.json()
            setRealInvestments(data.investments ?? [])
          }
          if (financeResponse.ok) {
            setFinance(await financeResponse.json())
          }
        }
      } catch (error) {
        console.error('Portfolio load failed:', error)
      } finally {
        if (!cancelled) setPortfolioLoading(false)
      }
    }

    loadPortfolio()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedInvestorId])

  /* ---------- portfolio numbers ---------- */

  // Invested = money you put in. Returns = money paid back to you.
  // Portfolio value = invested at cost + returns received (no price changes are tracked).
  const invested = useMemo(
    () => realInvestments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [realInvestments],
  )

  const financeSummary = useMemo(() => {
    const returns = Number(finance?.totalInflow ?? 0)
    const outflow = Number(finance?.totalOutflow ?? 0)
    const net = Number(finance?.netCashFlow ?? returns - outflow)
    return {
      inflow: returns,
      outflow,
      net,
      value: invested + returns,
      roi: invested > 0 ? (returns / invested) * 100 : 0,
      inProfit: net >= 0,
    }
  }, [finance, invested])

  const livePortfolioItems = realInvestments.map((investment) => {
    const project = realProjects.find((item) => String(item.id) === String(investment.project_id))
    const goal = Number(investment.funding_goal ?? project?.funding_goal ?? 0)
    const raised = Number(investment.funding_raised ?? project?.funding_raised ?? 0)
    return {
      id: investment.id,
      amount: Number(investment.amount || 0),
      progress: goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0,
      project_id: investment.project_id,
      project_title: investment.project_title ?? project?.title ?? 'Project',
      project: {
        image_url: investment.image_url ?? project?.image_url,
        innovator_name: project?.innovator_name ?? 'Founder',
      },
    }
  })

  const hasInvestments = livePortfolioItems.length > 0
  const visiblePortfolioItems = showAllPortfolio ? livePortfolioItems : livePortfolioItems.slice(0, 3)
  const syncing = loading || portfolioLoading

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

  const chartData = useMemo(() => {
    const months = { '3m': 3, '6m': 6, '12m': 12 }[selectedWindow]
    return portfolioRoiData.slice(-months)
  }, [selectedWindow])

  const recentInvestorMessages = realMessages.length ? realMessages.slice(0, 3) : []

  // Whose profile to show in the "Investor overview" card.
  const profileName = isAdmin ? selectedInvestor?.full_name : currentUser?.full_name ?? demoInvestor.full_name
  const profileSub = isAdmin
    ? selectedInvestor?.company || selectedInvestor?.email
    : currentUser?.company || currentUser?.email || demoInvestor.company
  const profileAvatar = isAdmin ? selectedInvestor?.avatar_url : currentUser?.avatar_url ?? demoInvestor.avatar_url

  // The transactions list shows an empty message when there is nothing real to show.
  const ledgerRows = finance?.ledger ?? []
  const showEmptyTransactions = finance ? ledgerRows.length === 0 : freshInvestor || isAdmin
  const showDemoTransactions = !finance && !freshInvestor && !isAdmin

  /* ---------- actions ---------- */

  const scrollToMarketplace = () =>
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Only real projects (from the database) have a founder you can message.
  const messageTargets: any[] = realProjects.filter((project) => project.innovator_id)

  const openComposer = (projectId?: string | number | null, replyTo?: any) => {
    setDraft('')
    setComposeError('')
    const me = Number(getUser()?.id)
    // When replying, the recipient is the other person in that message.
    const receiverId = replyTo
      ? String(Number(replyTo.sender_id) === me ? replyTo.receiver_id : replyTo.sender_id)
      : undefined
    setComposer({ projectId: projectId != null ? String(projectId) : '', receiverId, replyTo })
  }

  const closeComposer = () => {
    setComposer(null)
    setDraft('')
    setComposeError('')
  }

  const sendMessage = async () => {
    if (!composer) return
    const content = draft.trim()
    if (!content || (!composer.projectId && !composer.receiverId)) {
      setComposeError('Choose a project and write a message first.')
      return
    }
    const project = messageTargets.find((item) => String(item.id) === composer.projectId)
    const receiverId = composer.receiverId ?? project?.innovator_id
    if (!receiverId) {
      setComposeError('Could not find who to send this to.')
      return
    }

    setSending(true)
    setComposeError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          receiver_id: Number(receiverId),
          project_id: project?.id ?? composer.replyTo?.project_id ?? null,
          content,
        }),
      })
      if (response.status === 401) return handleExpiredSession()
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || err.error || 'Message could not be sent.')
      }
      await refreshMessages()
      closeComposer()
      showNotice('Message sent.')
    } catch (error) {
      setComposeError(error instanceof Error ? error.message : 'Message could not be sent.')
    } finally {
      setSending(false)
    }
  }

  const exportTransactions = () => {
    let header: string[] = []
    let rows: unknown[][] = []

    if (ledgerRows.length) {
      header = ['id', 'category', 'direction', 'amount', 'balance_after', 'description', 'status', 'created_at']
      rows = ledgerRows.map((e) => [e.id, e.category, e.direction, e.amount, e.balance_after, e.description, e.status, e.created_at])
    } else if (showDemoTransactions) {
      header = ['id', 'project', 'description', 'amount', 'type']
      rows = transactions.map((t) => [t.id, t.project_title, t.description, t.amount, t.type])
    }

    if (!rows.length) {
      showNotice('No transactions to export yet.')
      return
    }

    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    downloadFile('transactions.csv', csv, 'text/csv;charset=utf-8')
    showNotice('Transactions exported.')
  }

  const addToCalendar = (item: { time: string; title: string; host: string }) => {
    const start = nextSlot(item.time)
    if (!start) {
      showNotice('Could not read the call time.')
      return
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bridge Group//Dashboard//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}-${item.title.replace(/\s+/g, '-')}@bridgegroup`,
      `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${item.title}`,
      `DESCRIPTION:${item.host}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    downloadFile(`${item.title.replace(/\s+/g, '-')}.ics`, ics, 'text/calendar;charset=utf-8')
    showNotice('Calendar invite downloaded.')
  }

  const totalAcrossInvestors = investorList.reduce((sum, item) => sum + item.total_invested, 0)

  return (
    <DashboardLayout
      title="Investor dashboard"
      subtitle="Portfolio overview"
      onNavigate={onNavigate}
      onBack={() => onNavigate('landing')}
      onSearch={handleSearch}
      notifications={investorAlerts.map((alert, index) => ({ id: String(index), text: alert.title, time: alert.time }))}
    >
      <div className="space-y-6">
        {isAdmin && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin view</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">All investor portfolios</h3>
              </div>
              <p className="text-sm text-slate-600">
                {investorList.length} {investorList.length === 1 ? 'investor' : 'investors'} · {money(totalAcrossInvestors)} invested in total
              </p>
            </div>

            {investorList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                No investors have signed up yet.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {investorList.map((item) => {
                  const selected = item.id === selectedInvestorId
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedInvestorId(item.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50 hover:border-orange-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.avatar_url ? (
                          <img src={item.avatar_url} alt={item.full_name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                            {item.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{item.full_name}</p>
                          <p className="truncate text-xs text-slate-500">{item.company || item.email}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Invested</p>
                          <p className="font-bold text-slate-900">{money(item.total_invested)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Returns</p>
                          <p className="font-bold text-slate-900">{money(item.inflow)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Positions</p>
                          <p className="font-bold text-slate-900">{item.positions}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {selectedInvestor && (
              <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
                The numbers below show <strong>{selectedInvestor.full_name}</strong>'s portfolio.
              </p>
            )}
          </section>
        )}

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
                  type="button"
                  className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={scrollToMarketplace}
                >
                  Explore deals
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
                  onClick={() => onNavigate('project-detail', realProjects[0] ? String(realProjects[0].id) : featuredProjects[0].id)}
                >
                  View featured project
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard title="Portfolio value" value={money(financeSummary.value)} change={`${financeSummary.roi.toFixed(1)}% return`} trend="up" accent="orange" />
          <StatCard title="Invested" value={money(invested)} change={syncing ? 'Syncing' : `${finance?.activeInvestments ?? realInvestments.length} active bets`} trend="neutral" accent="slate" />
          <StatCard title="Returns" value={money(financeSummary.inflow)} change={syncing ? 'Loading ledger' : 'Payouts received'} trend="up" accent="green" />
          <StatCard title="Net cashflow" value={money(financeSummary.net)} change={finance ? 'Updated live' : 'No data yet'} trend="up" accent="amber" />
        </section>

        <section id="marketplace" className="scroll-mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bridge Group marketplace</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                {searchQuery.trim() ? `Results for “${searchQuery.trim()}”` : 'All active projects'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {searchQuery.trim() && (
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-200"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              )}
              {!searchQuery.trim() && allMarket.length > 6 && (
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-200"
                  onClick={() => setShowAllProjects((value) => !value)}
                >
                  {showAllProjects ? 'Show fewer' : `View all projects (${allMarket.length})`}
                </button>
              )}
            </div>
          </div>

          {visibleMarket.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No projects match your search. Try a different name or category.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {visibleMarket.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  onClick={() => onNavigate('project-detail', String(project.id))}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{project.category ?? project.category_name}</p>
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
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Portfolio trend</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Return growth</h3>
                <p className="mt-1 text-xs text-slate-500">Sample trend, not calculated from your investments.</p>
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
                <AreaChart data={chartData}>
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
                  <span className="text-3xl font-extrabold text-slate-900">{money(financeSummary.value)}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{financeSummary.roi.toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Capital invested</span>
                  <span className="font-semibold text-slate-900">{money(invested)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Active investments</span>
                  <span className="font-semibold text-slate-900">{finance?.activeInvestments ?? realInvestments.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Returns received</span>
                  <span className="font-semibold text-slate-900">{money(financeSummary.inflow)}</span>
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
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${financeSummary.inProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {financeSummary.inProfit ? 'Profit' : 'Not yet in profit'}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Revenue inflow</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{money(financeSummary.inflow)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Capital outflow</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{money(financeSummary.outflow)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Return on invested</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{financeSummary.roi.toFixed(1)}%</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                <span>Net position</span>
                <span className={`font-bold ${financeSummary.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {money(financeSummary.net)}
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
              <button
                type="button"
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                onClick={() => openComposer()}
              >
                New message
              </button>
            </div>

            <div className="space-y-3">
              {recentInvestorMessages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">
                  No messages yet. Use “New message” to start a conversation with a founder.
                </div>
              )}

              {recentInvestorMessages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {message.sender_avatar ? (
                        <img src={message.sender_avatar} alt={message.sender_name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                          {String(message.sender_name ?? '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">
                          {Number(message.sender_id) === Number(currentUser?.id) ? `You → ${message.receiver_name}` : message.sender_name}
                        </p>
                        <p className="text-xs text-slate-500">{message.project_id ? 'Project chat' : 'Investor note'}</p>
                      </div>
                    </div>
                    <MessageSquareText className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{message.content}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>{new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <button type="button" className="text-orange-600 hover:underline" onClick={() => openComposer(message.project_id, message)}>
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Allocation</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Sector mix</h3>
              <p className="mt-1 text-xs text-slate-500">Sample allocation.</p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Investments</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Active portfolio</h3>
              </div>
              {livePortfolioItems.length > 3 && (
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  onClick={() => setShowAllPortfolio((value) => !value)}
                >
                  {showAllPortfolio ? 'Show fewer' : `View all (${livePortfolioItems.length})`}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {!hasInvestments ? (
                isAdmin ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-lg font-extrabold text-slate-900">
                      {selectedInvestor ? `${selectedInvestor.full_name} has not invested yet` : 'Choose an investor above'}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">Their investments will appear here once they invest in a project.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <p className="text-lg font-extrabold text-slate-900">Your portfolio is ready to start</p>
                      <p className="mt-2 text-sm text-slate-600">
                        You have not invested yet. Open any project from the marketplace above and choose “Invest now”.
                      </p>
                      <button
                        type="button"
                        className="mt-4 rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                        onClick={scrollToMarketplace}
                      >
                        Browse projects
                      </button>
                    </div>
                  </div>
                )
              ) : (
                visiblePortfolioItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50"
                    onClick={() => onNavigate('project-detail', String(item.project_id))}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        {item.project?.image_url ? (
                          <img src={item.project.image_url} alt={item.project_title} className="h-16 w-16 rounded-2xl object-cover" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-xl font-black text-slate-400">
                            {item.project_title.charAt(0)}
                          </div>
                        )}
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
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-200"
                onClick={exportTransactions}
              >
                Export
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {showEmptyTransactions ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <p className="text-lg font-extrabold text-slate-900">No transactions yet</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {isAdmin ? 'This investor has no ledger entries yet.' : 'Your account is ready for a first investment when you are ready.'}
                  </p>
                </div>
              ) : (
                <>
                  {ledgerRows.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div>
                        <p className="font-semibold text-slate-900">{entry.category}</p>
                        <p className="text-xs text-slate-500">{entry.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${entry.direction === 'inflow' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {entry.direction === 'inflow' ? '+' : '-'}${Number(entry.amount).toLocaleString()}
                        </p>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{entry.direction}</p>
                      </div>
                    </div>
                  ))}

                  {showDemoTransactions &&
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
                    ))}
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
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-orange-600 hover:underline"
                      onClick={() => addToCalendar(item)}
                    >
                      Add to calendar
                    </button>
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

            {profileName ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {profileAvatar ? (
                  <img src={profileAvatar} alt={profileName} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
                    {profileName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-slate-900">{profileName}</p>
                  <p className="text-sm text-slate-600">{profileSub}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Choose an investor above to see their profile.
              </div>
            )}

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

      {/* Message composer */}
      {composer && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && closeComposer()}
        >
          <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">{composer.replyTo ? 'Reply' : 'New message'}</h3>
              <button type="button" aria-label="Close" className="rounded-full p-1 text-slate-500 hover:bg-slate-100" onClick={closeComposer}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {composer.replyTo && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{composer.replyTo.sender_name}</p>
                <p className="mt-1 line-clamp-3">{composer.replyTo.content}</p>
              </div>
            )}

            {!composer.receiverId && (
              <>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Project</label>
                <select
                  value={composer.projectId}
                  onChange={(e) => setComposer({ ...composer, projectId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-orange-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Choose a project…</option>
                  {messageTargets.map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.title}
                    </option>
                  ))}
                </select>
                {messageTargets.length === 0 && (
                  <p className="mt-2 text-xs text-slate-500">No live projects are available to message yet.</p>
                )}
              </>
            )}

            <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-slate-500">Message</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              placeholder="Write your message…"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-orange-500 focus:bg-white focus:outline-none"
            />

            {composeError && <p className="mt-3 text-sm font-medium text-rose-600">{composeError}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={closeComposer}>
                Cancel
              </button>
              <button
                type="button"
                disabled={sending}
                className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                onClick={sendMessage}
              >
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          {notice}
        </div>
      )}
    </DashboardLayout>
  )
}

export default InvestorDashboard