import { supabase } from '../../lib/supabaseClient'
import type { ScopeChange } from '../../types/database'

export type ScopeChangeInput = Omit<ScopeChange, 'id' | 'created_at' | 'updated_at'>

export async function listScopeChanges(projectId: string) {
  const { data, error } = await supabase
    .from('scope_changes')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ScopeChange[]
}

export async function createScopeChange(input: Partial<ScopeChangeInput>) {
  const { data, error } = await supabase.from('scope_changes').insert(input).select().single()
  if (error) throw error
  return data as ScopeChange
}

export async function updateScopeChange(id: string, input: Partial<ScopeChangeInput>) {
  const { data, error } = await supabase.from('scope_changes').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as ScopeChange
}
