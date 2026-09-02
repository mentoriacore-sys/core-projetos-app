import { useEffect, useState } from 'react'
import { createRisk, listRisks, updateRisk, type RiskInput } from '../../../services/supabase/risks'
import { RISK_PROBABILITY_OPTIONS, RISK_IMPACT_OPTIONS } from '../../../types/database'
import type { ProjectRisk } from '../../../types/database'
import { getErrorMessage } from '../../../lib/errorMessage'
import { StatusBadge } from '../../../components/common/Badge'

interface Props {
  projectId: string
}

function emptyForm(projectId: string): Partial<RiskInput> {
  return {
    project_id: projectId,
    risk: '',
    description: '',
    probability: 'Média',
    impact: 'Médio',
    mitigation: '',
    status: 'Aberto',
  }
}

export default function RisksTab({ projectId }: Props) {
  const [items, setItems] = useState<ProjectRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<RiskInput>>(emptyForm(projectId))

  async function reload() {
    setLoading(true)
    try {
      setItems(await listRisks(projectId))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar riscos'))
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
      await createRisk(form)
      setShowForm(false)
      setForm(emptyForm(projectId))
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar risco'))
    }
  }

  async function handleStatusToggle(item: ProjectRisk) {
    await updateRisk(item.id, { status: item.status === 'Encerrado' ? 'Aberto' : 'Encerrado' })
    await reload()
  }

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Riscos</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Novo risco
        </button>
      </div>

      {showForm && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label className="full-width">
              Risco *
              <input value={form.risk ?? ''} onChange={(e) => setForm({ ...form, risk: e.target.value })} />
            </label>
            <label>
              Probabilidade
              <select value={form.probability ?? ''} onChange={(e) => setForm({ ...form, probability: e.target.value as RiskInput['probability'] })}>
                {RISK_PROBABILITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Impacto
              <select value={form.impact ?? ''} onChange={(e) => setForm({ ...form, impact: e.target.value as RiskInput['impact'] })}>
                {RISK_IMPACT_OPTIONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Mitigação</span>
            <textarea
              rows={2}
              style={{ width: '100%', marginTop: '0.3rem' }}
              value={form.mitigation ?? ''}
              onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
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
        <div className="empty-state">Nenhum risco registrado.</div>
      ) : (
        items.map((item) => (
          <div className="stage-card" key={item.id}>
            <div className="stage-card-header">
              <h3>{item.risk}</h3>
              <div className="row-actions">
                <button onClick={() => handleStatusToggle(item)}>
                  {item.status === 'Encerrado' ? 'Reabrir' : 'Encerrar'}
                </button>
              </div>
            </div>
            <div className="stage-meta">
              <span>
                Probabilidade: <StatusBadge status={item.probability} />
              </span>
              <span>
                Impacto: <StatusBadge status={item.impact} />
              </span>
              <StatusBadge status={item.status ?? 'Aberto'} />
            </div>
            {item.mitigation && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>Mitigação: {item.mitigation}</p>}
          </div>
        ))
      )}
    </div>
  )
}
