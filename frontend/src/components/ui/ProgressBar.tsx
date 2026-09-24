type ProgressBarProps = {
  value: number
  color?: string
}

function ProgressBar({ value, color = '#f97316' }: ProgressBarProps) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  )
}

export default ProgressBar
