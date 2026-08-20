import { useEffect, useState } from 'react'
import {
  createDependency,
  deleteDependency,
  listDependencies,
  updateDependency,
  type DependencyInput,
} from '../../../services/supabase/dependencies'
import { DEPENDENCY_STATUS_OPTIONS } from '../../../types/database'
import type { Dependency } from '../../../types/database'
import { getErrorMessage } from '../../../lib/errorMessage'

interface Props {
  projectId: string
}

function emptyForm(projectId: string): Partial<DependencyInput> {
  return {
    project_id: projectId,
    stage_id: null,
    task_id: null,
    description: '',
    responsible: '',
    request_date: new Date().toISOString().slice(0, 10),
    expected_date: null,
    impact: '',
    status: 'Aberta',
    resolution: null,
    resolution_date: null,
  }
}

export default function DependenciesTab({ projectId }: Props) {
  const [items, setItems] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<DependencyInput>>(emptyForm(projectId))
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionText, setResolutionText] = useState('')

  async function reload() {
    setLoading(true)
    try {
      setItems(await listDependencies(projectId))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar dependências'))
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
      await createDependency(form)
      setShowForm(false)
      setForm(emptyForm(projectId))
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar dependência'))
    }
  }

  async function handleResolve(dep: Dependency) {
    if (!resolutionText.trim()) return
    try {
      await updateDependency(dep.id, {
        status: 'Resolvida',
        resolution: resolutionText,
        resolution_date: new Date().toISOString().slice(0, 10),
      })
      setResolvingId(null)
      setResolutionText('')
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao resolver dependência'))
    }
  }

  async function handleStatusChange(dep: Dependency, status: Dependency['status']) {
    if (status === 'Resolvida') {
      setResolvingId(dep.id)
      return
    }
    await updateDependency(dep.id, { status })
    await reload()
  }

  async function handleDelete(dep: Dependency) {
    if (!confirm(`Excluir a dependência "${dep.description}"?`)) return
    await deleteDependency(dep.id)
    await reload()
  }

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Dependências</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Nova dependência
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
              Aguardando (cliente/terceiro)
              <input value={form.responsible ?? ''} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
            </label>
            <label>
              Impacto
              <input value={form.impact ?? ''} onChange={(e) => setForm({ ...form, impact: e.target.value })} />
            </label>
            <label>
              Prazo esperado
              <input
                type="date"
                value={form.expected_date ?? ''}
                onChange={(e) => setForm({ ...form, expected_date: e.target.value || null })}
              />
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
        <div className="empty-state">Nenhuma dependência registrada.</div>
      ) : (
        items.map((dep) => (
          <div className="stage-card" key={dep.id}>
            <div className="stage-card-header">
              <h3>{dep.description}</h3>
              <div className="row-actions">
                <button className="danger" onClick={() => handleDelete(dep)}>
                  Excluir
                </button>
              </div>
            </div>
            <div className="stage-meta">
              <select value={dep.status} onChange={(e) => handleStatusChange(dep, e.target.value as Dependency['status'])}>
                {DEPENDENCY_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {dep.responsible && <span>Aguardando: {dep.responsible}</span>}
              {dep.expected_date && <span>Prazo: {dep.expected_date}</span>}
              {dep.resolution && <span>Resolução: {dep.resolution}</span>}
            </div>

            {resolvingId === dep.id && (
              <div className="inline-form" style={{ marginTop: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#374151' }}>Como foi resolvida?</span>
                  <textarea
                    rows={2}
                    style={{ width: '100%', marginTop: '0.3rem' }}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                  />
                </label>
                <div className="row-actions">
                  <button className="btn-primary" onClick={() => handleResolve(dep)} type="button">
                    Confirmar resolução
                  </button>
                  <button onClick={() => setResolvingId(null)} type="button">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
