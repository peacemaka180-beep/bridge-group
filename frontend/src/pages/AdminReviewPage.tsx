import { CheckCircle2, MessageSquareText, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppNavigationHandler } from '../App'
import DashboardLayout from '../components/DashboardLayout'

type AdminReviewPageProps = {
  onNavigate: AppNavigationHandler
}

type Submission = {
  id: number
  founder_name: string
  title: string
  field: string
  category: string
  status: string
  score: number
  problem: string
  solution: string
  pitch: string
}

function AdminReviewPage({ onNavigate }: AdminReviewPageProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])

  const refreshIdeas = async () => {
    const token = localStorage.getItem('bg_token')
    const response = await fetch('http://localhost:4000/api/ideas', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      return
    }

    const data = await response.json()
    setSubmissions(data.ideas || [])
  }

  useEffect(() => {
    refreshIdeas().catch((error) => console.error('Failed to load idea submissions:', error))
  }, [])

  const handleMarkPotential = async (id: number) => {
    const token = localStorage.getItem('bg_token')
    const response = await fetch(`http://localhost:4000/api/ideas/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        status: 'potential',
        score: 91,
        department: 'Product & Strategy',
        review_summary: 'Admin review completed and the idea has been moved into the potential pipeline.',
        admin_notes: 'Strong market fit and founder readiness validated.',
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      alert(error.message || 'Could not update status.')
      return
    }

    await refreshIdeas()
    onNavigate('department-review', String(id))
  }

  return (
    <DashboardLayout title="Admin review" subtitle="Innovation screening" onNavigate={onNavigate} onBack={() => onNavigate('landing')}>
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pending</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">12</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Verified</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">8</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Potential</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">5</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approved</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">3</p>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Review queue</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Submitted ideas</h3>
            </div>
            <button className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => onNavigate('landing')}>
              Dashboard home
            </button>
          </div>

          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No idea submissions have been received yet.
              </div>
            ) : (
              submissions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{item.founder_name}</p>
                      <h4 className="mt-1 text-xl font-extrabold text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{item.problem}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700">{item.category}</div>
                      <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">{item.score || 0}%</div>
                      <div className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">{item.status}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-3 py-2 text-xs font-semibold text-white" onClick={() => onNavigate('department-review', String(item.id))}>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Review idea
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Message founder
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => handleMarkPotential(item.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark as potential
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default AdminReviewPage
