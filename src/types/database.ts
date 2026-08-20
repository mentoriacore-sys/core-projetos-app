export type UserRole = 'admin' | 'team' | 'client'

export interface Profile {
  id: string
  role: UserRole
  name: string | null
  email: string | null
  created_at: string
}

export const CLIENT_ORIGIN_OPTIONS = [
  'Mentoria',
  'Origem Estratégica',
  'Fluxo Estruturado',
  'Projeto Avulso',
  'Indicação',
  'Outro',
] as const

export interface Client {
  id: string
  code: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  segment: string | null
  origin: (typeof CLIENT_ORIGIN_OPTIONS)[number] | null
  internal_note: string | null
  status: string | null
  base_core_client_id: string | null
  created_at: string
  updated_at: string
}

export const PROJECT_STATUS_OPTIONS = [
  'Planejamento',
  'Não iniciado',
  'Em andamento',
  'Aguardando cliente',
  'Aguardando terceiro',
  'Em revisão',
  'Em atenção',
  'Bloqueado',
  'Pausado',
  'Concluído',
  'Cancelado',
  'Em acompanhamento',
  'Acompanhamento encerrado',
] as const

export const PROJECT_HEALTH_OPTIONS = ['Verde', 'Amarelo', 'Vermelho'] as const

export const RESPONSIBILITY_OPTIONS = ['C.O.R.E.', 'Cliente', 'Terceiro', 'Equipe', 'Nenhuma'] as const

export interface Project {
  id: string
  code: string
  client_id: string
  name: string
  description: string | null
  context: string | null
  problem_identified: string | null
  objective: string | null
  expected_result: string | null
  scope_included: string | null
  scope_excluded: string | null
  assumptions: string | null
  start_date: string | null
  expected_end_date: string | null
  actual_end_date: string | null
  status: (typeof PROJECT_STATUS_OPTIONS)[number]
  health: (typeof PROJECT_HEALTH_OPTIONS)[number] | null
  priority: string | null
  progress: number
  current_responsibility: (typeof RESPONSIBILITY_OPTIONS)[number] | null
  created_at: string
  updated_at: string
}

export interface ProjectWithClient extends Project {
  clients: Pick<Client, 'id' | 'code' | 'name'> | null
}
