import type { ProjectStage } from '../../types/database'
import ProgressBar from '../../components/common/ProgressBar'
import { StatusBadge, DueDateBadge } from '../../components/common/Badge'

export default function PortalStagesView({ stages }: { stages: ProjectStage[] }) {
  if (stages.length === 0) {
    return <div className="empty-state">Nenhuma etapa liberada ainda.</div>
  }

  return (
    <div>
      {stages.map((stage, index) => (
        <div className="stage-card" key={stage.id}>
          <div className="stage-card-header">
            <div>
              <span className="stage-index">
                Etapa {index + 1} de {stages.length}
              </span>
              <h3>{stage.name}</h3>
            </div>
          </div>
          {stage.description && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>
              {stage.description}
            </p>
          )}
          <div className="stage-progress-row">
            <ProgressBar value={Number(stage.progress)} />
            <span className="stage-progress-pct">{Number(stage.progress).toFixed(0)}% concluído</span>
          </div>
          <div className="stage-meta">
            <StatusBadge status={stage.status} />
            {stage.expected_end && <DueDateBadge expectedDate={stage.expected_end} status={stage.status} />}
          </div>
        </div>
      ))}
    </div>
  )
}
