import { useEffect, useRef, useState } from 'react'
import {
  addMessage,
  getTicketAttachmentUrl,
  listAttachments,
  listMessages,
  uploadTicketAttachment,
} from '../../services/supabase/tickets'
import { listProfiles } from '../../services/supabase/profiles'
import type { SupportTicket, TicketAttachment, TicketMessage } from '../../types/database'
import { StatusBadge } from '../../components/common/Badge'
import { getErrorMessage } from '../../lib/errorMessage'
import '../admin/projects/TaskDetailDrawer.css'

interface Props {
  ticket: SupportTicket
  onClose: () => void
}

export default function PortalTicketDrawer({ ticket, onClose }: Props) {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [newMessage, setNewMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canReply = !['Resolvido', 'Encerrado', 'Cancelado'].includes(ticket.status)

  async function reload() {
    try {
      const [m, a, profiles] = await Promise.all([listMessages(ticket.id), listAttachments(ticket.id), listProfiles()])
      setMessages(m)
      setAttachments(a)
      const names: Record<string, string> = {}
      profiles.forEach((p) => (names[p.id] = p.name || p.email || 'Equipe C.O.R.E.'))
      setProfileNames(names)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id])

  async function handleSend() {
    if (!newMessage.trim()) return
    try {
      await addMessage(ticket.id, newMessage.trim(), 'cliente')
      setNewMessage('')
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
      await uploadTicketAttachment(ticket, file)
      await reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleOpenAttachment(att: TicketAttachment) {
    try {
      const url = await getTicketAttachmentUrl(att.storage_path)
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
            <h2>
              {ticket.ticket_code} — {ticket.title}
            </h2>
            <StatusBadge status={ticket.status} />
          </div>
          <button className="drawer-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <p className="drawer-description">{ticket.description}</p>

        {ticket.resolution_summary && (ticket.status === 'Resolvido' || ticket.status === 'Encerrado') && (
          <div className="drawer-section">
            <span className="drawer-section-label">Solução</span>
            <p>{ticket.resolution_summary}</p>
          </div>
        )}

        {canReply && (
          <div className="drawer-quick-actions">
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              📎 {uploading ? 'Enviando...' : 'Anexar arquivo'}
            </button>
            <input ref={fileInputRef} type="file" hidden onChange={handleUpload} accept=".png,.jpg,.jpeg,.webp,.pdf" />
          </div>
        )}

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
          <span className="drawer-section-label">Conversa</span>
          <div className="drawer-comments">
            {messages.length === 0 ? (
              <p className="drawer-section-hint">Nenhuma mensagem ainda.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="drawer-comment">
                  <div className="drawer-comment-meta">
                    <strong>{profileNames[m.author_id ?? ''] ?? 'Usuário'}</strong>
                    <span>{new Date(m.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <p>{m.message}</p>
                </div>
              ))
            )}
          </div>
          {canReply ? (
            <div className="drawer-comment-form">
              <textarea rows={2} placeholder="Escrever mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
              <button className="btn-primary" onClick={handleSend}>
                Enviar
              </button>
            </div>
          ) : (
            <p className="drawer-section-hint">Este chamado está {ticket.status.toLowerCase()} e não recebe novas mensagens.</p>
          )}
        </div>
      </div>
    </div>
  )
}
