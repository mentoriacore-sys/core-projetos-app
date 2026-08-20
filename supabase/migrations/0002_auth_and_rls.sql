-- C.O.R.E. Projetos — Autenticação e RLS (linha de base)
-- Fonte: docs/CORE_PROJETOS_SPEC_V1.md, seções 8-12.
--
-- Estratégia desta migration (Fase 1): habilitar RLS em TODAS as tabelas e
-- garantir que apenas o papel 'admin' tenha acesso, por padrão. As políticas
-- específicas de 'team' e 'client' (leitura restrita ao próprio
-- projeto/cliente) serão adicionadas em migrations seguintes, na Fase 2/6,
-- quando existir tela de login para testar de verdade o isolamento entre
-- clientes (seção 69 exige teste real de acesso cruzado antes de liberar).
-- Até lá, 'team' e 'client' não têm nenhum acesso — é o padrão mais seguro
-- possível (fail closed), nunca um vazamento acidental.

-- ---------------------------------------------------------------------------
-- Bootstrap de profiles: toda linha nova em auth.users vira uma linha em
-- profiles, com role padrão 'client'. Promoção para 'admin'/'team' é manual
-- (ver docs/RLS_POLICIES.md).
-- ---------------------------------------------------------------------------
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, name, email)
  values (new.id, 'client', new.raw_user_meta_data ->> 'name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_handle_new_auth_user
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Funções auxiliares de autorização
-- ---------------------------------------------------------------------------
create or replace function app_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function is_admin()
returns boolean as $$
  select app_user_role() = 'admin';
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- RLS: habilitar em todas as tabelas + política de acesso total para admin
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles', 'clients', 'client_users', 'projects', 'project_members',
      'project_stages', 'tasks', 'dependencies', 'deliverables', 'approvals',
      'scope_changes', 'project_files', 'project_links', 'project_decisions',
      'project_risks', 'project_history', 'project_reports', 'report_items',
      'notifications', 'support_tickets', 'support_ticket_messages',
      'support_ticket_attachments', 'support_ticket_history'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy admin_full_access on %I for all using (is_admin()) with check (is_admin())',
      t
    );
  end loop;
end $$;

-- Cada usuário sempre pode ver e atualizar o próprio perfil (nome, e-mail).
create policy self_read_profile on profiles
  for select using (id = auth.uid());

create policy self_update_profile on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Trava de segurança: mesmo com a policy acima, ninguém além de um admin
-- pode alterar o próprio "role" (impede auto-promoção a admin/team).
create or replace function prevent_role_escalation()
returns trigger as $$
begin
  if new.role <> old.role and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_prevent_role_escalation
  before update on profiles
  for each row execute function prevent_role_escalation();
