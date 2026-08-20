import { supabase } from '../../lib/supabaseClient'
import type { Dependency } from '../../types/database'

export type DependencyInput = Omit<Dependency, 'id' | 'created_at' | 'updated_at'>

export async function listDependencies(projectId: string) {
  const { data, error } = await supabase
    .from('dependencies')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Dependency[]
}

export async function createDependency(input: Partial<DependencyInput>) {
  const { data, error } = await supabase.from('dependencies').insert(input).select().single()
  if (error) throw error
  return data as Dependency
}

export async function updateDependency(id: string, input: Partial<DependencyInput>) {
  const { data, error } = await supabase.from('dependencies').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Dependency
}

export async function deleteDependency(id: string) {
  const { error } = await supabase.from('dependencies').delete().eq('id', id)
  if (error) throw error
}
