import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createProject,
  getProject,
  updateProject,
  type ProjectInput,
} from '../../../services/supabase/projects'
import { listClients } from '../../../services/supabase/clients'
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_HEALTH_OPTIONS,
  RESPONSIBILITY_OPTIONS,
} from '../../../types/database'
import type { Client } from '../../../types/database'

type ProjectInputType = ProjectInput
import '../../../components/common/admin-ui.css'

const emptyForm: ProjectInput = {
  client_id: '',
  name: '',
  description: '',
  context: '',
  problem_identified: '',
  objective: '',
  expected_result: '',
  scope_included: '',
  scope_excluded: '',
  assumptions: '',
  start_date: null,
  expected_end_date: null,
  actual_end_date: null,
  status: 'Planejamento',
  health: null,
  priority: '',
  current_responsibility: null,
}

export default function ProjectForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState<ProjectInput>(emptyForm)
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listClients('').then(setClients).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!id) return
    getProject(id)
      .then((p) => {
        setForm({
          client_id: p.client_id,
          name: p.name,
          description: p.description,
          context: p.context,
          problem_identified: p.problem_identified,
          objective: p.objective,
          expected_result: p.expected_result,
          scope_included: p.scope_included,
          scope_excluded: p.scope_excluded,
          assumptions: p.assumptions,
          start_date: p.start_date,
          expected_end_date: p.expected_end_date,
          actual_end_date: p.actual_end_date,
          status: p.status,
          health: p.health,
          priority: p.priority,
          current_responsibility: p.current_responsibility,
        })
        setCode(p.code)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function update<K extends keyof ProjectInputType>(key: K, value: ProjectInputType[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isEdit && id) {
        await updateProject(id, form)
      } else {
        await createProject(form)
      }
      navigate('/admin/projetos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? `Editar projeto ${code ?? ''}` : 'Novo projeto'}</h1>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="form-grid">
          <label>
            Cliente *
            <select
              value={form.client_id}
              onChange={(e) => update('client_id', e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nome do projeto *
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </label>

          <label>
            Status
            <select value={form.status} onChange={(e) => update('status', e.target.value as ProjectInputType['status'])}>
              {PROJECT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Saúde
            <select
              value={form.health ?? ''}
              onChange={(e) => update('health', (e.target.value || null) as ProjectInputType['health'])}
            >
              <option value="">—</option>
              {PROJECT_HEALTH_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioridade
            <input value={form.priority ?? ''} onChange={(e) => update('priority', e.target.value)} />
          </label>
          <label>
            Responsabilidade atual
            <select
              value={form.current_responsibility ?? ''}
              onChange={(e) =>
                update('current_responsibility', (e.target.value || null) as ProjectInputType['current_responsibility'])
              }
            >
              <option value="">—</option>
              {RESPONSIBILITY_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label>
            Data de início
            <input
              type="date"
              value={form.start_date ?? ''}
              onChange={(e) => update('start_date', e.target.value || null)}
            />
          </label>
          <label>
            Previsão de término
            <input
              type="date"
              value={form.expected_end_date ?? ''}
              onChange={(e) => update('expected_end_date', e.target.value || null)}
            />
          </label>

          <label className="full-width">
            Descrição
            <textarea rows={2} value={form.description ?? ''} onChange={(e) => update('description', e.target.value)} />
          </label>
          <label className="full-width">
            Contexto
            <textarea rows={2} value={form.context ?? ''} onChange={(e) => update('context', e.target.value)} />
          </label>
          <label className="full-width">
            Problema identificado
            <textarea
              rows={2}
              value={form.problem_identified ?? ''}
              onChange={(e) => update('problem_identified', e.target.value)}
            />
          </label>
          <label className="full-width">
            Objetivo
            <textarea rows={2} value={form.objective ?? ''} onChange={(e) => update('objective', e.target.value)} />
          </label>
          <label className="full-width">
            Resultado esperado
            <textarea
              rows={2}
              value={form.expected_result ?? ''}
              onChange={(e) => update('expected_result', e.target.value)}
            />
          </label>
          <label>
            Escopo incluído
            <textarea
              rows={2}
              value={form.scope_included ?? ''}
              onChange={(e) => update('scope_included', e.target.value)}
            />
          </label>
          <label>
            Fora do escopo
            <textarea
              rows={2}
              value={form.scope_excluded ?? ''}
              onChange={(e) => update('scope_excluded', e.target.value)}
            />
          </label>
          <label className="full-width">
            Premissas
            <textarea rows={2} value={form.assumptions ?? ''} onChange={(e) => update('assumptions', e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/projetos')}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
