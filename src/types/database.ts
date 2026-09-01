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
  clients: Pick<Client, 'id' | 'code' | 'name' | 'company'> | null
}

export const STAGE_STATUS_OPTIONS = [
  'Não iniciada',
  'Em andamento',
  'Aguardando',
  'Em revisão',
  'Concluída',
  'Cancelada',
] as const

export const VISIBILITY_OPTIONS = [
  { value: 'both', label: 'Interno + Cliente' },
  { value: 'internal', label: 'Somente interno' },
  { value: 'client', label: 'Somente cliente' },
] as const

export interface ProjectStage {
  id: string
  project_id: string
  name: string
  description: string | null
  objective: string | null
  stage_order: number
  expected_start: string | null
  expected_end: string | null
  actual_start: string | null
  actual_end: string | null
  status: (typeof STAGE_STATUS_OPTIONS)[number]
  progress: number
  visibility: 'internal' | 'client' | 'both'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  stage_id: string
  project_id: string
  title: string
  description: string | null
  responsible: (typeof RESPONSIBILITY_OPTIONS)[number] | null
  priority: string | null
  status: (typeof STAGE_STATUS_OPTIONS)[number]
  expected_date: string | null
  completed_at: string | null
  visibility: 'internal' | 'client' | 'both'
  notes: string | null
  created_at: string
  updated_at: string
}

export const DEPENDENCY_STATUS_OPTIONS = ['Aberta', 'Aguardando', 'Bloqueadora', 'Resolvida'] as const

export interface Dependency {
  id: string
  project_id: string
  stage_id: string | null
  task_id: string | null
  description: string
  responsible: string | null
  request_date: string | null
  expected_date: string | null
  impact: string | null
  status: (typeof DEPENDENCY_STATUS_OPTIONS)[number]
  resolution: string | null
  resolution_date: string | null
  created_at: string
  updated_at: string
}

export const DELIVERABLE_STATUS_OPTIONS = [
  'Em produção',
  'Em revisão interna',
  'Aguardando aprovação',
  'Ajustes solicitados',
  'Aprovado',
  'Entregue',
] as const

export interface Deliverable {
  id: string
  project_id: string
  stage_id: string | null
  name: string
  description: string | null
  version: string | null
  due_date: string | null
  delivery_date: string | null
  status: (typeof DELIVERABLE_STATUS_OPTIONS)[number]
  link_or_file: string | null
  requires_approval: boolean
  visibility: 'internal' | 'client' | 'both'
  created_at: string
  updated_at: string
}

export interface Approval {
  id: string
  deliverable_id: string
  decided_at: string
  version: string | null
  decision: 'Aprovado' | 'Ajuste solicitado'
  comment: string | null
  created_at: string
}

export const SCOPE_DECISION_OPTIONS = ['Em análise', 'Aprovada', 'Recusada', 'Incorporada ao projeto'] as const

export interface ScopeChange {
  id: string
  project_id: string
  description: string
  requester: string | null
  request_date: string
  reason: string | null
  estimated_impact: string | null
  deadline_impact: string | null
  decision: (typeof SCOPE_DECISION_OPTIONS)[number]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProjectDecision {
  id: string
  project_id: string
  decision_date: string
  decision: string
  context: string | null
  impact: string | null
  created_at: string
}

export const RISK_PROBABILITY_OPTIONS = ['Baixa', 'Média', 'Alta'] as const
export const RISK_IMPACT_OPTIONS = ['Baixo', 'Médio', 'Alto'] as const

export interface ProjectRisk {
  id: string
  project_id: string
  risk: string
  description: string | null
  probability: (typeof RISK_PROBABILITY_OPTIONS)[number] | null
  impact: (typeof RISK_IMPACT_OPTIONS)[number] | null
  mitigation: string | null
  status: string | null
  created_at: string
  updated_at: string
}

export const FILE_CATEGORY_OPTIONS = [
  'Contratos',
  'Briefings',
  'Materiais recebidos',
  'Entregáveis',
  'Relatórios',
  'Referências',
  'Documentos finais',
  'Outros',
] as const

export interface ProjectFile {
  id: string
  project_id: string
  name: string
  category: (typeof FILE_CATEGORY_OPTIONS)[number] | null
  file_or_url: string
  file_date: string
  visibility: 'internal' | 'client' | 'both'
  created_at: string
}

export interface ProjectLink {
  id: string
  project_id: string
  tool: string
  purpose: string | null
  url: string
  notes: string | null
  created_at: string
}

export interface ProjectHistoryEntry {
  id: string
  project_id: string
  event_type: string
  description: string | null
  visibility: 'internal' | 'client' | 'both'
  created_at: string
}
