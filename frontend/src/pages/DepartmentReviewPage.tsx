import { ArrowRight, BriefcaseBusiness, CheckCircle2, MessageSquareText, Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppNavigationHandler } from '../App'

type DepartmentReviewPageProps = {
  onNavigate: AppNavigationHandler
  ideaId: string
}

type IdeaRequest = {
  id: number
  title: string
  founder_name: string
  email: string
  field: string
  category: string
  problem: string
  solution: string
  pitch: string
  status: string
  score: number
}

const departments = [
  {
    name: 'Product & Strategy',
    lead: 'Aisha Mensah',
    status: 'Ready for pitch',
    review: 'The concept has strong alignment with market need and clear monetization path.',
  },
  {
    name: 'Operations & Build',
    lead: 'Kofi Boateng',
    status: 'Reviewing feasibility',
    review: 'Execution plan is viable, but the team needs resource mapping and delivery timeline.',
  },
  {
    name: 'Funding & Growth',
    lead: 'Monica Dlamini',
    status: 'Approved for potential',
    review: 'Strong growth story and potential investor fit once the pilot is validated.',
  },
]

function DepartmentReviewPage({ onNavigate, ideaId }: DepartmentReviewPageProps) {
  const [idea, setIdea] = useState<IdeaRequest | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchIdea = async () => {
      const token = localStorage.getItem('bg_token')
      const response = await fetch(`http://localhost:4000/api/ideas/${ideaId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      setIdea(data.idea)
    }

    fetchIdea().catch((error) => console.error('Failed to load idea details:', error))
  }, [ideaId])

  const handlePotentialApproval = async () => {
    const token = localStorage.getItem('bg_token')
    if (!idea || !token) {
      return
    }

    setIsUpdating(true)
    const response = await fetch(`http://localhost:4000/api/ideas/${idea.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: 'department_assigned',
        score: 92,
        department: 'Product & Strategy',
        review_summary: 'Department review confirms the idea is viable and ready for a formal project approval pipeline.',
        admin_notes: 'Cross-functional review completed successfully.',
      }),
    })

    setIsUpdating(false)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      alert(error.message || 'Unable to update the department review status.')
      return
    }

    const data = await response.json()
    setIdea((current) => current ? { ...current, ...data.idea } : data.idea)
    alert('This idea has been approved into the department review pipeline.')
  }

  return (
    <div className="min-h-screen bg-[#f7f1ea] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bridge Group</p>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Department review</h1>
            </div>
            <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700" onClick={() => onNavigate('admin-review')}>
              Back to admin review
            </button>
          </div>
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-[1fr_0.9fr] md:p-8">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Idea ID</p>
                  <h2 className="text-2xl font-extrabold text-slate-900">{ideaId}</h2>
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Founder</p>
                  <p>{idea?.founder_name || 'Loading founder...'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Project</p>
                  <p>{idea?.title || 'Loading project...'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Summary</p>
                  <p>{idea?.pitch || 'Loading project summary...'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {departments.map((department) => (
                <div key={department.name} className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Department</p>
                      <h3 className="mt-1 text-xl font-extrabold text-slate-900">{department.name}</h3>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">{department.status}</div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-slate-500" />
                    Lead: {department.lead}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">{department.review}</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-3 py-2 text-xs font-semibold text-white">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Start 1-on-1 pitch
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700" onClick={handlePotentialApproval} disabled={isUpdating}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isUpdating ? 'Updating...' : 'Approve as potential'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-[#111827] p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Lifecycle</p>
                  <h2 className="text-xl font-extrabold">Potential to build</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  'Idea request submitted',
                  'Admin verifies the idea',
                  'Departments review and pitch',
                  'Potential status approved',
                  'Project build begins',
                ].map((stage, index) => (
                  <div key={stage} className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index === 4 ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {index + 1}
                    </div>
                    <span>{stage}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-xl font-extrabold text-slate-900">Approval outcome</h3>
              <div className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
                This stage marks the transition from valid idea to project activation; the department team then begins build planning and execution.
              </div>

              <button
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f97316] px-4 py-3 text-sm font-semibold text-white"
                onClick={() => onNavigate('project-approval', ideaId)}
              >
                Move to project approval flow
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DepartmentReviewPage
