import { useEffect, useState } from 'react'
import { listApprovals, listDeliverables, registerApproval } from '../../services/supabase/deliverables'
import type { Approval, Deliverable } from '../../types/database'
import { StatusBadge, DueDateBadge } from '../../components/common/Badge'
import { getErrorMessage } from '../../lib/errorMessage'

interface Props {
  projectId: string
  onChange: () => void
}

export default function PortalDeliverablesView({ projectId, onChange }: Props) {
  const [items, setItems] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvalsByDeliverable, setApprovalsByDeliverable] = useState<Record<string, Approval[]>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adjustCommentFor, setAdjustCommentFor] = useState<string | null>(null)
  const [adjustComment, setAdjustComment] = useState('')

  async function reload() {
    setLoading(true)
    try {
      setItems(await listDeliverables(projectId))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function toggleExpand(deliverable: Deliverable) {
    if (expandedId === deliverable.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(deliverable.id)
    if (!approvalsByDeliverable[deliverable.id]) {
      const approvals = await listApprovals(deliverable.id)
      setApprovalsByDeliverable((prev) => ({ ...prev, [deliverable.id]: approvals }))
    }
  }

  async function handleApprove(deliverable: Deliverable) {
    try {
      await registerApproval({ deliverable_id: deliverable.id, version: deliverable.version, decision: 'Aprovado', comment: null })
      const approvals = await listApprovals(deliverable.id)
      setApprovalsByDeliverable((prev) => ({ ...prev, [deliverable.id]: approvals }))
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleRequestAdjustment(deliverable: Deliverable) {
    if (!adjustComment.trim()) return
    try {
      await registerApproval({
        deliverable_id: deliverable.id,
        version: deliverable.version,
        decision: 'Ajuste solicitado',
        comment: adjustComment,
      })
      const approvals = await listApprovals(deliverable.id)
      setApprovalsByDeliverable((prev) => ({ ...prev, [deliverable.id]: approvals }))
      setAdjustCommentFor(null)
      setAdjustComment('')
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <p>Carregando...</p>
  if (items.length === 0) return <div className="empty-state">Nenhum entregável liberado ainda.</div>

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      {items.map((item) => (
        <div className="stage-card" key={item.id}>
          <div className="stage-card-header">
            <h3>
              {item.name} <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>{item.version}</span>
            </h3>
            <button onClick={() => toggleExpand(item)}>{expandedId === item.id ? 'Ocultar' : 'Ver detalhes'}</button>
          </div>
          <div className="stage-meta">
            <StatusBadge status={item.status} />
            {item.due_date && <DueDateBadge expectedDate={item.due_date} status={item.status === 'Entregue' ? 'Concluída' : item.status} />}
            {item.link_or_file && (
              <a href={item.link_or_file} target="_blank" rel="noreferrer">
                Abrir link
              </a>
            )}
          </div>

          {expandedId === item.id && (
            <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
              {item.description && <p style={{ fontSize: 'var(--text-sm)', marginBottom: '0.75rem' }}>{item.description}</p>}

              {(approvalsByDeliverable[item.id] ?? []).map((a) => (
                <div key={a.id} style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <strong>{a.decision}</strong> — {new Date(a.decided_at).toLocaleString('pt-BR')}
                  {a.comment && <div style={{ color: 'var(--color-text-secondary)' }}>{a.comment}</div>}
                </div>
              ))}

              {item.requires_approval && item.status !== 'Aprovado' && item.status !== 'Entregue' && (
                <div className="row-actions" style={{ marginTop: '0.5rem' }}>
                  <button className="btn-primary" onClick={() => handleApprove(item)} type="button">
                    Aprovar
                  </button>
                  <button onClick={() => setAdjustCommentFor(item.id)} type="button">
                    Solicitar ajuste
                  </button>
                </div>
              )}

              {adjustCommentFor === item.id && (
                <div className="inline-form" style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>O que precisa ajustar? (obrigatório)</span>
                    <textarea rows={2} style={{ width: '100%', marginTop: '0.3rem' }} value={adjustComment} onChange={(e) => setAdjustComment(e.target.value)} />
                  </label>
                  <div className="row-actions">
                    <button className="btn-primary" onClick={() => handleRequestAdjustment(item)} type="button">
                      Confirmar
                    </button>
                    <button onClick={() => setAdjustCommentFor(null)} type="button">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
