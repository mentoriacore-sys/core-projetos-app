import { useEffect, useState } from 'react'
import { createStage, deleteStage, listStages, updateStage, type StageInput } from '../../../services/supabase/stages'
import { STAGE_STATUS_OPTIONS, VISIBILITY_OPTIONS } from '../../../types/database'
import type { ProjectStage } from '../../../types/database'

interface Props {
  projectId: string
  onProgressChange: () => void
}

const emptyForm: StageInput = {
  project_id: '',
  name: '',
  description: '',
  objective: '',
  stage_order: 0,
  expected_start: null,
  expected_end: null,
  actual_start: null,
  actual_end: null,
  status: 'Não iniciada',
  visibility: 'both',
  notes: '',
}

export default function StagesTab({ projectId, onProgressChange }: Props) {
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StageInput>({ ...emptyForm, project_id: projectId })

  async function reload() {
    setLoading(true)
    try {
      setStages(await listStages(projectId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar etapas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  function startCreate() {
    setForm({ ...emptyForm, project_id: projectId, stage_order: stages.length })
    setEditingId(null)
    setShowForm(true)
  }

  function startEdit(stage: ProjectStage) {
    setForm({
      project_id: projectId,
      name: stage.name,
      description: stage.description,
      objective: stage.objective,
      stage_order: stage.stage_order,
      expected_start: stage.expected_start,
      expected_end: stage.expected_end,
      actual_start: stage.actual_start,
      actual_end: stage.actual_end,
      status: stage.status,
      visibility: stage.visibility,
      notes: stage.notes,
    })
    setEditingId(stage.id)
    setShowForm(true)
  }

  async function handleSave() {
    try {
      if (editingId) {
        await updateStage(editingId, form)
      } else {
        await createStage(form)
      }
      setShowForm(false)
      await reload()
      onProgressChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar etapa')
    }
  }

  async function handleStatusChange(stage: ProjectStage, status: ProjectStage['status']) {
    await updateStage(stage.id, { status })
    await reload()
    onProgressChange()
  }

  async function handleDelete(stage: ProjectStage) {
    if (!confirm(`Excluir a etapa "${stage.name}"? Isso também exclui as tarefas dessa etapa.`)) return
    await deleteStage(stage.id)
    await reload()
    onProgressChange()
  }

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Etapas do projeto</h2>
        <button className="btn-primary" onClick={startCreate}>
          + Nova etapa
        </button>
      </div>

      {showForm && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label>
              Nome *
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Ordem
              <input
                type="number"
                value={form.stage_order}
                onChange={(e) => setForm({ ...form, stage_order: Number(e.target.value) })}
              />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StageInput['status'] })}>
                {STAGE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Visibilidade
              <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as StageInput['visibility'] })}>
                {VISIBILITY_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Início previsto
              <input
                type="date"
                value={form.expected_start ?? ''}
                onChange={(e) => setForm({ ...form, expected_start: e.target.value || null })}
              />
            </label>
            <label>
              Fim previsto
              <input
                type="date"
                value={form.expected_end ?? ''}
                onChange={(e) => setForm({ ...form, expected_end: e.target.value || null })}
              />
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#374151' }}>Objetivo</span>
            <textarea
              rows={2}
              style={{ width: '100%', marginTop: '0.3rem' }}
              value={form.objective ?? ''}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
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
      ) : stages.length === 0 ? (
        <div className="empty-state">Nenhuma etapa cadastrada ainda.</div>
      ) : (
        stages.map((stage) => (
          <div className="stage-card" key={stage.id}>
            <div className="stage-card-header">
              <h3>{stage.name}</h3>
              <div className="row-actions">
                <button onClick={() => startEdit(stage)}>Editar</button>
                <button className="danger" onClick={() => handleDelete(stage)}>
                  Excluir
                </button>
              </div>
            </div>
            <div className="stage-meta">
              <select value={stage.status} onChange={(e) => handleStatusChange(stage, e.target.value as ProjectStage['status'])}>
                {STAGE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span>Progresso: {Number(stage.progress).toFixed(0)}%</span>
              {stage.expected_end && <span>Prazo: {stage.expected_end}</span>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
