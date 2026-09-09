import { supabase } from '../../lib/supabaseClient'

export interface ClientUserRow {
  id: string
  client_id: string
  user_id: string
  label: string | null
  access_status: 'Ativo' | 'Acesso encerrado' | 'Bloqueado'
  access_ends_at: string | null
  created_at: string
  profiles: { name: string | null; email: string | null } | null
}

export async function listClientUsers(clientId: string) {
  const { data, error } = await supabase
    .from('client_users')
    .select('*, profiles ( name, email )')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as unknown as ClientUserRow[]
}

/** Vincula um usuário já cadastrado (por e-mail) a um cliente. O usuário
 * precisa ter se cadastrado antes pela tela de login — não criamos contas
 * por aqui (só a própria pessoa define sua senha). */
export async function linkUserToClientByEmail(clientId: string, email: string, label: string) {
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (findError) throw findError
  if (!profile) {
    throw new Error('Nenhuma conta encontrada com esse e-mail. A pessoa precisa se cadastrar primeiro pela tela de login.')
  }

  const { data, error } = await supabase
    .from('client_users')
    .insert({ client_id: clientId, user_id: profile.id, label, access_status: 'Ativo' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClientUserAccess(id: string, access_status: ClientUserRow['access_status']) {
  const { error } = await supabase.from('client_users').update({ access_status }).eq('id', id)
  if (error) throw error
}

export async function removeClientUser(id: string) {
  const { error } = await supabase.from('client_users').delete().eq('id', id)
  if (error) throw error
}
