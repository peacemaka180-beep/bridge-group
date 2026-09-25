import { ArrowRight, CheckCircle2, FileText } from 'lucide-react'
import { useState } from 'react'
import type { AppNavigationHandler } from '../App'
import { API_BASE_URL } from '../config'

type IdeaRequestPageProps = {
  onNavigate: AppNavigationHandler
}

type RequestStatus = 'draft' | 'submitted' | 'under_review' | 'potential' | 'department_assigned' | 'approved'

const ideaTemplates = [
  {
    title: 'FarmSense AI',
    category: 'Agriculture',
    field: 'Climate-smart farming',
    problem: 'Small farmers are losing harvests because they cannot detect irrigation and nutrient stress early enough.',
    solution: 'An affordable sensor and mobile app that predicts crop stress and sends timely irrigation guidance to farmers.',
    pitch: 'We want to help underserved farmers improve yields with data-driven, low-cost guidance that is simple to use on mobile devices.',
  },
  {
    title: 'CareLink Mobile',
    category: 'Healthcare',
    field: 'Rural health access',
    problem: 'Rural clinics struggle to reach patients quickly and diagnose common conditions before complications worsen.',
    solution: 'A mobile triage platform that helps frontline workers collect symptoms, detect risk, and guide patients to the right care path.',
    pitch: 'We are building a practical healthcare support tool for communities with limited access to doctors and diagnostics.',
  },
  {
    title: 'SolarHub Platform',
    category: 'Renewable Energy',
    field: 'Distributed energy',
    problem: 'Households and small businesses often cannot access affordable, reliable clean energy financing and management tools.',
    solution: 'A smart solar management platform that helps users monitor energy use, track savings, and coordinate shared energy access.',
    pitch: 'We are creating a community-first energy platform that makes clean power simpler, more transparent, and easier to finance.',
  },
] as const

function IdeaRequestPage({ onNavigate }: IdeaRequestPageProps) {
  const [form, setForm] = useState({
    title: '',
    category: 'Agriculture',
    problem: '',
    solution: '',
    founder: '',
    email: '',
    field: '',
    pitch: '',
  })

  const [status, setStatus] = useState<RequestStatus>('draft')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const applyTemplate = (template: (typeof ideaTemplates)[number]) => {
    setForm((current) => ({
      ...current,
      title: template.title,
      category: template.category,
      field: template.field,
      problem: template.problem,
      solution: template.solution,
      pitch: template.pitch,
    }))
  }

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('bg_token')
      const response = await fetch(`${API_BASE_URL}/api/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          field: form.field,
          problem: form.problem,
          solution: form.solution,
          pitch: form.pitch,
          founder_name: form.founder,
          email: form.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Idea request failed.')
      }

      setStatus('under_review')
      alert('Your idea request has been submitted successfully and is now in the Bridge Group review queue.')
      onNavigate('innovator')
    } catch (error) {
      console.error('Idea request error:', error)
      alert(error instanceof Error ? error.message : 'Could not submit idea request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f1ea] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bridge Group</p>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Innovator idea request</h1>
            </div>
            <button
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
              onClick={() => onNavigate('innovator')}
            >
              Back to dashboard
            </button>
          </div>
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-[24px] border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Starter idea flow</p>
              <h2 className="mt-2 text-xl font-extrabold text-slate-900">Build a strong first submission.</h2>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {ideaTemplates.map((template) => (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="rounded-2xl border border-orange-200 bg-white p-3 text-left transition hover:border-orange-300 hover:shadow-sm"
                  >
                    <p className="text-sm font-bold text-slate-900">{template.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{template.category}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Idea title</label>
              <input
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                placeholder="Give your idea a memorable title"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-300"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(event) => handleChange('category', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-300"
                >
                  <option>Agriculture</option>
                  <option>Technology</option>
                  <option>Healthcare</option>
                  <option>Creative Arts</option>
                  <option>Renewable Energy</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Field of expertise</label>
                <input
                  value={form.field}
                  onChange={(event) => handleChange('field', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-300"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Problem</label>
              <textarea
                rows={4}
                value={form.problem}
                onChange={(event) => handleChange('problem', event.target.value)}
                placeholder="What problem are you solving, and who is affected?"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Proposed solution</label>
              <textarea
                rows={4}
                value={form.solution}
                onChange={(event) => handleChange('solution', event.target.value)}
                placeholder="Describe your product, service, or platform and why it works."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Pitch to department/admin</label>
              <textarea
                rows={4}
                value={form.pitch}
                onChange={(event) => handleChange('pitch', event.target.value)}
                placeholder="Explain your vision, traction, and why this matters now."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-300"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Founder name</label>
                <input
                  value={form.founder}
                  onChange={(event) => handleChange('founder', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-300"
                />
              </div>
            </div>

            <button type="submit" className="brand-button-primary w-full disabled:cursor-not-allowed disabled:opacity-70" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit request to admin'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-[#111827] p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Process</p>
                  <h2 className="text-xl font-extrabold">Approval pipeline</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  'Request submitted',
                  'Admin verification',
                  'Department pitch review',
                  'Potential status assigned',
                  'Project approval and build starts',
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index <= 1 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                      {index + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                  <h3 className="text-xl font-extrabold text-slate-900">Current review state</h3>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Request state</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {status === 'draft' ? 'Draft' : status === 'submitted' ? 'Submitted' : status === 'under_review' ? 'Under review' : 'Potential'}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-slate-700">
                Strong submissions clearly explain the problem, the target user, and why your solution can scale. That is what helps Bridge Group review teams move fast.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IdeaRequestPage
