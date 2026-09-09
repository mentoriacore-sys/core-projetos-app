import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProject } from '../../services/supabase/projects'
import { listStages } from '../../services/supabase/stages'
import { listTasksByProject } from '../../services/supabase/tasks'
import { listDeliverables } from '../../services/supabase/deliverables'
import type { Deliverable, ProjectStage, ProjectWithClient, Task } from '../../types/database'
import { StatusBadge } from '../../components/common/Badge'
import ProjectSummaryCard from '../admin/projects/ProjectSummaryCard'
import PortalStagesView from './PortalStagesView'
import PortalTasksView from './PortalTasksView'
import PortalDeliverablesView from './PortalDeliverablesView'
import PortalDocumentsView from './PortalDocumentsView'
import HistoryTab from '../admin/projects/HistoryTab'
import { getErrorMessage } from '../../lib/errorMessage'
import '../../components/common/admin-ui.css'
import '../admin/projects/ProjectDetail.css'

type Tab = 'geral' | 'etapas' | 'tarefas' | 'entregaveis' | 'documentos' | 'historico'

const TABS: { key: Tab; label: string }[] = [
  { key: 'geral', label: 'Visão Geral' },
  { key: 'etapas', label: 'Etapas' },
  { key: 'tarefas', label: 'Tarefas' },
  { key: 'entregaveis', label: 'Entregáveis' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'historico', label: 'Histórico' },
]

export default function PortalProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState<ProjectWithClient | null>(null)
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [tab, setTab] = useState<Tab>('geral')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading((prev) => (project ? prev : true))
    Promise.all([getProject(id), listStages(id), listTasksByProject(id), listDeliverables(id)])
      .then(([p, s, t, d]) => {
        setProject(p)
        setStages(s)
        setTasks(t)
        setDeliverables(d)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reloadKey])

  function refresh() {
    setReloadKey((k) => k + 1)
  }

  if (loading) return <p>Carregando...</p>
  if (error) return <p className="form-error">{error}</p>
  if (!project || !id) return null

  return (
    <div>
      <div className="project-header">
        <div className="project-header-main">
          <div className="project-title-row">
            <h1>{project.name}</h1>
            <StatusBadge status={project.status} />
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
            <dt>Objetivo</dt>
            <dd>{project.objective || '—'}</dd>
            <dt>Resultado esperado</dt>
            <dd>{project.expected_result || '—'}</dd>
            <dt>Escopo incluído</dt>
            <dd>{project.scope_included || '—'}</dd>
          </dl>
        </div>
      )}

      {tab === 'etapas' && <PortalStagesView stages={stages} />}
      {tab === 'tarefas' && <PortalTasksView projectId={id} tasks={tasks} stages={stages} onChange={refresh} />}
      {tab === 'entregaveis' && <PortalDeliverablesView projectId={id} onChange={refresh} />}
      {tab === 'documentos' && <PortalDocumentsView projectId={id} />}
      {tab === 'historico' && <HistoryTab projectId={id} />}
    </div>
  )
}
