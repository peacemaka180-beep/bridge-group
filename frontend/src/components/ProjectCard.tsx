import type { Project } from '../types'
import ProgressBar from './ui/ProgressBar'

type ProjectCardProps = {
  project: Project
  onSelect: (projectId: string) => void
}

function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const fundingPct = Math.min(100, Math.round((project.funding_raised / project.funding_goal) * 100))

  return (
    <button
      type="button"
      className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200"
      onClick={() => onSelect(project.id)}
    >
      <div className="h-44 w-full overflow-hidden">
        <img src={project.image_url} alt={project.title} className="h-full w-full object-cover" />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">
            {project.category_name}
          </span>
          <span className="text-xs font-medium text-slate-500">{project.stage}</span>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-slate-900">{project.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{project.description}</p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Funding</span>
            <span>{fundingPct}%</span>
          </div>
          <ProgressBar value={fundingPct} color="#f97316" />
          <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
            <span>${project.funding_raised.toLocaleString()}</span>
            <span>Goal ${project.funding_goal.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm">
          <span className="font-medium text-slate-700">ROI {project.roi_projection}%</span>
          <span className="font-semibold text-orange-600">View details</span>
        </div>
      </div>
    </button>
  )
}

export default ProjectCard
