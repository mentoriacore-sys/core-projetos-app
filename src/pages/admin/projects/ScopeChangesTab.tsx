import { useEffect, useState } from 'react'
import {
  createScopeChange,
  listScopeChanges,
  updateScopeChange,
  type ScopeChangeInput,
} from '../../../services/supabase/scopeChanges'
import { SCOPE_DECISION_OPTIONS } from '../../../types/database'
import type { ScopeChange } from '../../../types/database'
import { getErrorMessage } from '../../../lib/errorMessage'

interface Props {
  projectId: string
}

function emptyForm(projectId: string): Partial<ScopeChangeInput> {
  return {
    project_id: projectId,
    description: '',
    requester: '',
    request_date: new Date().toISOString().slice(0, 10),
    reason: '',
    estimated_impact: '',
    deadline_impact: '',
    decision: 'Em análise',
    notes: '',
  }
}

export default function ScopeChangesTab({ projectId }: Props) {
  const [items, setItems] = useState<ScopeChange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<ScopeChangeInput>>(emptyForm(projectId))

  async function reload() {
    setLoading(true)
    try {
      setItems(await listScopeChanges(projectId))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar alterações de escopo'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleSave() {
    try {
      await createScopeChange(form)
      setShowForm(false)
      setForm(emptyForm(projectId))
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar solicitação'))
    }
  }

  async function handleDecision(item: ScopeChange, decision: ScopeChange['decision']) {
    await updateScopeChange(item.id, { decision })
    await reload()
  }

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Alteração de Escopo</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Nova solicitação
        </button>
      </div>

      {showForm && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label className="full-width">
              Descrição *
              <input value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label>
              Solicitante
              <input value={form.requester ?? ''} onChange={(e) => setForm({ ...form, requester: e.target.value })} />
            </label>
            <label>
              Motivo
              <input value={form.reason ?? ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </label>
            <label>
              Impacto estimado
              <input value={form.estimated_impact ?? ''} onChange={(e) => setForm({ ...form, estimated_impact: e.target.value })} />
            </label>
            <label>
              Impacto no prazo
              <input value={form.deadline_impact ?? ''} onChange={(e) => setForm({ ...form, deadline_impact: e.target.value })} />
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
      ) : items.length === 0 ? (
        <div className="empty-state">Nenhuma solicitação de alteração de escopo.</div>
      ) : (
        items.map((item) => (
          <div className="stage-card" key={item.id}>
            <div className="stage-card-header">
              <h3>{item.description}</h3>
            </div>
            <div className="stage-meta">
              <select value={item.decision} onChange={(e) => handleDecision(item, e.target.value as ScopeChange['decision'])}>
                {SCOPE_DECISION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {item.requester && <span>Solicitante: {item.requester}</span>}
              {item.deadline_impact && <span>Impacto no prazo: {item.deadline_impact}</span>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
