import { supabase } from '../../lib/supabaseClient'
import type { ProjectDecision } from '../../types/database'

export type DecisionInput = Omit<ProjectDecision, 'id' | 'created_at'>

export async function listDecisions(projectId: string) {
  const { data, error } = await supabase
    .from('project_decisions')
    .select('*')
    .eq('project_id', projectId)
    .order('decision_date', { ascending: false })
  if (error) throw error
  return data as ProjectDecision[]
}

export async function createDecision(input: Partial<DecisionInput>) {
  const { data, error } = await supabase.from('project_decisions').insert(input).select().single()
  if (error) throw error
  return data as ProjectDecision
}
