import { useEffect, useRef, useState } from 'react'
import { addComment, getAttachmentUrl, listAttachments, listComments, uploadAttachment } from '../../services/supabase/tasks'
import { listProfiles } from '../../services/supabase/profiles'
import type { Task, TaskAttachment, TaskComment } from '../../types/database'
import { StatusBadge } from '../../components/common/Badge'
import { getErrorMessage } from '../../lib/errorMessage'
import '../admin/projects/TaskDetailDrawer.css'

interface Props {
  task: Task
  onClose: () => void
}

export default function PortalTaskDrawer({ task, onClose }: Props) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [newComment, setNewComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function reload() {
    try {
      const [c, a, profiles] = await Promise.all([listComments(task.id), listAttachments(task.id), listProfiles()])
      setComments(c)
      setAttachments(a)
      const names: Record<string, string> = {}
      profiles.forEach((p) => (names[p.id] = p.name || p.email || 'Usuário'))
      setProfileNames(names)
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
      await addComment(task.id, newComment.trim(), 'client')
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

        <div className="drawer-quick-actions">
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            📎 {uploading ? 'Enviando...' : 'Anexar arquivo'}
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={handleUpload} />
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
