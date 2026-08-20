import { supabase } from '../../lib/supabaseClient'

const PROJECT_JOIN = 'id, code, name, client_id, clients ( name )'

export async function listActiveProjectsForDashboard() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, clients ( id, name )')
    .not('status', 'in', '("Concluído","Cancelado","Acompanhamento encerrado")')
  if (error) throw error
  return data
}

export async function listOverdueTasks() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('tasks')
    .select(`*, projects ( ${PROJECT_JOIN} )`)
    .lt('expected_date', today)
    .not('status', 'in', '("Concluída","Cancelada")')
  if (error) throw error
  return data
}

export async function listOverdueDeliverables() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('deliverables')
    .select(`*, projects ( ${PROJECT_JOIN} )`)
    .lt('due_date', today)
    .neq('status', 'Entregue')
  if (error) throw error
  return data
}

export async function listUpcomingDeliverables(days: number) {
  const today = new Date()
  const future = new Date(today.getTime() + days * 86400000)
  const { data, error } = await supabase
    .from('deliverables')
    .select(`*, projects ( ${PROJECT_JOIN} )`)
    .gte('due_date', today.toISOString().slice(0, 10))
    .lte('due_date', future.toISOString().slice(0, 10))
    .neq('status', 'Entregue')
  if (error) throw error
  return data
}

export async function listAdjustmentsRequested() {
  const { data, error } = await supabase
    .from('deliverables')
    .select(`*, projects ( ${PROJECT_JOIN} )`)
    .eq('status', 'Ajustes solicitados')
  if (error) throw error
  return data
}

export async function listCriticalRisks() {
  const { data, error } = await supabase
    .from('project_risks')
    .select(`*, projects ( ${PROJECT_JOIN} )`)
    .eq('impact', 'Alto')
    .neq('status', 'Encerrado')
  if (error) throw error
  return data
}

export async function listPendingScopeChanges() {
  const { data, error } = await supabase
    .from('scope_changes')
    .select(`*, projects ( ${PROJECT_JOIN} )`)
    .eq('decision', 'Em análise')
  if (error) throw error
  return data
}

export async function listBlockingDependencies() {
  const { data, error } = await supabase
    .from('dependencies')
    .select(`*, projects ( ${PROJECT_JOIN} )`)
    .eq('status', 'Bloqueadora')
  if (error) throw error
  return data
}
