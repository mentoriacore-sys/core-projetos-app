import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProject } from '../../../services/supabase/projects'
import type { ProjectWithClient } from '../../../types/database'
import StagesTab from './StagesTab'
import TasksTab from './TasksTab'
import DependenciesTab from './DependenciesTab'
import DeliverablesTab from './DeliverablesTab'
import ScopeChangesTab from './ScopeChangesTab'
import DecisionsTab from './DecisionsTab'
import RisksTab from './RisksTab'
import DocumentsTab from './DocumentsTab'
import HistoryTab from './HistoryTab'
import { getErrorMessage } from '../../../lib/errorMessage'
import '../../../components/common/admin-ui.css'
import './ProjectDetail.css'

type Tab =
  | 'geral'
  | 'etapas'
  | 'tarefas'
  | 'entregaveis'
  | 'dependencias'
  | 'documentos'
  | 'decisoes'
  | 'riscos'
  | 'escopo'
  | 'historico'

const TABS: { key: Tab; label: string }[] = [
  { key: 'geral', label: 'Visão Geral' },
  { key: 'etapas', label: 'Etapas' },
  { key: 'tarefas', label: 'Tarefas' },
  { key: 'entregaveis', label: 'Entregáveis' },
  { key: 'dependencias', label: 'Dependências' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'decisoes', label: 'Decisões' },
  { key: 'riscos', label: 'Riscos' },
  { key: 'escopo', label: 'Alteração de Escopo' },
  { key: 'historico', label: 'Histórico' },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState<ProjectWithClient | null>(null)
  const [tab, setTab] = useState<Tab>('geral')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getProject(id)
      .then(setProject)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, reloadKey])

  function refreshProject() {
    setReloadKey((k) => k + 1)
  }

  if (loading) return <p>Carregando...</p>
  if (error) return <p className="form-error">{error}</p>
  if (!project || !id) return null

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="project-breadcrumb">
            <Link to="/admin/projetos">Projetos</Link> / {project.code}
          </div>
          <h1>{project.name}</h1>
        </div>
        <Link to={`/admin/projetos/${id}/editar`} className="btn-secondary">
          Editar dados do projeto
        </Link>
      </div>

      <div className="project-summary">
        <div>
          <span className="summary-label">Cliente</span>
          <span>{project.clients?.name ?? '—'}</span>
        </div>
        <div>
          <span className="summary-label">Status</span>
          <span className="status-badge">{project.status}</span>
        </div>
        <div>
          <span className="summary-label">Saúde</span>
          <span>{project.health ?? '—'}</span>
        </div>
        <div>
          <span className="summary-label">Responsabilidade atual</span>
          <span>{project.current_responsibility ?? '—'}</span>
        </div>
        <div>
          <span className="summary-label">Início</span>
          <span>{project.start_date ?? '—'}</span>
        </div>
        <div>
          <span className="summary-label">Previsão de conclusão</span>
          <span>{project.expected_end_date ?? '—'}</span>
        </div>
        <div className="progress-cell">
          <span className="summary-label">Progresso</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${project.progress}%` }} />
          </div>
          <span>{Number(project.progress).toFixed(0)}%</span>
        </div>
      </div>

      <div className="tabs-bar">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'geral' && (
        <div className="form-card">
          <dl className="detail-list">
            <dt>Descrição</dt>
            <dd>{project.description || '—'}</dd>
            <dt>Contexto</dt>
            <dd>{project.context || '—'}</dd>
            <dt>Problema identificado</dt>
            <dd>{project.problem_identified || '—'}</dd>
            <dt>Objetivo</dt>
            <dd>{project.objective || '—'}</dd>
            <dt>Resultado esperado</dt>
            <dd>{project.expected_result || '—'}</dd>
            <dt>Escopo incluído</dt>
            <dd>{project.scope_included || '—'}</dd>
            <dt>Fora do escopo</dt>
            <dd>{project.scope_excluded || '—'}</dd>
            <dt>Premissas</dt>
            <dd>{project.assumptions || '—'}</dd>
          </dl>
        </div>
      )}

      {tab === 'etapas' && <StagesTab projectId={id} onProgressChange={refreshProject} />}
      {tab === 'tarefas' && <TasksTab projectId={id} onProgressChange={refreshProject} />}
      {tab === 'entregaveis' && <DeliverablesTab projectId={id} />}
      {tab === 'dependencias' && <DependenciesTab projectId={id} />}
      {tab === 'documentos' && <DocumentsTab projectId={id} />}
      {tab === 'decisoes' && <DecisionsTab projectId={id} />}
      {tab === 'riscos' && <RisksTab projectId={id} />}
      {tab === 'escopo' && <ScopeChangesTab projectId={id} />}
      {tab === 'historico' && <HistoryTab projectId={id} />}
    </div>
  )
}
