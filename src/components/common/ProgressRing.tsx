interface Props {
  value: number
  size?: number
}

export default function ProgressRing({ value, size = 92 }: Props) {
  const stroke = 9
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
      <text x="50%" y="47%" textAnchor="middle" fontSize="1.15rem" fontWeight={700} fill="var(--color-text)">
        {Math.round(value)}%
      </text>
      <text x="50%" y="65%" textAnchor="middle" fontSize="0.62rem" fill="var(--color-text-secondary)">
        concluído
      </text>
    </svg>
  )
}
