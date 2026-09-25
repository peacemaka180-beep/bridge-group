import { ArrowRight, BadgeCheck, Building2, CircleDollarSign, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppNavigationHandler } from '../App'
import { API_BASE_URL } from '../config'

type ProjectApprovalPageProps = {
  onNavigate: AppNavigationHandler
  ideaId: string
}

type IdeaRequest = {
  id: number
  title: string
  founder_name: string
  email: string
  category: string
  field: string
  problem: string
  solution: string
  pitch: string
  status: string
  score: number
}

function ProjectApprovalPage({ onNavigate, ideaId }: ProjectApprovalPageProps) {
  const [idea, setIdea] = useState<IdeaRequest | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'Technology',
    description: '',
    problem: '',
    solution: '',
    funding_goal: '250000',
    equity_offered: '15',
    revenue_share_pct: '8',
    roi_projection: '22',
  })

  useEffect(() => {
    const fetchIdea = async () => {
      const token = localStorage.getItem('bg_token')
      const response = await fetch(`${API_BASE_URL}/api/ideas/${ideaId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      const currentIdea = data.idea as IdeaRequest
      setIdea(currentIdea)
      setForm((prev) => ({
        ...prev,
        title: currentIdea.title || prev.title,
        category: currentIdea.category || prev.category,
        problem: currentIdea.problem || prev.problem,
        solution: currentIdea.solution || prev.solution,
        description: currentIdea.pitch || prev.description,
      }))
    }

    fetchIdea().catch((error) => console.error('Failed to load idea approval data:', error))
  }, [ideaId])

  const handleFieldChange = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleApproval = async () => {
    const token = localStorage.getItem('bg_token')
    if (!token || !idea) {
      alert('Admin authentication is required to approve a project.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idea_id: idea.id,
          title: form.title,
          category: form.category,
          description: form.description,
          problem: form.problem,
          solution: form.solution,
          funding_goal: Number(form.funding_goal),
          equity_offered: Number(form.equity_offered),
          revenue_share_pct: Number(form.revenue_share_pct),
          roi_projection: Number(form.roi_projection),
          innovator_id: idea.id,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Project approval failed.')
      }

      alert('Project has been approved and is now live in the monetization pipeline.')
      onNavigate('project-detail', String(data.project.id))
    } catch (error) {
      console.error('Project approval error:', error)
      alert(error instanceof Error ? error.message : 'Project approval failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f1ea] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bridge Group</p>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Project approval & monetization</h1>
            </div>
            <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700" onClick={() => onNavigate('department-review', ideaId)}>
              Back to review
            </button>
          </div>
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Approval target</p>
                  <h2 className="text-2xl font-extrabold text-slate-900">{idea?.title || 'Loading project...'}</h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Project title</label>
                  <input value={form.title} onChange={(event) => handleFieldChange('title', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-300" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                  <select value={form.category} onChange={(event) => handleFieldChange('category', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-300">
                    <option>Technology</option>
                    <option>Agriculture</option>
                    <option>Healthcare</option>
                    <option>Creative Arts</option>
                    <option>Renewable Energy</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Project description</label>
                <textarea rows={4} value={form.description} onChange={(event) => handleFieldChange('description', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-300" />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Problem</label>
                <textarea rows={3} value={form.problem} onChange={(event) => handleFieldChange('problem', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-300" />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Solution</label>
                <textarea rows={3} value={form.solution} onChange={(event) => handleFieldChange('solution', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-300" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-[#111827] p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Monetization config</p>
                  <h2 className="text-xl font-extrabold">Funding and returns</h2>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Funding goal</label>
                  <input type="number" value={form.funding_goal} onChange={(event) => handleFieldChange('funding_goal', event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-300" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Equity offered</label>
                  <input type="number" value={form.equity_offered} onChange={(event) => handleFieldChange('equity_offered', event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-300" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Revenue share %</label>
                  <input type="number" value={form.revenue_share_pct} onChange={(event) => handleFieldChange('revenue_share_pct', event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-300" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Projected ROI %</label>
                  <input type="number" value={form.roi_projection} onChange={(event) => handleFieldChange('roi_projection', event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-300" />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Validation</p>
                  <h3 className="text-xl font-extrabold text-slate-900">Approval outcome</h3>
                </div>
              </div>

              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600" /> Idea reviewed by admin</li>
                <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600" /> Department validation complete</li>
                <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600" /> Monetization model configured</li>
              </ul>

              <button onClick={handleApproval} disabled={submitting} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f97316] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
                {submitting ? 'Approving project...' : 'Approve project and launch'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectApprovalPage
