import { supabase } from '../../lib/supabaseClient'
import type { Client } from '../../types/database'

export type ClientInput = Omit<Client, 'id' | 'code' | 'created_at' | 'updated_at'>

export async function listClients(search: string) {
  let query = supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,code.ilike.%${search}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return data as Client[]
}

export async function getClient(id: string) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
  if (error) throw error
  return data as Client
}

export async function createClient(input: ClientInput) {
  const { data, error } = await supabase.from('clients').insert(input).select().single()
  if (error) throw error
  return data as Client
}

export async function updateClient(id: string, input: Partial<ClientInput>) {
  const { data, error } = await supabase.from('clients').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Client
}
