import { useEffect, useRef, useState } from 'react'
import {
  addComment,
  deleteAttachment,
  getAttachmentUrl,
  listAttachments,
  listComments,
  updateTask,
  uploadAttachment,
} from '../../../services/supabase/tasks'
import { SCHEDULE_IMPACT_OPTIONS } from '../../../types/database'
import type { Task, TaskAttachment, TaskComment } from '../../../types/database'
import { StatusBadge } from '../../../components/common/Badge'
import { getErrorMessage } from '../../../lib/errorMessage'
import './TaskDetailDrawer.css'

interface Props {
  task: Task
  profileNames: Record<string, string>
  onClose: () => void
  onChange: () => void
}

export default function TaskDetailDrawer({ task, profileNames, onClose, onChange }: Props) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [newComment, setNewComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function reload() {
    try {
      const [c, a] = await Promise.all([listComments(task.id), listAttachments(task.id)])
      setComments(c)
      setAttachments(a)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id])

  async function handleAddComment() {
    if (!newComment.trim()) return
    try {
      await addComment(task.id, newComment.trim())
      setNewComment('')
      await reload()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadAttachment(task.id, file)
      await reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleOpenAttachment(att: TaskAttachment) {
    try {
      const url = await getAttachmentUrl(att.storage_path)
      window.open(url, '_blank')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleDeleteAttachment(att: TaskAttachment) {
    if (!confirm(`Excluir o anexo "${att.file_name}"?`)) return
    await deleteAttachment(att)
    await reload()
  }

  async function handleMarkDone() {
    await updateTask(task.id, { status: 'Concluída', completed_at: new Date().toISOString() })
    onChange()
  }

  async function handleReopen() {
    await updateTask(task.id, { status: 'Em andamento', completed_at: null })
    onChange()
  }

  async function handleToggleBlocking() {
    await updateTask(task.id, { is_blocking: !task.is_blocking })
    onChange()
  }

  async function handleImpactChange(schedule_impact_status: Task['schedule_impact_status']) {
    await updateTask(task.id, { schedule_impact_status })
    onChange()
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2>{task.title}</h2>
            <StatusBadge status={task.status} />
          </div>
          <button className="drawer-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        {task.description && <p className="drawer-description">{task.description}</p>}

        {task.is_blocking && (
          <div className="drawer-blocking-note">
            Esta tarefa é necessária para que a próxima atividade possa começar.
          </div>
        )}

        <div className="drawer-quick-actions">
          {task.status !== 'Concluída' ? (
            <button className="btn-primary" onClick={handleMarkDone}>
              ✓ Marcar como concluída
            </button>
          ) : (
            <button className="btn-secondary" onClick={handleReopen}>
              Reabrir tarefa
            </button>
          )}
          <button className="btn-secondary" onClick={handleToggleBlocking}>
            {task.is_blocking ? 'Remover bloqueadora' : 'Marcar como bloqueadora'}
          </button>
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            📎 {uploading ? 'Enviando...' : 'Anexar arquivo'}
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={handleUpload} />
        </div>

        <div className="drawer-section">
          <span className="drawer-section-label">Impacto no cronograma</span>
          <p className="drawer-section-hint">
            O sistema não decide isso automaticamente — avalie e confirme se o atraso desta tarefa afeta o cronograma
            geral do projeto.
          </p>
          <select value={task.schedule_impact_status} onChange={(e) => handleImpactChange(e.target.value as Task['schedule_impact_status'])}>
            {SCHEDULE_IMPACT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="drawer-section">
          <span className="drawer-section-label">Anexos ({attachments.length})</span>
          {attachments.length === 0 ? (
            <p className="drawer-section-hint">Nenhum anexo ainda.</p>
          ) : (
            <ul className="drawer-attachments">
              {attachments.map((a) => (
                <li key={a.id}>
                  <button className="drawer-attachment-link" onClick={() => handleOpenAttachment(a)}>
                    📎 {a.file_name}
                  </button>
                  <button className="drawer-attachment-remove" onClick={() => handleDeleteAttachment(a)}>
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="drawer-section">
          <span className="drawer-section-label">Observações e comentários</span>
          <div className="drawer-comments">
            {comments.length === 0 ? (
              <p className="drawer-section-hint">Nenhum comentário ainda.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="drawer-comment">
                  <div className="drawer-comment-meta">
                    <strong>{profileNames[c.author_id ?? ''] ?? 'Usuário'}</strong>
                    <span>{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <p>{c.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="drawer-comment-form">
            <textarea
              rows={2}
              placeholder="Escrever um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button className="btn-primary" onClick={handleAddComment}>
              Comentar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
