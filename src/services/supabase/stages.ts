import { supabase } from '../../lib/supabaseClient'
import type { ProjectStage } from '../../types/database'

export type StageInput = Omit<ProjectStage, 'id' | 'progress' | 'created_at' | 'updated_at'>

export async function listStages(projectId: string) {
  const { data, error } = await supabase
    .from('project_stages')
    .select('*')
    .eq('project_id', projectId)
    .order('stage_order', { ascending: true })
  if (error) throw error
  return data as ProjectStage[]
}

export async function createStage(input: StageInput) {
  const { data, error } = await supabase.from('project_stages').insert(input).select().single()
  if (error) throw error
  return data as ProjectStage
}

export async function updateStage(id: string, input: Partial<StageInput>) {
  const { data, error } = await supabase
    .from('project_stages')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ProjectStage
}

export async function deleteStage(id: string) {
  const { error } = await supabase.from('project_stages').delete().eq('id', id)
  if (error) throw error
}
