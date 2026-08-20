-- C.O.R.E. Projetos — Schema inicial
-- Fonte: docs/CORE_PROJETOS_SPEC_V1.md, seções 8, 13-20, 25-35, 51-52 e adendo 6-13, 35.
-- Convenção: colunas técnicas em inglês; valores de status/enum ficam em português,
-- exatamente como nomeados na especificação (vocabulário de negócio).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Função utilitária: mantém updated_at atualizado
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Função utilitária: gera códigos amigáveis (CLI-0001, PRJ-0001, CHM-0001...)
create or replace function generate_friendly_code()
returns trigger as $$
declare
  prefix text := TG_ARGV[0];
  seq_name text := TG_ARGV[1];
  next_val bigint;
begin
  if new.code is null then
    execute format('select nextval(%L)', seq_name) into next_val;
    new.code := prefix || '-' || lpad(next_val::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- 1. PROFILES — seção 8 (admin / team / client)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'team', 'client')),
  name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. CLIENTS — seção 13-14
-- ---------------------------------------------------------------------------
create sequence clients_code_seq;

create table clients (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  company text,
  email text,
  phone text,
  segment text,
  origin text check (
    origin in ('Mentoria', 'Origem Estratégica', 'Fluxo Estruturado', 'Projeto Avulso', 'Indicação', 'Outro')
  ),
  internal_note text,
  status text,
  base_core_client_id text, -- seção 55: identificador de integração futura com a Base C.O.R.E.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_clients_code
  before insert on clients
  for each row execute function generate_friendly_code('CLI', 'clients_code_seq');

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. CLIENT_USERS — seção 41 (múltiplos usuários por cliente) + adendo 4 (acesso)
-- ---------------------------------------------------------------------------
create table client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  label text, -- ex.: "principal", "financeiro", "operacional" (seção 41, exemplo — não é lista fechada)
  access_status text not null default 'Ativo' check (access_status in ('Ativo', 'Acesso encerrado', 'Bloqueado')),
  access_ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 4. PROJECTS — seção 15-18 + adendo 1-2 (acompanhamento pós-projeto)
-- ---------------------------------------------------------------------------
create sequence projects_code_seq;

create table projects (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  client_id uuid not null references clients (id) on delete restrict,
  name text not null,
  description text,
  context text,
  problem_identified text,
  objective text,
  expected_result text,
  scope_included text,
  scope_excluded text,
  assumptions text,
  main_responsible uuid references profiles (id),
  start_date date,
  expected_end_date date,
  actual_end_date date,
  status text not null default 'Planejamento' check (status in (
    'Planejamento', 'Não iniciado', 'Em andamento', 'Aguardando cliente', 'Aguardando terceiro',
    'Em revisão', 'Em atenção', 'Bloqueado', 'Pausado', 'Concluído', 'Cancelado',
    'Em acompanhamento', 'Acompanhamento encerrado'
  )),
  health text check (health in ('Verde', 'Amarelo', 'Vermelho')),
  priority text,
  progress numeric(5,2) not null default 0, -- seção 21: calculado, não digitado manualmente
  current_responsibility text check (current_responsibility in ('C.O.R.E.', 'Cliente', 'Terceiro', 'Equipe', 'Nenhuma')),
  -- Adendo seção 1 e 35: ciclo pós-entrega
  execution_completed_at date,
  support_started_at date,
  support_ends_at date,
  support_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_projects_code
  before insert on projects
  for each row execute function generate_friendly_code('PRJ', 'projects_code_seq');

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

create index idx_projects_client_id on projects (client_id);

-- ---------------------------------------------------------------------------
-- 5. PROJECT_MEMBERS — seção 10 (equipe só acessa projetos autorizados)
-- ---------------------------------------------------------------------------
create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 6. PROJECT_STAGES — seção 19
-- ---------------------------------------------------------------------------
create table project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  description text,
  objective text,
  stage_order integer not null default 0,
  responsible uuid references profiles (id),
  expected_start date,
  expected_end date,
  actual_start date,
  actual_end date,
  status text not null default 'Não iniciada' check (status in (
    'Não iniciada', 'Em andamento', 'Aguardando', 'Em revisão', 'Concluída', 'Cancelada'
  )),
  progress numeric(5,2) not null default 0,
  visibility text not null default 'both' check (visibility in ('internal', 'client', 'both')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_project_stages_updated_at
  before update on project_stages
  for each row execute function set_updated_at();

create index idx_project_stages_project_id on project_stages (project_id);

-- ---------------------------------------------------------------------------
-- 7. TASKS — seção 20
-- ---------------------------------------------------------------------------
create table tasks (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references project_stages (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  description text,
  responsible uuid references profiles (id),
  priority text,
  status text not null default 'Não iniciada' check (status in (
    'Não iniciada', 'Em andamento', 'Aguardando', 'Em revisão', 'Concluída', 'Cancelada'
  )),
  expected_date date,
  completed_at timestamptz,
  visibility text not null default 'both' check (visibility in ('internal', 'client', 'both')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create index idx_tasks_stage_id on tasks (stage_id);
create index idx_tasks_project_id on tasks (project_id);

-- ---------------------------------------------------------------------------
-- 8. DEPENDENCIES — seção 24-25
-- ---------------------------------------------------------------------------
create table dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  stage_id uuid references project_stages (id) on delete set null,
  task_id uuid references tasks (id) on delete set null,
  description text not null,
  responsible text, -- quem a metodologia está aguardando (cliente/terceiro) — texto livre, seção 24-25
  request_date date,
  expected_date date,
  impact text,
  status text not null default 'Aberta' check (status in ('Aberta', 'Aguardando', 'Bloqueadora', 'Resolvida')),
  resolution text,
  resolution_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_dependencies_updated_at
  before update on dependencies
  for each row execute function set_updated_at();

create index idx_dependencies_project_id on dependencies (project_id);

-- ---------------------------------------------------------------------------
-- 9. DELIVERABLES — seção 27
-- ---------------------------------------------------------------------------
create table deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  stage_id uuid references project_stages (id) on delete set null,
  name text not null,
  description text,
  version text,
  responsible uuid references profiles (id),
  due_date date,
  delivery_date date,
  status text not null default 'Em produção' check (status in (
    'Em produção', 'Em revisão interna', 'Aguardando aprovação', 'Ajustes solicitados', 'Aprovado', 'Entregue'
  )),
  link_or_file text,
  requires_approval boolean not null default true,
  visibility text not null default 'both' check (visibility in ('internal', 'client', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_deliverables_updated_at
  before update on deliverables
  for each row execute function set_updated_at();

create index idx_deliverables_project_id on deliverables (project_id);

-- ---------------------------------------------------------------------------
-- 10. APPROVALS — seção 28-29 (novo ciclo/versão a cada reabertura, nunca apaga o anterior)
-- ---------------------------------------------------------------------------
create table approvals (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables (id) on delete cascade,
  user_id uuid references profiles (id),
  decided_at timestamptz not null default now(),
  version text,
  decision text not null check (decision in ('Aprovado', 'Ajuste solicitado')),
  comment text, -- seção 28: obrigatório quando decision = 'Ajuste solicitado' (aplicar na camada de aplicação)
  created_at timestamptz not null default now()
);

create index idx_approvals_deliverable_id on approvals (deliverable_id);

-- ---------------------------------------------------------------------------
-- 11. SCOPE_CHANGES — seção 26
-- ---------------------------------------------------------------------------
create table scope_changes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  description text not null,
  requester uuid references profiles (id),
  request_date date not null default current_date,
  reason text,
  estimated_impact text,
  deadline_impact text,
  decision text not null default 'Em análise' check (decision in (
    'Em análise', 'Aprovada', 'Recusada', 'Incorporada ao projeto'
  )),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_scope_changes_updated_at
  before update on scope_changes
  for each row execute function set_updated_at();

create index idx_scope_changes_project_id on scope_changes (project_id);

-- ---------------------------------------------------------------------------
-- 12. PROJECT_FILES / DOCUMENTOS — seção 30
-- ---------------------------------------------------------------------------
create table project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  stage_id uuid references project_stages (id) on delete set null,
  name text not null,
  category text check (category in (
    'Contratos', 'Briefings', 'Materiais recebidos', 'Entregáveis', 'Relatórios',
    'Referências', 'Documentos finais', 'Outros'
  )),
  file_or_url text not null,
  responsible uuid references profiles (id),
  file_date date not null default current_date,
  visibility text not null default 'both' check (visibility in ('internal', 'client', 'both')),
  created_at timestamptz not null default now()
);

create index idx_project_files_project_id on project_files (project_id);

-- ---------------------------------------------------------------------------
-- 13. PROJECT_LINKS — seção 31 (nunca senha/token em texto comum)
-- ---------------------------------------------------------------------------
create table project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  tool text not null,
  purpose text,
  url text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_project_links_project_id on project_links (project_id);

-- ---------------------------------------------------------------------------
-- 14. PROJECT_DECISIONS — seção 32
-- ---------------------------------------------------------------------------
create table project_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  decision_date date not null default current_date,
  decision text not null,
  context text,
  responsible uuid references profiles (id),
  impact text,
  stage_id uuid references project_stages (id) on delete set null,
  registered_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_project_decisions_project_id on project_decisions (project_id);

-- ---------------------------------------------------------------------------
-- 15. PROJECT_RISKS — seção 33
-- ---------------------------------------------------------------------------
create table project_risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  risk text not null,
  description text,
  probability text check (probability in ('Baixa', 'Média', 'Alta')),
  impact text check (impact in ('Baixo', 'Médio', 'Alto')),
  mitigation text,
  responsible uuid references profiles (id),
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_project_risks_updated_at
  before update on project_risks
  for each row execute function set_updated_at();

create index idx_project_risks_project_id on project_risks (project_id);

-- ---------------------------------------------------------------------------
-- 16. PROJECT_HISTORY — seção 34 (timeline automática)
-- ---------------------------------------------------------------------------
create table project_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  event_type text not null,
  description text,
  actor uuid references profiles (id),
  visibility text not null default 'both' check (visibility in ('internal', 'client', 'both')),
  created_at timestamptz not null default now()
);

create index idx_project_history_project_id on project_history (project_id);

-- ---------------------------------------------------------------------------
-- 17. PROJECT_REPORTS + REPORT_ITEMS — seção 42-44
-- ---------------------------------------------------------------------------
create table project_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  period_start date,
  period_end date,
  status text not null default 'Rascunho' check (status in ('Rascunho', 'Publicado')),
  executive_summary text,
  content jsonb, -- snapshot congelado no momento da publicação (seção 44)
  version integer not null default 1,
  published_at timestamptz,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_project_reports_project_id on project_reports (project_id);

create table report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references project_reports (id) on delete cascade,
  item_type text not null, -- ex.: 'concluido_no_periodo', 'proxima_entrega', 'risco', 'decisao'
  description text not null,
  created_at timestamptz not null default now()
);

create index idx_report_items_report_id on report_items (report_id);

-- ---------------------------------------------------------------------------
-- 18. NOTIFICATIONS — seção 46
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  related_project_id uuid references projects (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_id on notifications (user_id);

-- ---------------------------------------------------------------------------
-- 19. SUPPORT_TICKETS — Adendo seção 7-10, 15
-- ---------------------------------------------------------------------------
create sequence support_tickets_code_seq;

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text unique,
  project_id uuid not null references projects (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  opened_by uuid references profiles (id),
  category text check (category in (
    'Funcionalidade', 'Automação', 'Integração', 'Acesso', 'Documento',
    'Processo', 'Configuração', 'Entregável', 'Outro'
  )),
  title text not null,
  description text not null,
  reported_impact text check (reported_impact in ('Baixo', 'Médio', 'Alto', 'Bloqueia minha operação')),
  priority text check (priority in ('P1', 'P2', 'P3', 'P4')),
  status text not null default 'Aberto' check (status in (
    'Aberto', 'Em análise', 'Em atendimento', 'Aguardando cliente', 'Resolvido', 'Encerrado', 'Cancelado'
  )),
  opened_at timestamptz not null default now(),
  first_response_at timestamptz,
  due_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  assigned_to uuid references profiles (id),
  resolution_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_support_tickets_code
  before insert on support_tickets
  for each row execute function generate_friendly_code('CHM', 'support_tickets_code_seq');

create trigger trg_support_tickets_updated_at
  before update on support_tickets
  for each row execute function set_updated_at();

create index idx_support_tickets_project_id on support_tickets (project_id);
create index idx_support_tickets_client_id on support_tickets (client_id);

-- ---------------------------------------------------------------------------
-- 20. SUPPORT_TICKET_MESSAGES — Adendo seção 11
-- ---------------------------------------------------------------------------
create table support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets (id) on delete cascade,
  author_id uuid references profiles (id),
  message text not null,
  visibility text not null default 'cliente' check (visibility in ('cliente', 'interno')),
  created_at timestamptz not null default now()
);

create index idx_support_ticket_messages_ticket_id on support_ticket_messages (ticket_id);

-- ---------------------------------------------------------------------------
-- 21. SUPPORT_TICKET_ATTACHMENTS — Adendo seção 8, 12
-- ---------------------------------------------------------------------------
create table support_ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets (id) on delete cascade,
  message_id uuid references support_ticket_messages (id) on delete cascade,
  uploaded_by uuid references profiles (id),
  storage_path text not null,
  file_name text not null,
  mime_type text not null check (mime_type in (
    'image/png', 'image/jpeg', 'image/webp', 'application/pdf'
  )),
  file_size bigint not null check (file_size > 0 and file_size <= 6291456), -- 6 MB, seção 8
  created_at timestamptz not null default now()
);

create index idx_support_ticket_attachments_ticket_id on support_ticket_attachments (ticket_id);

-- ---------------------------------------------------------------------------
-- 22. SUPPORT_TICKET_HISTORY — Adendo seção 26
-- ---------------------------------------------------------------------------
create table support_ticket_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets (id) on delete cascade,
  event_type text not null,
  description text,
  actor uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_support_ticket_history_ticket_id on support_ticket_history (ticket_id);
