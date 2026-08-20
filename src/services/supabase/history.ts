import { supabase } from '../../lib/supabaseClient'
import type { ProjectHistoryEntry } from '../../types/database'

export async function listHistory(projectId: string) {
  const { data, error } = await supabase
    .from('project_history')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ProjectHistoryEntry[]
}
