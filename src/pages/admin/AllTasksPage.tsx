import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { countAttachmentsByTask, listAllTasks, updateTask, type TaskWithProject } from '../../services/supabase/tasks'
import { listProfiles } from '../../services/supabase/profiles'
import { STAGE_STATUS_OPTIONS, RESPONSIBILITY_OPTIONS } from '../../types/database'
import type { Task } from '../../types/database'
import { ResponsibleBadge, DueDateBadge } from '../../components/common/Badge'
import TaskDetailDrawer from './projects/TaskDetailDrawer'
import { getErrorMessage } from '../../lib/errorMessage'
import '../../components/common/admin-ui.css'
import './projects/ProjectDetail.css'

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [responsible, setResponsible] = useState('')
  const [onlyOverdue, setOnlyOverdue] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  async function reload() {
    try {
      const [t, profiles] = await Promise.all([listAllTasks(), listProfiles()])
      setTasks(t)
      const names: Record<string, string> = {}
      profiles.forEach((p) => (names[p.id] = p.name || p.email || 'Usuário'))
      setProfileNames(names)
      setAttachmentCounts(await countAttachmentsByTask(t.map((task) => task.id)))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar tarefas'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleStatusChange(task: Task, newStatus: Task['status']) {
    await updateTask(task.id, { status: newStatus, completed_at: newStatus === 'Concluída' ? new Date().toISOString() : null })
    await reload()
  }

  const today = new Date().toISOString().slice(0, 10)

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (status && t.status !== status) return false
      if (responsible && t.responsible !== responsible) return false
      if (onlyOverdue && !(t.expected_date && t.status !== 'Concluída' && t.expected_date < today)) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const haystack = `${t.title} ${t.projects?.name ?? ''} ${t.projects?.clients?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [tasks, status, responsible, onlyOverdue, search, today])

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null

  return (
    <div>
      <div className="page-header">
        <h1>Tarefas</h1>
      </div>

      <div className="filters-bar">
        <input placeholder="Buscar por tarefa, projeto ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STAGE_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={responsible} onChange={(e) => setResponsible(e.target.value)}>
          <option value="">Todos os responsáveis</option>
          {RESPONSIBILITY_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--text-sm)' }}>
          <input type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} />
          Só atrasadas
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Nenhuma tarefa encontrada.</div>
      ) : (
        <table className="data-table task-table">
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Projeto</th>
              <th>Cliente</th>
              <th>Responsável</th>
              <th>Prazo</th>
              <th>Status</th>
              <th>Última atualização</th>
              <th>Anexos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr
                key={task.id}
                className={
                  task.is_blocking
                    ? 'row-blocking'
                    : task.expected_date && task.status !== 'Concluída' && task.expected_date < today
                      ? 'row-overdue'
                      : ''
                }
                onClick={() => setOpenTaskId(task.id)}
              >
                <td data-label="Tarefa">
                  <div className="task-title-cell">
                    {task.is_blocking && <span title="Bloqueadora">🔒</span>}
                    <strong>{task.title}</strong>
                  </div>
                </td>
                <td data-label="Projeto">
                  {task.projects && (
                    <Link to={`/admin/projetos/${task.projects.id}`} onClick={(e) => e.stopPropagation()}>
                      {task.projects.code}
                    </Link>
                  )}
                </td>
                <td data-label="Cliente">{task.projects?.clients?.name ?? '—'}</td>
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
                </td>
                <td data-label="Última atualização" className="task-updated-cell">
                  {task.updated_at.slice(0, 10)}
                  <span>por {profileNames[task.updated_by ?? ''] ?? '—'}</span>
                </td>
                <td data-label="Anexos">{attachmentCounts[task.id] ? `📎 ${attachmentCounts[task.id]}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openTask && (
        <TaskDetailDrawer task={openTask} profileNames={profileNames} onClose={() => setOpenTaskId(null)} onChange={reload} />
      )}
    </div>
  )
}
