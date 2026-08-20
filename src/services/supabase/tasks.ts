import { supabase } from '../../lib/supabaseClient'
import type { Task } from '../../types/database'

export type TaskInput = Omit<Task, 'id' | 'completed_at' | 'created_at' | 'updated_at'>

export async function listTasksByProject(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Task[]
}

export async function createTask(input: TaskInput) {
  const { data, error } = await supabase.from('tasks').insert(input).select().single()
  if (error) throw error
  return data as Task
}

export async function updateTask(id: string, input: Partial<TaskInput> & { completed_at?: string | null }) {
  const { data, error } = await supabase.from('tasks').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
