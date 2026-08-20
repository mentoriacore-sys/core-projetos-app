import { supabase } from '../../lib/supabaseClient'
import type { ProjectRisk } from '../../types/database'

export type RiskInput = Omit<ProjectRisk, 'id' | 'created_at' | 'updated_at'>

export async function listRisks(projectId: string) {
  const { data, error } = await supabase
    .from('project_risks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ProjectRisk[]
}

export async function createRisk(input: Partial<RiskInput>) {
  const { data, error } = await supabase.from('project_risks').insert(input).select().single()
  if (error) throw error
  return data as ProjectRisk
}

export async function updateRisk(id: string, input: Partial<RiskInput>) {
  const { data, error } = await supabase.from('project_risks').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as ProjectRisk
}
