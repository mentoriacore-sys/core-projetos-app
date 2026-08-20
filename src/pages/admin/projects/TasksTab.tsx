import { useEffect, useState } from 'react'
import { listStages } from '../../../services/supabase/stages'
import { createTask, deleteTask, listTasksByProject, updateTask, type TaskInput } from '../../../services/supabase/tasks'
import { STAGE_STATUS_OPTIONS, VISIBILITY_OPTIONS } from '../../../types/database'
import type { ProjectStage, Task } from '../../../types/database'
import { getErrorMessage } from '../../../lib/errorMessage'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<TaskInput | null>(null)

  async function reload() {
    setLoading(true)
    try {
      const [t, s] = await Promise.all([listTasksByProject(projectId), listStages(projectId)])
      setTasks(t)
      setStages(s)
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar tarefas'))
    } finally {
      setLoading(false)
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
      onProgressChange()
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
    onProgressChange()
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return
    await deleteTask(task.id)
    await reload()
    onProgressChange()
  }

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
              Data prevista
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
        <table className="data-table">
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Etapa</th>
              <th>Prioridade</th>
              <th>Data prevista</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{stageName(task.stage_id)}</td>
                <td>{task.priority || '—'}</td>
                <td>{task.expected_date || '—'}</td>
                <td>
                  <select value={task.status} onChange={(e) => handleStatusChange(task, e.target.value as Task['status'])}>
                    {STAGE_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
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
    </div>
  )
}
