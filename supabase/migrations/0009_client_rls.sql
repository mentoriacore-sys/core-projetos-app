-- C.O.R.E. Projetos — Fase G: políticas de RLS para o papel 'client'
-- Fonte: docs/CORE_PROJETOS_SPEC_V1.md, seções 11-12 (permissões e isolamento
-- crítico), 35 (visibilidade), adendo (chamados, fora do escopo desta migration).
--
-- Princípio inegociável (seção 12): isolamento entre clientes ocorre no BANCO,
-- nunca só escondendo elementos da interface. Cliente A jamais pode acessar
-- dados do Cliente B, nem alterando a URL manualmente.
--
-- Estratégia: funções SECURITY DEFINER centralizam "quais client_id são meus"
-- e "este projeto é meu", evitando qualquer dependência circular de RLS entre
-- tabelas (mesmo padrão já usado em is_admin()).

create or replace function my_client_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select client_id from client_users
  where user_id = auth.uid() and access_status = 'Ativo';
$$;

create or replace function is_my_project(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from projects
    where id = p_project_id and client_id in (select my_client_ids())
  );
$$;

create or replace function visible_profile_ids_for_client()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select id from profiles where role = 'admin'
  union
  select user_id from client_users where client_id in (select my_client_ids());
$$;

-- ---------------------------------------------------------------------------
-- profiles: cliente enxerga admins (equipe C.O.R.E.) e colegas do mesmo
-- client_users, além do próprio perfil (política já existente).
-- ---------------------------------------------------------------------------
create policy client_read_related_profiles on profiles
  for select using (id in (select visible_profile_ids_for_client()));

-- ---------------------------------------------------------------------------
-- clients / client_users: cliente vê apenas o(s) próprio(s) registro(s).
-- ---------------------------------------------------------------------------
create policy client_read_own_client on clients
  for select using (id in (select my_client_ids()));

create policy client_read_own_client_users on client_users
  for select using (client_id in (select my_client_ids()));

-- ---------------------------------------------------------------------------
-- projects: cliente vê apenas projetos do próprio client_id. Somente leitura
-- — cliente não pode alterar status/prazo/escopo (seção 11).
-- ---------------------------------------------------------------------------
create policy client_read_own_projects on projects
  for select using (client_id in (select my_client_ids()));

-- ---------------------------------------------------------------------------
-- project_stages / tasks: somente o que estiver marcado como 'client' ou
-- 'both' — nunca 'internal' (seção 35).
-- ---------------------------------------------------------------------------
create policy client_read_own_stages on project_stages
  for select using (visibility in ('client', 'both') and is_my_project(project_id));

create policy client_read_own_tasks on tasks
  for select using (visibility in ('client', 'both') and is_my_project(project_id));

-- ---------------------------------------------------------------------------
-- deliverables + approvals: cliente vê entregáveis liberados e pode
-- aprovar/solicitar ajuste (seção 11: "aprovar entregáveis", "solicitar
-- ajustes") — nunca alterar o entregável em si.
-- ---------------------------------------------------------------------------
create policy client_read_own_deliverables on deliverables
  for select using (visibility in ('client', 'both') and is_my_project(project_id));

create policy client_read_approvals on approvals
  for select using (
    exists (
      select 1 from deliverables d
      where d.id = approvals.deliverable_id
        and d.visibility in ('client', 'both')
        and is_my_project(d.project_id)
    )
  );

create policy client_insert_approvals on approvals
  for insert with check (
    exists (
      select 1 from deliverables d
      where d.id = approvals.deliverable_id
        and d.visibility in ('client', 'both')
        and is_my_project(d.project_id)
    )
  );

-- ---------------------------------------------------------------------------
-- task_comments: cliente vê e escreve comentários visíveis a ele, nunca
-- 'internal'. author_id sempre precisa ser o próprio usuário.
-- ---------------------------------------------------------------------------
create policy client_read_task_comments on task_comments
  for select using (
    visibility in ('client', 'both')
    and exists (
      select 1 from tasks t
      where t.id = task_comments.task_id
        and t.visibility in ('client', 'both')
        and is_my_project(t.project_id)
    )
  );

create policy client_insert_task_comments on task_comments
  for insert with check (
    author_id = auth.uid()
    and visibility in ('client', 'both')
    and exists (
      select 1 from tasks t
      where t.id = task_comments.task_id
        and t.visibility in ('client', 'both')
        and is_my_project(t.project_id)
    )
  );

-- ---------------------------------------------------------------------------
-- task_attachments: cliente pode enviar e ver os próprios anexos (seção 11:
-- "enviar arquivos"). Nunca atualizar/excluir anexo de outra pessoa.
-- ---------------------------------------------------------------------------
create policy client_read_task_attachments on task_attachments
  for select using (
    exists (
      select 1 from tasks t
      where t.id = task_attachments.task_id
        and t.visibility in ('client', 'both')
        and is_my_project(t.project_id)
    )
  );

create policy client_insert_task_attachments on task_attachments
  for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from tasks t
      where t.id = task_attachments.task_id
        and t.visibility in ('client', 'both')
        and is_my_project(t.project_id)
    )
  );

-- ---------------------------------------------------------------------------
-- project_files (Documentos) e project_history (Histórico): somente leitura,
-- respeitando visibilidade.
-- ---------------------------------------------------------------------------
create policy client_read_project_files on project_files
  for select using (visibility in ('client', 'both') and is_my_project(project_id));

create policy client_read_project_history on project_history
  for select using (visibility in ('client', 'both') and is_my_project(project_id));

-- ---------------------------------------------------------------------------
-- Storage: anexos de tarefa. Cliente só acessa arquivos de tarefas do
-- próprio projeto (caminho no storage começa com o task_id).
-- ---------------------------------------------------------------------------
create policy client_read_task_attachment_files on storage.objects
  for select using (
    bucket_id = 'task-attachments'
    and exists (
      select 1 from tasks t
      where t.id::text = split_part(storage.objects.name, '/', 1)
        and t.visibility in ('client', 'both')
        and is_my_project(t.project_id)
    )
  );

create policy client_upload_task_attachment_files on storage.objects
  for insert with check (
    bucket_id = 'task-attachments'
    and exists (
      select 1 from tasks t
      where t.id::text = split_part(storage.objects.name, '/', 1)
        and t.visibility in ('client', 'both')
        and is_my_project(t.project_id)
    )
  );
