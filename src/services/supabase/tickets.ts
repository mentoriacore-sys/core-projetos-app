import { supabase } from '../../lib/supabaseClient'
import type { SlaConfig, SupportTicket, TicketAttachment, TicketMessage } from '../../types/database'

export interface TicketWithProject extends SupportTicket {
  projects: { id: string; code: string; name: string; clients: { name: string } | null } | null
}

/** Todos os chamados que o usuário tem acesso (via RLS) — admin vê todos,
 * cliente vê só os do próprio client_id. Usada no dashboard/fila (admin) e
 * na listagem do Portal (cliente). */
export async function listAllTickets() {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*, projects ( id, code, name, clients ( name ) )')
    .order('opened_at', { ascending: false })
  if (error) throw error
  return data as unknown as TicketWithProject[]
}

export async function listTicketsByProject(projectId: string) {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('project_id', projectId)
    .order('opened_at', { ascending: false })
  if (error) throw error
  return data as SupportTicket[]
}

export async function getTicket(id: string) {
  const { data, error } = await supabase.from('support_tickets').select('*').eq('id', id).single()
  if (error) throw error
  return data as SupportTicket
}

export interface CreateTicketInput {
  project_id: string
  client_id: string
  category: SupportTicket['category']
  title: string
  description: string
  reported_impact: SupportTicket['reported_impact']
}

export async function createTicket(input: CreateTicketInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({ ...input, opened_by: user?.id ?? null })
    .select()
    .single()
  if (error) throw error
  return data as SupportTicket
}

export async function updateTicket(id: string, input: Partial<SupportTicket>) {
  const { data, error } = await supabase.from('support_tickets').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as SupportTicket
}

export async function listMessages(ticketId: string) {
  const { data, error } = await supabase
    .from('support_ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as TicketMessage[]
}

export async function addMessage(ticketId: string, message: string, visibility: TicketMessage['visibility'] = 'cliente') {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('support_ticket_messages')
    .insert({ ticket_id: ticketId, message, visibility, author_id: user?.id ?? null })
    .select()
    .single()
  if (error) throw error
  return data as TicketMessage
}

export async function listAttachments(ticketId: string) {
  const { data, error } = await supabase
    .from('support_ticket_attachments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as TicketAttachment[]
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 6 * 1024 * 1024

export async function uploadTicketAttachment(ticket: SupportTicket, file: File) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use PNG, JPG, WEBP ou PDF.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo maior que 6 MB.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const path = `${ticket.client_id}/${ticket.project_id}/${ticket.id}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('support-tickets').upload(path, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('support_ticket_attachments')
    .insert({
      ticket_id: ticket.id,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      uploaded_by: user?.id ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as TicketAttachment
}

export async function getTicketAttachmentUrl(storagePath: string) {
  const { data, error } = await supabase.storage.from('support-tickets').createSignedUrl(storagePath, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export interface TicketHistoryEntry {
  id: string
  ticket_id: string
  event_type: string
  description: string | null
  actor: string | null
  created_at: string
}

export async function listTicketHistory(ticketId: string) {
  const { data, error } = await supabase
    .from('support_ticket_history')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as TicketHistoryEntry[]
}

export async function listSlaConfig() {
  const { data, error } = await supabase.from('sla_config').select('*').order('priority')
  if (error) throw error
  return data as SlaConfig[]
}

export async function updateSlaConfig(priority: string, firstResponseHours: number) {
  const { error } = await supabase
    .from('sla_config')
    .update({ first_response_hours: firstResponseHours, updated_at: new Date().toISOString() })
    .eq('priority', priority)
  if (error) throw error
}
