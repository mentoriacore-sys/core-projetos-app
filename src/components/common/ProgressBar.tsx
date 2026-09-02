import './ProgressBar.css'

export default function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
