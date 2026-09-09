import { useState } from 'react'
import type { ProjectStage, Task } from '../../types/database'
import { ResponsibleBadge, DueDateBadge } from '../../components/common/Badge'
import PortalTaskDrawer from './PortalTaskDrawer'

interface Props {
  projectId: string
  tasks: Task[]
  stages: ProjectStage[]
  onChange: () => void
}

export default function PortalTasksView({ tasks, stages, onChange }: Props) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  function stageName(stageId: string) {
    return stages.find((s) => s.id === stageId)?.name ?? '—'
  }

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null

  if (tasks.length === 0) {
    return <div className="empty-state">Nenhuma tarefa liberada ainda.</div>
  }

  return (
    <div>
      <table className="data-table task-table">
        <thead>
          <tr>
            <th>Tarefa</th>
            <th>Etapa</th>
            <th>Responsável</th>
            <th>Prazo</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} onClick={() => setOpenTaskId(task.id)}>
              <td data-label="Tarefa">
                <strong>{task.title}</strong>
                {task.description && <div className="task-subtitle">{task.description}</div>}
              </td>
              <td data-label="Etapa">{stageName(task.stage_id)}</td>
              <td data-label="Responsável">
                <ResponsibleBadge responsible={task.responsible} />
              </td>
              <td data-label="Prazo">
                <DueDateBadge expectedDate={task.expected_date} status={task.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openTask && (
        <PortalTaskDrawer
          task={openTask}
          onClose={() => {
            setOpenTaskId(null)
            onChange()
          }}
        />
      )}
    </div>
  )
}
