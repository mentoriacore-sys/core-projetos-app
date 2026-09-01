import { supabase } from '../../lib/supabaseClient'
import type { Project, ProjectWithClient } from '../../types/database'

export type ProjectInput = Omit<Project, 'id' | 'code' | 'progress' | 'created_at' | 'updated_at'>

interface ListFilters {
  search: string
  status: string
  clientId: string
}

export async function listProjects(filters: ListFilters) {
  let query = supabase
    .from('projects')
    .select('*, clients ( id, code, name, company )')
    .order('created_at', { ascending: false })

  if (filters.search.trim()) {
    query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as unknown as ProjectWithClient[]
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, clients ( id, code, name, company )')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as ProjectWithClient
}

export async function createProject(input: ProjectInput) {
  const { data, error } = await supabase.from('projects').insert(input).select().single()
  if (error) throw error
  return data as Project
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  const { data, error } = await supabase.from('projects').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Project
}
