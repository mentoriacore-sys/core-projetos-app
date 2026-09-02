import { supabase } from '../../lib/supabaseClient'
import type { Task, TaskAttachment, TaskComment } from '../../types/database'

export type TaskInput = Omit<
  Task,
  'id' | 'completed_at' | 'created_at' | 'updated_at' | 'is_blocking' | 'schedule_impact_status' | 'schedule_impact_note' | 'updated_by'
>

export async function listTasksByProject(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Task[]
}

export async function getTask(id: string) {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (error) throw error
  return data as Task
}

export async function listComments(taskId: string) {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as TaskComment[]
}

export async function addComment(taskId: string, message: string, visibility: TaskComment['visibility'] = 'both') {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, message, visibility, author_id: user?.id ?? null })
    .select()
    .single()
  if (error) throw error
  return data as TaskComment
}

export async function listAttachments(taskId: string) {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as TaskAttachment[]
}

/** Uma única consulta para contar anexos de várias tarefas de uma vez —
 * evita disparar uma requisição por tarefa (N+1) na listagem. */
export async function countAttachmentsByTask(taskIds: string[]) {
  if (taskIds.length === 0) return {} as Record<string, number>
  const { data, error } = await supabase.from('task_attachments').select('task_id').in('task_id', taskIds)
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data as { task_id: string }[]) {
    counts[row.task_id] = (counts[row.task_id] ?? 0) + 1
  }
  return counts
}

export async function uploadAttachment(taskId: string, file: File) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const path = `${taskId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('task-attachments').upload(path, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      uploaded_by: user?.id ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as TaskAttachment
}

export async function getAttachmentUrl(storagePath: string) {
  const { data, error } = await supabase.storage.from('task-attachments').createSignedUrl(storagePath, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export async function deleteAttachment(attachment: TaskAttachment) {
  await supabase.storage.from('task-attachments').remove([attachment.storage_path])
  const { error } = await supabase.from('task_attachments').delete().eq('id', attachment.id)
  if (error) throw error
}

export async function createTask(input: TaskInput) {
  const { data, error } = await supabase.from('tasks').insert(input).select().single()
  if (error) throw error
  return data as Task
}

export async function updateTask(id: string, input: Partial<Task>) {
  const { data, error } = await supabase.from('tasks').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
