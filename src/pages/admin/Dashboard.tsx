import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listActiveProjectsForDashboard,
  listAdjustmentsRequested,
  listBlockingDependencies,
  listCriticalRisks,
  listOverdueDeliverables,
  listOverdueTasks,
  listPendingScopeChanges,
  listUpcomingDeliverables,
} from '../../services/supabase/dashboard'
import { getErrorMessage } from '../../lib/errorMessage'
import '../../components/common/admin-ui.css'
import './Dashboard.css'

interface ProjectRef {
  id: string
  code: string
  name: string
  clients: { name: string } | null
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(from: string, to: string) {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000)
}

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [overdueTasks, setOverdueTasks] = useState<any[]>([])
  const [overdueDeliverables, setOverdueDeliverables] = useState<any[]>([])
  const [upcomingDeliverables, setUpcomingDeliverables] = useState<any[]>([])
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [criticalRisks, setCriticalRisks] = useState<any[]>([])
  const [pendingScope, setPendingScope] = useState<any[]>([])
  const [blockingDeps, setBlockingDeps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      listActiveProjectsForDashboard(),
      listOverdueTasks(),
      listOverdueDeliverables(),
      listUpcomingDeliverables(7),
      listAdjustmentsRequested(),
      listCriticalRisks(),
      listPendingScopeChanges(),
      listBlockingDependencies(),
    ])
      .then(([p, ot, od, ud, adj, risks, scope, deps]) => {
        setProjects(p)
        setOverdueTasks(ot)
        setOverdueDeliverables(od)
        setUpcomingDeliverables(ud)
        setAdjustments(adj)
        setCriticalRisks(risks)
        setPendingScope(scope)
        setBlockingDeps(deps)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Carregando...</p>
  if (error) return <p className="form-error">{error}</p>

  const today = todayISO()
  const dentroDoPrazo = projects.filter((p) => !p.expected_end_date || p.expected_end_date >= today).length
  const atrasados = projects.filter((p) => p.expected_end_date && p.expected_end_date < today).length
  const emAtencao = projects.filter((p) => p.health === 'Amarelo').length
  const criticos = projects.filter((p) => p.health === 'Vermelho').length
  const aguardandoCliente = projects.filter((p) => p.status === 'Aguardando cliente')
  const bloqueados = projects.filter((p) => p.status === 'Bloqueado').length

  const indicators = [
    { label: 'Projetos ativos', value: projects.length },
    { label: 'Dentro do prazo', value: dentroDoPrazo },
    { label: 'Em atenção', value: emAtencao },
    { label: 'Críticos', value: criticos },
    { label: 'Atrasados', value: atrasados },
    { label: 'Aguardando cliente', value: aguardandoCliente.length },
    { label: 'Bloqueados', value: bloqueados },
    { label: 'Próximas entregas (7 dias)', value: upcomingDeliverables.length },
    { label: 'Entregas vencidas', value: overdueDeliverables.length },
  ]

  const attentionCount =
    overdueTasks.length +
    overdueDeliverables.length +
    adjustments.length +
    criticalRisks.length +
    pendingScope.length +
    criticos +
    blockingDeps.length

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="indicator-grid">
        {indicators.map((i) => (
          <div className="indicator-card" key={i.label}>
            <span className="indicator-value">{i.value}</span>
            <span className="indicator-label">{i.label}</span>
          </div>
        ))}
      </div>

      <section className="dashboard-section">
        <h2>Precisa da minha atenção {attentionCount > 0 && <span className="attention-badge">{attentionCount}</span>}</h2>

        {attentionCount === 0 ? (
          <div className="empty-state">Nada pendente no momento.</div>
        ) : (
          <div className="attention-list">
            {overdueTasks.map((t) => (
              <ProjectRefRow key={`task-${t.id}`} project={t.projects} label={`Tarefa vencida: ${t.title}`} meta={t.expected_date} />
            ))}
            {overdueDeliverables.map((d) => (
              <ProjectRefRow key={`del-${d.id}`} project={d.projects} label={`Entrega vencida: ${d.name}`} meta={d.due_date} />
            ))}
            {adjustments.map((d) => (
              <ProjectRefRow key={`adj-${d.id}`} project={d.projects} label={`Ajuste solicitado: ${d.name}`} />
            ))}
            {criticalRisks.map((r) => (
              <ProjectRefRow key={`risk-${r.id}`} project={r.projects} label={`Risco crítico: ${r.risk}`} />
            ))}
            {pendingScope.map((s) => (
              <ProjectRefRow key={`scope-${s.id}`} project={s.projects} label={`Alteração de escopo pendente: ${s.description}`} />
            ))}
            {projects
              .filter((p) => p.health === 'Vermelho')
              .map((p) => (
                <ProjectRefRow key={`crit-${p.id}`} project={p} label="Projeto crítico" />
              ))}
            {blockingDeps.map((dep) => (
              <ProjectRefRow key={`block-${dep.id}`} project={dep.projects} label={`Bloqueio: ${dep.description}`} />
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Aguardando Cliente</h2>
        {aguardandoCliente.length === 0 ? (
          <div className="empty-state">Nenhum projeto aguardando o cliente no momento.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Projeto</th>
                <th>Desde</th>
                <th>Dias aguardando</th>
              </tr>
            </thead>
            <tbody>
              {aguardandoCliente.map((p) => (
                <tr key={p.id} onClick={() => (window.location.href = `/admin/projetos/${p.id}`)}>
                  <td>{p.clients?.name ?? '—'}</td>
                  <td>{p.name}</td>
                  <td>{p.updated_at.slice(0, 10)}</td>
                  <td>{daysBetween(p.updated_at.slice(0, 10), today)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function ProjectRefRow({ project, label, meta }: { project: ProjectRef | null; label: string; meta?: string | null }) {
  if (!project) return null
  return (
    <Link to={`/admin/projetos/${project.id}`} className="attention-row">
      <span className="attention-project">
        {project.code} — {project.clients?.name ?? project.name}
      </span>
      <span className="attention-desc">{label}</span>
      {meta && <span className="attention-meta">{meta}</span>}
    </Link>
  )
}
