type StatCardProps = {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  accent?: 'orange' | 'green' | 'amber' | 'slate'
}

const accentMap = {
  orange: 'bg-orange-50 text-orange-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-700',
}

function StatCard({ title, value, change, trend, accent = 'slate' }: StatCardProps) {
  const trendText =
    trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•'

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{title}</p>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${accentMap[accent]}`}>
          {trendText} {change}
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

export default StatCard
