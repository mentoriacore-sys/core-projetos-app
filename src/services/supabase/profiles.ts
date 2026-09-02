import { supabase } from '../../lib/supabaseClient'
import type { Profile } from '../../types/database'

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) throw error
  return data as Profile[]
}
