import { supabase } from '../../lib/supabaseClient'
import type { ProjectFile, ProjectLink } from '../../types/database'

export type ProjectFileInput = Omit<ProjectFile, 'id' | 'created_at'>
export type ProjectLinkInput = Omit<ProjectLink, 'id' | 'created_at'>

export async function listFiles(projectId: string) {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ProjectFile[]
}

export async function createFile(input: Partial<ProjectFileInput>) {
  const { data, error } = await supabase.from('project_files').insert(input).select().single()
  if (error) throw error
  return data as ProjectFile
}

export async function deleteFile(id: string) {
  const { error } = await supabase.from('project_files').delete().eq('id', id)
  if (error) throw error
}

export async function listLinks(projectId: string) {
  const { data, error } = await supabase
    .from('project_links')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ProjectLink[]
}

export async function createLink(input: Partial<ProjectLinkInput>) {
  const { data, error } = await supabase.from('project_links').insert(input).select().single()
  if (error) throw error
  return data as ProjectLink
}

export async function deleteLink(id: string) {
  const { error } = await supabase.from('project_links').delete().eq('id', id)
  if (error) throw error
}
