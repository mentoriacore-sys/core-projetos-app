import { supabase } from '../../lib/supabaseClient'
import type { Approval, Deliverable } from '../../types/database'

export type DeliverableInput = Omit<Deliverable, 'id' | 'created_at' | 'updated_at'>

export async function listDeliverables(projectId: string) {
  const { data, error } = await supabase
    .from('deliverables')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Deliverable[]
}

export async function createDeliverable(input: Partial<DeliverableInput>) {
  const { data, error } = await supabase.from('deliverables').insert(input).select().single()
  if (error) throw error
  return data as Deliverable
}

export async function updateDeliverable(id: string, input: Partial<DeliverableInput>) {
  const { data, error } = await supabase.from('deliverables').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Deliverable
}

export async function deleteDeliverable(id: string) {
  const { error } = await supabase.from('deliverables').delete().eq('id', id)
  if (error) throw error
}

export async function listApprovals(deliverableId: string) {
  const { data, error } = await supabase
    .from('approvals')
    .select('*')
    .eq('deliverable_id', deliverableId)
    .order('decided_at', { ascending: false })
  if (error) throw error
  return data as Approval[]
}

export async function registerApproval(input: {
  deliverable_id: string
  version: string | null
  decision: 'Aprovado' | 'Ajuste solicitado'
  comment: string | null
}) {
  const { data, error } = await supabase.from('approvals').insert(input).select().single()
  if (error) throw error
  return data as Approval
}
