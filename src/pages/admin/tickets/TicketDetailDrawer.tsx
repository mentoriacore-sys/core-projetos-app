import { useEffect, useRef, useState } from 'react'
import {
  addMessage,
  getTicketAttachmentUrl,
  listAttachments,
  listMessages,
  listTicketHistory,
  updateTicket,
  uploadTicketAttachment,
  type TicketHistoryEntry,
  type TicketWithProject,
} from '../../../services/supabase/tickets'
import { TICKET_PRIORITY_OPTIONS, TICKET_STATUS_OPTIONS } from '../../../types/database'
import type { TicketAttachment, TicketMessage } from '../../../types/database'
import { StatusBadge } from '../../../components/common/Badge'
import { getErrorMessage } from '../../../lib/errorMessage'
import '../../admin/projects/TaskDetailDrawer.css'

interface Props {
  ticket: TicketWithProject
  profileNames: Record<string, string>
  admins: { id: string; name: string }[]
  onClose: () => void
  onChange: () => void
}

export default function TicketDetailDrawer({ ticket, profileNames, admins, onClose, onChange }: Props) {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [history, setHistory] = useState<TicketHistoryEntry[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messageVisibility, setMessageVisibility] = useState<'cliente' | 'interno'>('cliente')
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resolutionSummary, setResolutionSummary] = useState(ticket.resolution_summary ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function reload() {
    try {
      const [m, a, h] = await Promise.all([listMessages(ticket.id), listAttachments(ticket.id), listTicketHistory(ticket.id)])
      setMessages(m)
      setAttachments(a)
      setHistory(h)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id])

  async function handleSendMessage() {
    if (!newMessage.trim()) return
    try {
      await addMessage(ticket.id, newMessage.trim(), messageVisibility)
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

  async function handleStatusChange(status: string) {
    if ((status === 'Resolvido' || status === 'Encerrado') && !resolutionSummary.trim() && !ticket.resolution_summary) {
      setError('Antes de marcar como Resolvido/Encerrado, registre o resumo da solução abaixo.')
      return
    }
    try {
      await updateTicket(ticket.id, { status: status as TicketWithProject['status'], resolution_summary: resolutionSummary || ticket.resolution_summary })
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handlePriorityChange(priority: string) {
    try {
      await updateTicket(ticket.id, { priority: priority as TicketWithProject['priority'] })
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleAssignedChange(assignedTo: string) {
    try {
      await updateTicket(ticket.id, { assigned_to: assignedTo || null })
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleSaveResolution() {
    try {
      await updateTicket(ticket.id, { resolution_summary: resolutionSummary })
      onChange()
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
            <StatusBadge status={ticket.status} /> <StatusBadge status={ticket.priority ?? 'Sem prioridade'} />
          </div>
          <button className="drawer-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <p className="drawer-section-hint">
          {ticket.projects?.clients?.name} · {ticket.projects?.code} · {ticket.category ?? 'Sem categoria'} · aberto em{' '}
          {new Date(ticket.opened_at).toLocaleDateString('pt-BR')}
        </p>

        <div className="drawer-section">
          <span className="drawer-section-label">Descrição inicial</span>
          <p>{ticket.description}</p>
          <p className="drawer-section-hint">Impacto percebido pelo cliente: {ticket.reported_impact ?? '—'}</p>
        </div>

        <div className="drawer-section inline-form-grid">
          <label>
            Status
            <select value={ticket.status} onChange={(e) => handleStatusChange(e.target.value)}>
              {TICKET_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioridade
            <select value={ticket.priority ?? ''} onChange={(e) => handlePriorityChange(e.target.value)}>
              <option value="">—</option>
              {TICKET_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsável
            <select value={ticket.assigned_to ?? ''} onChange={(e) => handleAssignedChange(e.target.value)}>
              <option value="">—</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {ticket.due_at && (
          <p className="drawer-section-hint">SLA (primeira resposta) até {new Date(ticket.due_at).toLocaleString('pt-BR')}</p>
        )}

        <div className="drawer-section">
          <span className="drawer-section-label">Resolução</span>
          <textarea
            rows={2}
            placeholder="Resumo da solução (obrigatório antes de Resolver/Encerrar)"
            value={resolutionSummary}
            onChange={(e) => setResolutionSummary(e.target.value)}
            onBlur={handleSaveResolution}
          />
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
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ marginTop: '0.5rem' }}>
            📎 {uploading ? 'Enviando...' : 'Anexar arquivo'}
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={handleUpload} accept=".png,.jpg,.jpeg,.webp,.pdf" />
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
                    <strong>
                      {profileNames[m.author_id ?? ''] ?? 'Usuário'} {m.visibility === 'interno' && '· (interno)'}
                    </strong>
                    <span>{new Date(m.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <p>{m.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="drawer-comment-form">
            <textarea rows={2} placeholder="Escrever mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
              <input
                type="checkbox"
                checked={messageVisibility === 'interno'}
                onChange={(e) => setMessageVisibility(e.target.checked ? 'interno' : 'cliente')}
              />
              Nota interna (cliente não vê)
            </label>
            <button className="btn-primary" onClick={handleSendMessage}>
              Enviar
            </button>
          </div>
        </div>

        <div className="drawer-section">
          <span className="drawer-section-label">Histórico</span>
          {history.length === 0 ? (
            <p className="drawer-section-hint">Nenhum evento ainda.</p>
          ) : (
            <ul className="drawer-attachments">
              {history.map((h) => (
                <li key={h.id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem' }}>
                  <span>{h.description}</span>
                  <span className="drawer-section-hint" style={{ margin: 0 }}>
                    {new Date(h.created_at).toLocaleString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
