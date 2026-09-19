import { useEffect, useState } from 'react'
import { listStages } from '../../../services/supabase/stages'
import { countAttachmentsByTask, createTask, deleteTask, listTasksByProject, updateTask, type TaskInput } from '../../../services/supabase/tasks'
import { listProfiles } from '../../../services/supabase/profiles'
import { STAGE_STATUS_OPTIONS, VISIBILITY_OPTIONS, RESPONSIBILITY_OPTIONS } from '../../../types/database'
import type { ProjectStage, Task } from '../../../types/database'
import { getErrorMessage } from '../../../lib/errorMessage'
import { formatDateTimeBR } from '../../../lib/formatDate'
import { ResponsibleBadge, DueDateBadge } from '../../../components/common/Badge'
import TaskDetailDrawer from './TaskDetailDrawer'

interface Props {
  projectId: string
  onProgressChange: () => void
}

function emptyForm(projectId: string, stageId: string): TaskInput {
  return {
    project_id: projectId,
    stage_id: stageId,
    title: '',
    description: '',
    responsible: null,
    priority: '',
    status: 'Não iniciada',
    expected_date: null,
    visibility: 'both',
    notes: '',
  }
}

export default function TasksTab({ projectId, onProgressChange }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<TaskInput | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  async function reload(showSpinner = true) {
    if (showSpinner) setLoading(true)
    try {
      const [t, s, profiles] = await Promise.all([listTasksByProject(projectId), listStages(projectId), listProfiles()])
      setTasks(t)
      setStages(s)
      const names: Record<string, string> = {}
      profiles.forEach((p) => (names[p.id] = p.name || p.email || 'Usuário'))
      setProfileNames(names)
      setAttachmentCounts(await countAttachmentsByTask(t.map((task) => task.id)))
      onProgressChange()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar tarefas'))
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  function stageName(stageId: string) {
    return stages.find((s) => s.id === stageId)?.name ?? '—'
  }

  function startCreate() {
    if (stages.length === 0) {
      setError('Cadastre ao menos uma etapa antes de criar tarefas.')
      return
    }
    setForm(emptyForm(projectId, stages[0].id))
    setShowForm(true)
    setError(null)
  }

  async function handleSave() {
    if (!form) return
    try {
      await createTask(form)
      setShowForm(false)
      setForm(null)
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar tarefa'))
    }
  }

  async function handleStatusChange(task: Task, status: Task['status']) {
    await updateTask(task.id, {
      status,
      completed_at: status === 'Concluída' ? new Date().toISOString() : null,
    })
    await reload()
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return
    await deleteTask(task.id)
    await reload()
  }

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Tarefas do projeto</h2>
        <button className="btn-primary" onClick={startCreate}>
          + Nova tarefa
        </button>
      </div>

      {showForm && form && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label>
              Etapa *
              <select value={form.stage_id} onChange={(e) => setForm({ ...form, stage_id: e.target.value })}>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Título *
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              Responsável
              <select
                value={form.responsible ?? ''}
                onChange={(e) => setForm({ ...form, responsible: (e.target.value || null) as TaskInput['responsible'] })}
              >
                <option value="">—</option>
                {RESPONSIBILITY_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prioridade
              <input value={form.priority ?? ''} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskInput['status'] })}>
                {STAGE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prazo
              <input
                type="date"
                value={form.expected_date ?? ''}
                onChange={(e) => setForm({ ...form, expected_date: e.target.value || null })}
              />
            </label>
            <label>
              Visibilidade
              <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as TaskInput['visibility'] })}>
                {VISIBILITY_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="row-actions">
            <button className="btn-primary" onClick={handleSave} type="button">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} type="button">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : tasks.length === 0 ? (
        <div className="empty-state">Nenhuma tarefa cadastrada ainda.</div>
      ) : (
        <table className="data-table task-table">
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Etapa</th>
              <th>Responsável</th>
              <th>Prazo</th>
              <th>Status</th>
              <th>Conclusão</th>
              <th>Última atualização</th>
              <th>Anexos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className={task.is_blocking ? 'row-blocking' : task.expected_date && task.status !== 'Concluída' && task.expected_date < new Date().toISOString().slice(0, 10) ? 'row-overdue' : ''}
                onClick={() => setOpenTaskId(task.id)}
              >
                <td data-label="Tarefa">
                  <div className="task-title-cell">
                    {task.is_blocking && <span title="Bloqueadora">🔒</span>}
                    <strong>{task.title}</strong>
                  </div>
                  {task.description && <div className="task-subtitle">{task.description}</div>}
                </td>
                <td data-label="Etapa">{stageName(task.stage_id)}</td>
                <td data-label="Responsável">
                  <ResponsibleBadge responsible={task.responsible} />
                </td>
                <td data-label="Prazo">
                  <DueDateBadge expectedDate={task.expected_date} status={task.status} />
                </td>
                <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                  <select value={task.status} onChange={(e) => handleStatusChange(task, e.target.value as Task['status'])}>
                    {STAGE_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <span className="status-updated-at">atualizado {formatDateTimeBR(task.updated_at)}</span>
                </td>
                <td data-label="Conclusão">{task.completed_at ? task.completed_at.slice(0, 10) : '—'}</td>
                <td data-label="Última atualização" className="task-updated-cell">
                  {task.updated_at.slice(0, 10)}
                  <span>por {profileNames[task.updated_by ?? ''] ?? '—'}</span>
                </td>
                <td data-label="Anexos">{attachmentCounts[task.id] ? `📎 ${attachmentCounts[task.id]}` : '—'}</td>
                <td data-label="Ações" onClick={(e) => e.stopPropagation()}>
                  <div className="row-actions">
                    <button className="danger" onClick={() => handleDelete(task)} type="button">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openTask && (
        <TaskDetailDrawer
          task={openTask}
          profileNames={profileNames}
          onClose={() => setOpenTaskId(null)}
          onChange={() => reload(false)}
        />
      )}
    </div>
  )
}
