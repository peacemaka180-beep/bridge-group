import { ArrowUpRight, CircleDollarSign, Download, ShieldCheck, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import StatCard from '../components/ui/StatCard'
import type { AppNavigationHandler } from '../App'
import { API_BASE_URL } from '../config'
import { clearSession, getToken } from '../lib/auth'

type AdminDashboardProps = {
  onNavigate: AppNavigationHandler
}

type FinanceSummary = {
  totalRevenue: number
  totalExpenses: number
  fees: number
  netProfit: number
  withdrawals: number
  cashFlow: number
  payouts: Array<{
    id: number
    user_id: number
    project_id: number | null
    amount: number
    status: string
    type: string
    created_at: string
  }>
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

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`

function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')

  const showNotice = (text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3000)
  }

  useEffect(() => {
    const fetchSummary = async () => {
      const token = getToken()

      if (!token) {
        setMessage('Please sign in as the admin to view finance data.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/finance`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          clearSession()
          onNavigate('auth')
          return
        }

        if (response.status === 403) {
          setMessage('This page is only for admin accounts.')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to load finance summary')
        }

        const data = await response.json()
        setSummary(data)
      } catch (error) {
        console.error(error)
        setMessage('Could not load the finance summary. Check that the backend is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const payroll = useMemo(() => {
    if (!summary) {
      return { inflow: 0, outflow: 0, fee: 0, net: 0 }
    }

    return {
      inflow: summary.totalRevenue,
      outflow: summary.totalExpenses,
      fee: summary.fees,
      net: summary.netProfit,
    }
  }, [summary])

  const exportReport = () => {
    if (!summary || summary.ledger.length === 0) {
      showNotice('There are no ledger entries to export yet.')
      return
    }

    const header = ['id', 'user_id', 'category', 'direction', 'amount', 'balance_after', 'status', 'description', 'created_at']
    const rows = summary.ledger.map((e) => [e.id, e.user_id, e.category, e.direction, e.amount, e.balance_after, e.status, e.description, e.created_at])
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'platform-ledger.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    showNotice('Report exported.')
  }

  return (
    <DashboardLayout
      title="Admin finance"
      subtitle="Platform oversight"
      onNavigate={onNavigate}
      onBack={() => onNavigate('landing')}
    >
      <div className="space-y-6">
        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-600">
            Loading financial overview...
          </div>
        ) : !summary ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-600">
            <p>{message || 'Could not load the finance summary.'}</p>
            <button
              type="button"
              className="mt-4 rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              onClick={() => onNavigate('auth')}
            >
              Go to sign in
            </button>
          </div>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-4">
              <StatCard title="Revenue" value={`$${summary.totalRevenue.toLocaleString()}`} change="Platform inflows" trend="up" accent="green" />
              <StatCard title="Expenses" value={`$${summary.totalExpenses.toLocaleString()}`} change="Operating outflows" trend="down" accent="slate" />
              <StatCard title="Fees" value={`$${summary.fees.toLocaleString()}`} change="7% platform fee" trend="neutral" accent="amber" />
              <StatCard title="Net profit" value={`$${summary.netProfit.toLocaleString()}`} change="After fees" trend="up" accent="orange" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Finance summary</p>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-900">Cashflow overview</h3>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-200"
                    onClick={exportReport}
                  >
                    Export report
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <div className="flex items-center gap-3 text-emerald-700">
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-sm font-semibold">Total inflow</span>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-slate-900">${payroll.inflow.toLocaleString()}</p>
                  </div>

                  <div className="rounded-2xl bg-rose-50 p-4">
                    <div className="flex items-center gap-3 text-rose-700">
                      <TrendingDown className="h-5 w-5" />
                      <span className="text-sm font-semibold">Total outflow</span>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-slate-900">${payroll.outflow.toLocaleString()}</p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-4">
                    <div className="flex items-center gap-3 text-amber-700">
                      <CircleDollarSign className="h-5 w-5" />
                      <span className="text-sm font-semibold">Fees collected</span>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-slate-900">${payroll.fee.toLocaleString()}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-4">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Wallet className="h-5 w-5" />
                      <span className="text-sm font-semibold">Net cashflow</span>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-slate-900">${summary.cashFlow.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payouts</p>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-900">Withdrawals</h3>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Total withdrawn</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900">${summary.withdrawals.toLocaleString()}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Pending payouts</span>
                      <span className="font-semibold text-slate-900">{summary.payouts.filter((item) => item.status !== 'completed').length}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>Completed payouts</span>
                      <span className="font-semibold text-slate-900">{summary.payouts.filter((item) => item.status === 'completed').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ledger</p>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-900">Recent financial movements</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {summary.ledger.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">
                      No financial movements have been recorded yet.
                    </div>
                  )}
                  {summary.ledger.slice(0, 8).map((entry) => (
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
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Controls</p>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-900">Decision panel</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Profit margin</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {summary.totalRevenue ? ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) : '0.0'}%
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Loss threshold</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">${Math.min(summary.totalExpenses, 50000).toLocaleString()}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Platform fees</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">7%</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          {notice}
        </div>
      )}
    </DashboardLayout>
  )
}

export default AdminDashboard