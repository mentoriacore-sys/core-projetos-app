import { useEffect, useState } from 'react'
import {
  createDeliverable,
  deleteDeliverable,
  listApprovals,
  listDeliverables,
  registerApproval,
  updateDeliverable,
  type DeliverableInput,
} from '../../../services/supabase/deliverables'
import { DELIVERABLE_STATUS_OPTIONS, VISIBILITY_OPTIONS } from '../../../types/database'
import type { Approval, Deliverable } from '../../../types/database'
import { getErrorMessage } from '../../../lib/errorMessage'
import { DueDateBadge } from '../../../components/common/Badge'

interface Props {
  projectId: string
  onChange?: () => void
}

function emptyForm(projectId: string): Partial<DeliverableInput> {
  return {
    project_id: projectId,
    stage_id: null,
    name: '',
    description: '',
    version: 'V1',
    due_date: null,
    delivery_date: null,
    status: 'Em produção',
    link_or_file: '',
    requires_approval: true,
    visibility: 'both',
  }
}

export default function DeliverablesTab({ projectId, onChange }: Props) {
  const [items, setItems] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<DeliverableInput>>(emptyForm(projectId))
  const [approvalsByDeliverable, setApprovalsByDeliverable] = useState<Record<string, Approval[]>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adjustCommentFor, setAdjustCommentFor] = useState<string | null>(null)
  const [adjustComment, setAdjustComment] = useState('')

  async function reload() {
    setLoading(true)
    try {
      setItems(await listDeliverables(projectId))
      onChange?.()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar entregáveis'))
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

  async function handleSave() {
    try {
      await createDeliverable(form)
      setShowForm(false)
      setForm(emptyForm(projectId))
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar entregável'))
    }
  }

  async function handleStatusChange(item: Deliverable, status: Deliverable['status']) {
    await updateDeliverable(item.id, {
      status,
      delivery_date: status === 'Entregue' ? new Date().toISOString().slice(0, 10) : item.delivery_date,
    })
    await reload()
  }

  async function handleApprove(deliverable: Deliverable) {
    await registerApproval({
      deliverable_id: deliverable.id,
      version: deliverable.version,
      decision: 'Aprovado',
      comment: null,
    })
    await updateDeliverable(deliverable.id, { status: 'Aprovado' })
    const approvals = await listApprovals(deliverable.id)
    setApprovalsByDeliverable((prev) => ({ ...prev, [deliverable.id]: approvals }))
    await reload()
  }

  async function handleRequestAdjustment(deliverable: Deliverable) {
    if (!adjustComment.trim()) return
    await registerApproval({
      deliverable_id: deliverable.id,
      version: deliverable.version,
      decision: 'Ajuste solicitado',
      comment: adjustComment,
    })
    await updateDeliverable(deliverable.id, { status: 'Ajustes solicitados' })
    const approvals = await listApprovals(deliverable.id)
    setApprovalsByDeliverable((prev) => ({ ...prev, [deliverable.id]: approvals }))
    setAdjustCommentFor(null)
    setAdjustComment('')
    await reload()
  }

  async function handleDelete(item: Deliverable) {
    if (!confirm(`Excluir o entregável "${item.name}"?`)) return
    await deleteDeliverable(item.id)
    await reload()
  }

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Entregáveis</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Novo entregável
        </button>
      </div>

      {showForm && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label>
              Nome *
              <input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Versão
              <input value={form.version ?? ''} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            </label>
            <label>
              Prazo
              <input
                type="date"
                value={form.due_date ?? ''}
                onChange={(e) => setForm({ ...form, due_date: e.target.value || null })}
              />
            </label>
            <label>
              Link/arquivo
              <input value={form.link_or_file ?? ''} onChange={(e) => setForm({ ...form, link_or_file: e.target.value })} />
            </label>
            <label>
              Visibilidade
              <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as DeliverableInput['visibility'] })}>
                {VISIBILITY_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Exige aprovação do cliente
              <select
                value={form.requires_approval ? 'sim' : 'nao'}
                onChange={(e) => setForm({ ...form, requires_approval: e.target.value === 'sim' })}
              >
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Descrição</span>
            <textarea
              rows={2}
              style={{ width: '100%', marginTop: '0.3rem' }}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
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
      ) : items.length === 0 ? (
        <div className="empty-state">Nenhum entregável cadastrado.</div>
      ) : (
        items.map((item) => (
          <div className="stage-card" key={item.id}>
            <div className="stage-card-header">
              <h3>
                {item.name} <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>{item.version}</span>
              </h3>
              <div className="row-actions">
                <button onClick={() => toggleExpand(item)}>{expandedId === item.id ? 'Ocultar' : 'Aprovações'}</button>
                <button className="danger" onClick={() => handleDelete(item)}>
                  Excluir
                </button>
              </div>
            </div>
            <div className="stage-meta">
              <select value={item.status} onChange={(e) => handleStatusChange(item, e.target.value as Deliverable['status'])}>
                {DELIVERABLE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {item.due_date && <DueDateBadge expectedDate={item.due_date} status={item.status === 'Entregue' ? 'Concluída' : item.status} />}
              {item.link_or_file && (
                <a href={item.link_or_file} target="_blank" rel="noreferrer">
                  Abrir link
                </a>
              )}
            </div>

            {expandedId === item.id && (
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                {(approvalsByDeliverable[item.id] ?? []).length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Nenhuma decisão registrada ainda.</p>
                ) : (
                  (approvalsByDeliverable[item.id] ?? []).map((a) => (
                    <div key={a.id} style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      <strong>{a.decision}</strong> — {new Date(a.decided_at).toLocaleString('pt-BR')}
                      {a.comment && <div style={{ color: 'var(--color-text-secondary)' }}>{a.comment}</div>}
                    </div>
                  ))
                )}

                <div className="row-actions" style={{ marginTop: '0.5rem' }}>
                  <button className="btn-primary" onClick={() => handleApprove(item)} type="button">
                    Registrar aprovação
                  </button>
                  <button onClick={() => setAdjustCommentFor(item.id)} type="button">
                    Registrar ajuste solicitado
                  </button>
                </div>

                {adjustCommentFor === item.id && (
                  <div className="inline-form" style={{ marginTop: '0.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Comentário do ajuste (obrigatório)</span>
                      <textarea
                        rows={2}
                        style={{ width: '100%', marginTop: '0.3rem' }}
                        value={adjustComment}
                        onChange={(e) => setAdjustComment(e.target.value)}
                      />
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
        ))
      )}
    </div>
  )
}
