import ProgressRing from '../../../components/common/ProgressRing'
import { StatusBadge, ImpactBadge } from '../../../components/common/Badge'
import type { Deliverable, ProjectStage, ProjectWithClient, Task } from '../../../types/database'
import './ProjectSummaryCard.css'

interface Props {
  project: ProjectWithClient
  stages: ProjectStage[]
  tasks: Task[]
  deliverables: Deliverable[]
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function ProjectSummaryCard({ project, stages, tasks, deliverables }: Props) {
  const today = todayISO()
  const activeStages = stages.filter((s) => s.status !== 'Cancelada')
  const currentStageIndex = activeStages.findIndex((s) => s.status !== 'Concluída')
  const currentStage = currentStageIndex === -1 ? null : activeStages[currentStageIndex]
  const currentStagePosition = currentStageIndex === -1 ? activeStages.length : currentStageIndex + 1

  const activeTasks = tasks.filter((t) => t.status !== 'Cancelada')
  const concluded = activeTasks.filter((t) => t.status === 'Concluída').length
  const inProgress = activeTasks.filter((t) => t.status === 'Em andamento').length
  const waitingClient = activeTasks.filter((t) => t.status === 'Aguardando' && t.responsible === 'Cliente').length
  const overdueTasks = activeTasks.filter((t) => t.status !== 'Concluída' && t.expected_date && t.expected_date < today)
  const overdueDeliverables = deliverables.filter((d) => d.status !== 'Entregue' && d.due_date && d.due_date < today)

  const nextDeliverable = deliverables
    .filter((d) => d.status !== 'Entregue' && d.due_date && d.due_date >= today)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))[0]

  const impact: 'No prazo' | 'Atenção necessária' | 'Cronograma impactado' =
    overdueTasks.length + overdueDeliverables.length === 0 ? 'No prazo' : 'Atenção necessária'

  return (
    <div className="summary-card">
      <div className="summary-ring-block">
        <ProgressRing value={Number(project.progress)} />
      </div>

      <div className="summary-block">
        <span className="summary-block-label">Etapa atual</span>
        {currentStage ? (
          <>
            <strong>
              {currentStagePosition} de {activeStages.length}
            </strong>
            <span className="summary-block-sub">{currentStage.name}</span>
          </>
        ) : (
          <strong>Todas concluídas</strong>
        )}
      </div>

      <div className="summary-block">
        <span className="summary-block-label">Próxima entrega</span>
        {nextDeliverable ? (
          <>
            <strong>{nextDeliverable.name}</strong>
            <span className="summary-block-sub">Prazo: {nextDeliverable.due_date}</span>
          </>
        ) : (
          <strong>—</strong>
        )}
      </div>

      <div className="summary-block">
        <span className="summary-block-label">Resumo</span>
        <div className="summary-dots">
          <span>
            <i className="dot dot-success" /> {concluded} concluídas
          </span>
          <span>
            <i className="dot dot-info" /> {inProgress} em andamento
          </span>
          <span>
            <i className="dot dot-warning" /> {waitingClient} aguardando cliente
          </span>
          <span>
            <i className="dot dot-danger" /> {overdueTasks.length} atrasadas
          </span>
        </div>
      </div>

      <div className="summary-block">
        <span className="summary-block-label">Previsão de conclusão</span>
        <strong>{project.expected_end_date ?? '—'}</strong>
        <span className="summary-block-sub">
          <StatusBadge status={project.status} />
        </span>
      </div>

      <div className="summary-block">
        <span className="summary-block-label">Impacto no cronograma</span>
        <ImpactBadge impact={impact} />
      </div>
    </div>
  )
}
