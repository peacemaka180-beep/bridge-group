import { ArrowLeft, ArrowRight, CheckCircle2, CircleDollarSign, TrendingUp } from 'lucide-react'
import type { AppNavigationHandler } from '../App'
import { milestones, profiles, projects } from '../data/mockData'

type ProjectDetailProps = {
  projectId: string
  onNavigate: AppNavigationHandler
}

function ProjectDetail({ projectId, onNavigate }: ProjectDetailProps) {
  const project = projects.find((item) => item.id === projectId) ?? projects[0]
  const founder = profiles.find((profile) => profile.id === project.innovator_id) ?? profiles[0]
  const projectMilestones = milestones.filter((milestone) => milestone.project_id === project.id)

  const fundingPct = Math.min(100, Math.round((project.funding_raised / project.funding_goal) * 100))

  return (
    <div className="min-h-screen bg-[#f7f1ea] text-slate-900">
      <header className="border-b border-slate-200 bg-[#f7f1ea]/80 backdrop-blur-md">
        <div className="container-shell flex h-20 items-center justify-between gap-4">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            onClick={() => onNavigate('landing')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </button>

          <button className="brand-button-primary" onClick={() => onNavigate('auth')}>
            Invest now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="container-shell py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-700">{project.category_name}</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{project.stage}</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{project.status}</span>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <div className="soft-card overflow-hidden">
              <img src={project.image_url} alt={project.title} className="h-80 w-full object-cover" />
            </div>

            <div className="soft-card p-6 md:p-8">
              <div className="flex items-center gap-4">
                <img src={founder.avatar_url} alt={founder.full_name} className="h-14 w-14 rounded-full object-cover" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Founder</p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">{project.innovator_name}</h2>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">{project.title}</h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">{project.description}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Funding goal</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">${project.funding_goal.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Raised</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">${project.funding_raised.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Projected ROI</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">{project.roi_projection}%</p>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="section-kicker">The problem</p>
                  <p className="mt-3 text-base leading-7 text-slate-700">{project.problem}</p>
                </div>

                <div>
                  <p className="section-kicker">The solution</p>
                  <p className="mt-3 text-base leading-7 text-slate-700">{project.solution}</p>
                </div>
              </div>
            </div>

            <div className="soft-card p-6 md:p-8">
              <p className="section-kicker">Milestones</p>
              <div className="mt-6 space-y-4">
                {projectMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{milestone.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{milestone.description}</p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          {milestone.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="soft-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Funding status</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-4xl font-extrabold text-slate-900">{fundingPct}%</span>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">LIVE</span>
              </div>

              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[#f97316]" style={{ width: `${fundingPct}%` }} />
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Raised</span>
                  <span className="font-semibold text-slate-900">${project.funding_raised.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Goal</span>
                  <span className="font-semibold text-slate-900">${project.funding_goal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Equity offered</span>
                  <span className="font-semibold text-slate-900">{project.equity_offered}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Revenue share</span>
                  <span className="font-semibold text-slate-900">{project.revenue_share_pct}%</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button className="brand-button-primary w-full" onClick={() => onNavigate('auth')}>
                  Express interest
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="brand-button-secondary w-full" onClick={() => onNavigate('investor')}>
                  Back to investor view
                </button>
              </div>
            </div>

            <div className="soft-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Highlights</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Projected upside</p>
                    <p className="text-sm text-slate-600">{project.roi_projection}% projected annual return</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CircleDollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Revenue model</p>
                    <p className="text-sm text-slate-600">{project.revenue_share_pct}% revenue share</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default ProjectDetail
