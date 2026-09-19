import { supabase } from '../../lib/supabaseClient'
import { listTasksByProject } from './tasks'
import { listDeliverables } from './deliverables'
import { listRisks } from './risks'
import { listDecisions } from './decisions'
import type { ProjectReport, ReportItem } from '../../types/database'

export interface ReportWithItems extends ProjectReport {
  report_items: ReportItem[]
}

export async function listReports(projectId: string) {
  const { data, error } = await supabase
    .from('project_reports')
    .select('*, report_items ( * )')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as ReportWithItems[]
}

export async function getReport(id: string) {
  const { data, error } = await supabase.from('project_reports').select('*, report_items ( * )').eq('id', id).single()
  if (error) throw error
  return data as unknown as ReportWithItems
}

export interface ProjectReportWithProject extends ProjectReport {
  projects: { id: string; code: string; name: string; clients: { name: string } | null } | null
}

/** Todos os relatórios (rascunho + publicados) de todos os projetos que o
 * usuário tem acesso (via RLS) — usada na tela "Relatórios" geral (admin). */
export async function listAllReports() {
  const { data, error } = await supabase
    .from('project_reports')
    .select('*, projects ( id, code, name, clients ( name ) )')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as ProjectReportWithProject[]
}

/** Relatórios publicados de um projeto — usado no Portal do Cliente (RLS
 * já restringe a rascunhos nunca aparecerem para o papel client). */
export async function listPublishedReports(projectId: string) {
  const { data, error } = await supabase
    .from('project_reports')
    .select('*, report_items ( * )')
    .eq('project_id', projectId)
    .eq('status', 'Publicado')
    .order('published_at', { ascending: false })
  if (error) throw error
  return data as unknown as ReportWithItems[]
}

/** Gera um novo relatório em Rascunho, pré-preenchido a partir do estado
 * atual do projeto (seção 42 da spec). Nada aqui é publicado automaticamente
 * (seção 43) — fica editável até a administradora decidir publicar. */
export async function generateReport(projectId: string, periodStart: string | null, periodEnd: string | null) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [tasks, deliverables, risks, decisions] = await Promise.all([
    listTasksByProject(projectId),
    listDeliverables(projectId),
    listRisks(projectId),
    listDecisions(projectId),
  ])

  const inPeriod = (dateStr: string | null) => {
    if (!dateStr) return false
    if (periodStart && dateStr < periodStart) return false
    if (periodEnd && dateStr > periodEnd) return false
    return true
  }

  const { data: report, error } = await supabase
    .from('project_reports')
    .insert({
      project_id: projectId,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'Rascunho',
      executive_summary: '',
      created_by: user?.id ?? null,
    })
    .select()
    .single()
  if (error) throw error

  const items: { report_id: string; item_type: string; description: string }[] = []

  tasks
    .filter((t) => t.status === 'Concluída' && t.completed_at && inPeriod(t.completed_at.slice(0, 10)))
    .forEach((t) => items.push({ report_id: report.id, item_type: 'concluido_no_periodo', description: t.title }))

  tasks
    .filter((t) => t.status === 'Em andamento')
    .forEach((t) => items.push({ report_id: report.id, item_type: 'em_andamento', description: t.title }))

  tasks
    .filter((t) => t.status === 'Aguardando' && t.responsible === 'Cliente')
    .forEach((t) => items.push({ report_id: report.id, item_type: 'aguardando_cliente', description: t.title }))

  deliverables
    .filter((d) => d.status !== 'Aprovado' && d.status !== 'Entregue')
    .forEach((d) =>
      items.push({
        report_id: report.id,
        item_type: 'proxima_entrega',
        description: d.due_date ? `${d.name} — prazo ${d.due_date}` : d.name,
      }),
    )

  risks
    .filter((r) => r.status !== 'Encerrado' && r.status !== 'Mitigado')
    .forEach((r) =>
      items.push({
        report_id: report.id,
        item_type: 'risco',
        description: r.mitigation ? `${r.risk} — mitigação: ${r.mitigation}` : r.risk,
      }),
    )

  decisions
    .filter((d) => inPeriod(d.decision_date))
    .forEach((d) => items.push({ report_id: report.id, item_type: 'decisao', description: d.decision }))

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('report_items').insert(items)
    if (itemsError) throw itemsError
  }

  return getReport(report.id)
}

export async function updateReport(id: string, input: Partial<Pick<ProjectReport, 'period_start' | 'period_end' | 'executive_summary'>>) {
  const { data, error } = await supabase.from('project_reports').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as ProjectReport
}

export async function deleteReport(id: string) {
  const { error } = await supabase.from('project_reports').delete().eq('id', id)
  if (error) throw error
}

export async function addReportItem(reportId: string, itemType: string, description: string) {
  const { data, error } = await supabase
    .from('report_items')
    .insert({ report_id: reportId, item_type: itemType, description })
    .select()
    .single()
  if (error) throw error
  return data as ReportItem
}

export async function updateReportItem(id: string, description: string) {
  const { error } = await supabase.from('report_items').update({ description }).eq('id', id)
  if (error) throw error
}

export async function deleteReportItem(id: string) {
  const { error } = await supabase.from('report_items').delete().eq('id', id)
  if (error) throw error
}

/** Publica o relatório: congela o conteúdo atual em `content` (seção 44 —
 * snapshot) e marca como Publicado. A partir daqui o relatório não deve mais
 * ser editado; uma correção posterior exige gerar um novo relatório/versão. */
export async function publishReport(id: string) {
  const report = await getReport(id)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const content = {
    period_start: report.period_start,
    period_end: report.period_end,
    executive_summary: report.executive_summary,
    items: report.report_items.map((i) => ({ item_type: i.item_type, description: i.description })),
    published_by: user?.id ?? null,
  }

  const { data, error } = await supabase
    .from('project_reports')
    .update({ status: 'Publicado', published_at: new Date().toISOString(), content })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ProjectReport
}
