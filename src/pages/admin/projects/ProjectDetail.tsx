import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProject } from '../../../services/supabase/projects'
import { listStages } from '../../../services/supabase/stages'
import { listTasksByProject } from '../../../services/supabase/tasks'
import { listDeliverables } from '../../../services/supabase/deliverables'
import type { Deliverable, ProjectStage, ProjectWithClient, Task } from '../../../types/database'
import { StatusBadge } from '../../../components/common/Badge'
import ProjectSummaryCard from './ProjectSummaryCard'
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
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectWithClient | null>(null)
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [tab, setTab] = useState<Tab>('geral')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getProject(id), listStages(id), listTasksByProject(id), listDeliverables(id)])
      .then(([p, s, t, d]) => {
        setProject(p)
        setStages(s)
        setTasks(t)
        setDeliverables(d)
      })
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
      <div className="project-header">
        <div className="project-header-main">
          <div className="project-breadcrumb">
            <Link to="/admin/projetos">Projetos</Link> / {project.code}
          </div>
          <div className="project-title-row">
            <h1>{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="project-client-line">
            Cliente: <strong>{project.clients?.name ?? '—'}</strong>
            {project.clients?.company && (
              <>
                {' '}
                &nbsp;·&nbsp; Empresa: <strong>{project.clients.company}</strong>
              </>
            )}
          </div>
        </div>
        <div className="project-header-actions">
          <button className="btn-secondary" onClick={() => navigate('/admin/projetos')}>
            ← Voltar para projetos
          </button>
          <div className="project-menu-wrap">
            <button className="btn-secondary project-menu-btn" onClick={() => setMenuOpen((o) => !o)}>
              ⋮
            </button>
            {menuOpen && (
              <div className="project-menu-dropdown" onMouseLeave={() => setMenuOpen(false)}>
                <Link to={`/admin/projetos/${id}/editar`}>Editar dados do projeto</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProjectSummaryCard project={project} stages={stages} tasks={tasks} deliverables={deliverables} />

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
      {tab === 'entregaveis' && <DeliverablesTab projectId={id} onChange={refreshProject} />}
      {tab === 'dependencias' && <DependenciesTab projectId={id} />}
      {tab === 'documentos' && <DocumentsTab projectId={id} />}
      {tab === 'decisoes' && <DecisionsTab projectId={id} />}
      {tab === 'riscos' && <RisksTab projectId={id} />}
      {tab === 'escopo' && <ScopeChangesTab projectId={id} />}
      {tab === 'historico' && <HistoryTab projectId={id} />}
    </div>
  )
}
