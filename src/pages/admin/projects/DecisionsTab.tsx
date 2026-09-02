import { useEffect, useState } from 'react'
import { createDecision, listDecisions, type DecisionInput } from '../../../services/supabase/decisions'
import type { ProjectDecision } from '../../../types/database'
import { getErrorMessage } from '../../../lib/errorMessage'

interface Props {
  projectId: string
}

function emptyForm(projectId: string): Partial<DecisionInput> {
  return {
    project_id: projectId,
    decision_date: new Date().toISOString().slice(0, 10),
    decision: '',
    context: '',
    impact: '',
  }
}

export default function DecisionsTab({ projectId }: Props) {
  const [items, setItems] = useState<ProjectDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<DecisionInput>>(emptyForm(projectId))

  async function reload() {
    setLoading(true)
    try {
      setItems(await listDecisions(projectId))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar decisões'))
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
      await createDecision(form)
      setShowForm(false)
      setForm(emptyForm(projectId))
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar decisão'))
    }
  }

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Decisões</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Nova decisão
        </button>
      </div>

      {showForm && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label className="full-width">
              Decisão *
              <input value={form.decision ?? ''} onChange={(e) => setForm({ ...form, decision: e.target.value })} />
            </label>
            <label>
              Data
              <input
                type="date"
                value={form.decision_date ?? ''}
                onChange={(e) => setForm({ ...form, decision_date: e.target.value })}
              />
            </label>
            <label>
              Impacto
              <input value={form.impact ?? ''} onChange={(e) => setForm({ ...form, impact: e.target.value })} />
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Contexto</span>
            <textarea
              rows={2}
              style={{ width: '100%', marginTop: '0.3rem' }}
              value={form.context ?? ''}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
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
        <div className="empty-state">Nenhuma decisão registrada.</div>
      ) : (
        items.map((item) => (
          <div className="stage-card" key={item.id}>
            <div className="stage-card-header">
              <h3>{item.decision}</h3>
              <span className="summary-label">{item.decision_date}</span>
            </div>
            {item.context && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>{item.context}</p>}
            {item.impact && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>Impacto: {item.impact}</p>}
          </div>
        ))
      )}
    </div>
  )
}
