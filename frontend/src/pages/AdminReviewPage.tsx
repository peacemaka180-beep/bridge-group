import { CheckCircle2, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppNavigationHandler } from '../App'
import DashboardLayout from '../components/DashboardLayout'
import { API_BASE_URL } from '../config'
import { clearSession, getToken } from '../lib/auth'

type AdminReviewPageProps = {
  onNavigate: AppNavigationHandler
}

type Submission = {
  id: number
  innovator_id?: number
  founder_name: string
  title: string
  field: string
  category: string
  status: string
  score: number
  problem: string
  solution: string
  pitch: string
  department?: string | null
  review_summary?: string | null
  admin_notes?: string | null
}

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-orange-500 focus:bg-white focus:outline-none'
const labelClass = 'text-xs font-bold uppercase tracking-wider text-slate-500'

// Ideas that already moved past screening can't be marked potential again.
const LOCKED_STATUSES = ['potential', 'department_assigned', 'approved']

function AdminReviewPage({ onNavigate }: AdminReviewPageProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'forbidden' | 'error'>('loading')
  const [notice, setNotice] = useState('')

  // The "mark as potential" form
  const [reviewTarget, setReviewTarget] = useState<Submission | null>(null)
  const [form, setForm] = useState({ score: '', department: '', review_summary: '', admin_notes: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const showNotice = (text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const refreshIdeas = async () => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/api/ideas`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (response.status === 401) {
      // Signed out or the session expired: go and sign in again.
      clearSession()
      onNavigate('auth')
      return
    }

    if (response.status === 403) {
      setLoadState('forbidden')
      return
    }

    if (!response.ok) {
      setLoadState('error')
      return
    }

    const data = await response.json()
    setSubmissions(data.ideas || [])
    setLoadState('ok')
  }

  useEffect(() => {
    refreshIdeas().catch((error) => {
      console.error('Failed to load idea submissions:', error)
      setLoadState('error')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = {
    pending: submissions.filter((s) => s.status === 'submitted').length,
    verified: submissions.filter((s) => s.status === 'under_review').length,
    potential: submissions.filter((s) => s.status === 'potential').length,
    approved: submissions.filter((s) => s.status === 'department_assigned' || s.status === 'approved').length,
  }

  const openReviewForm = (item: Submission) => {
    setReviewTarget(item)
    setFormError('')
    setForm({
      score: item.score ? String(item.score) : '',
      department: item.department || 'Product & Strategy',
      review_summary: item.review_summary || '',
      admin_notes: item.admin_notes || '',
    })
  }

  const closeReviewForm = () => {
    setReviewTarget(null)
    setFormError('')
  }

  const savePotential = async (openReviewAfter: boolean) => {
    if (!reviewTarget) return

    const score = Number(form.score)
    if (form.score.trim() === '' || !Number.isFinite(score) || score < 0 || score > 100) {
      setFormError('Enter a score from 0 to 100.')
      return
    }
    if (!form.department.trim()) {
      setFormError('Enter the department that should review this idea.')
      return
    }

    const token = getToken()
    setSaving(true)
    setFormError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/ideas/${reviewTarget.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: 'potential',
          score: Math.round(score),
          department: form.department.trim(),
          // Left out when empty so a previous summary or note is kept.
          review_summary: form.review_summary.trim() || undefined,
          admin_notes: form.admin_notes.trim() || undefined,
        }),
      })

      if (response.status === 401) {
        clearSession()
        onNavigate('auth')
        return
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        setFormError(error.message || 'Could not update status.')
        return
      }

      const id = reviewTarget.id
      closeReviewForm()
      await refreshIdeas()

      if (openReviewAfter) {
        onNavigate('department-review', String(id))
      } else {
        showNotice('Idea marked as potential.')
      }
    } catch (error) {
      console.error('Could not mark idea as potential:', error)
      setFormError('Could not reach the server. Check that the backend is running.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Admin review" subtitle="Innovation screening" onNavigate={onNavigate} onBack={() => onNavigate('admin')}>
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pending</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{counts.pending}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Verified</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{counts.verified}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Potential</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{counts.potential}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approved</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{counts.approved}</p>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Review queue</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Submitted ideas</h3>
            </div>
            <button type="button" className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700" onClick={() => onNavigate('admin')}>
              Admin finance
            </button>
          </div>

          <div className="space-y-4">
            {loadState === 'loading' ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                Loading submissions...
              </div>
            ) : loadState === 'forbidden' ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                You are not signed in as an admin, so the submissions list cannot be loaded.
              </div>
            ) : loadState === 'error' ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                Failed to load submissions. Check that the backend is running and the API URL is correct.
              </div>
            ) : submissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No idea submissions have been received yet.
              </div>
            ) : (
              submissions.map((item) => {
                const locked = LOCKED_STATUSES.includes(item.status)
                return (
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
                        <div className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">{item.status.replace(/_/g, ' ')}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600" onClick={() => onNavigate('department-review', String(item.id))}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Review idea
                      </button>
                      <button
                        type="button"
                        disabled={locked}
                        title={locked ? 'This idea has already moved past screening.' : undefined}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => openReviewForm(item)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {item.status === 'potential' ? 'Already potential' : locked ? 'Already reviewed' : 'Mark as potential'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      {reviewTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && !saving && closeReviewForm()}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Mark as potential</h3>
              <button type="button" aria-label="Close" className="rounded-full p-1 text-slate-500 hover:bg-slate-100" onClick={closeReviewForm}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">{reviewTarget.title}</p>
              <p className="text-slate-500">{reviewTarget.founder_name}</p>
            </div>

            <label className={labelClass}>Score (0 to 100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              placeholder="e.g. 85"
              className={`mt-1 ${fieldClass}`}
            />

            <label className={`mt-4 block ${labelClass}`}>Department</label>
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={`mt-1 ${fieldClass}`}
            />

            <label className={`mt-4 block ${labelClass}`}>Review summary (optional)</label>
            <textarea
              value={form.review_summary}
              onChange={(e) => setForm({ ...form, review_summary: e.target.value })}
              rows={3}
              placeholder="Why does this idea look promising?"
              className={`mt-1 ${fieldClass}`}
            />

            <label className={`mt-4 block ${labelClass}`}>Admin notes (optional)</label>
            <textarea
              value={form.admin_notes}
              onChange={(e) => setForm({ ...form, admin_notes: e.target.value })}
              rows={3}
              placeholder="Private notes for the review team"
              className={`mt-1 ${fieldClass}`}
            />

            {formError && <p className="mt-3 text-sm font-medium text-rose-600">{formError}</p>}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={closeReviewForm}>
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-orange-200 disabled:opacity-60"
                onClick={() => savePotential(false)}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                disabled={saving}
                className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                onClick={() => savePotential(true)}
              >
                Save and open review
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          {notice}
        </div>
      )}
    </DashboardLayout>
  )
}

export default AdminReviewPage