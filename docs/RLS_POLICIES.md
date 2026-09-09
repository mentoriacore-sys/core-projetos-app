# Estratégia de RLS — C.O.R.E. Projetos

Referência: `CORE_PROJETOS_SPEC_V1.md` seção 12 (segurança crítica) e adendo seção 33 (segurança dos anexos).

## Requisito impeditivo

O isolamento entre clientes é requisito **impeditivo para publicação** (spec seção 12). Cliente A jamais pode acessar projeto, documentos, relatórios, comentários ou entregáveis do Cliente B — nem alterando a URL manualmente. Esconder elementos na interface não é suficiente: o isolamento deve ser garantido no banco via RLS.

## Princípios gerais das políticas (a detalhar na Fase 1)

- Toda tabela exposta ao frontend precisa de política RLS explícita — nenhuma tabela fica aberta por padrão.
- `client` só enxerga linhas vinculadas ao seu próprio `client_id` / `auth.uid()` via `client_users`.
- `team` só enxerga projetos aos quais foi explicitamente associado (`project_members`) — sem acesso automático a todos os projetos (spec seção 10).
- `admin` tem acesso irrestrito.
- Registros com `visibility = internal` nunca são retornados para o papel `client` (spec seção 35).
- Anexos de chamados (Storage) são privados; acesso apenas por URL assinada temporária e vinculado ao próprio `client_id`/`ticket_id` (adendo seção 33).
- Após o fim do período de acompanhamento (30 dias), acesso do cliente é limitado conforme `access_status`/`access_ends_at`, sem excluir dados (adendo seções 4–5).

## Status atual (após `0009_client_rls.sql`)

- RLS **habilitado em todas as 23 tabelas do modelo principal**.
- Papel `admin` tem acesso total (`admin_full_access`), via função `is_admin()`.
- Papel `client` tem políticas próprias completas (ver abaixo) — implementadas e testadas na Fase G do redesign.
- Papel `team` **ainda não tem nenhuma política própria** — acesso zero além da própria linha em `profiles`. Fail closed, como sempre: falta construir o fluxo de equipe (spec seção 10), não está no escopo atual.
- Trigger `prevent_role_escalation` impede que um usuário altere o próprio `role` (mesmo tendo permissão de editar o próprio perfil).
- Todo novo usuário que se cadastra no Supabase Auth recebe automaticamente `role = 'client'` em `profiles` (trigger `handle_new_auth_user`). Promoção manual para `admin`/`team` é feita por SQL direto — ver "Promover o primeiro admin" abaixo.

## Políticas do papel `client` (migration `0009_client_rls.sql`)

Funções auxiliares `SECURITY DEFINER` (mesmo padrão de `is_admin()`, evitam recursão de RLS entre tabelas):
- `my_client_ids()` — client_id(s) do usuário atual, via `client_users` com `access_status = 'Ativo'`.
- `is_my_project(project_id)` — o projeto pertence a um dos meus client_ids?
- `visible_profile_ids_for_client()` — admins + colegas do mesmo `client_users`.

Cliente pode **ler**: o próprio `clients`/`client_users`, `projects`, `project_stages`/`tasks` (só `visibility` `client`/`both`, nunca `internal`), `deliverables`, `approvals`, `task_comments` (idem), `task_attachments`, `project_files`, `project_history`, e perfis de admins/colegas.

Cliente pode **escrever**: `approvals` (aprovar/solicitar ajuste — spec seção 11), `task_comments` (sempre com `author_id = auth.uid()` e `visibility` ≠ `internal`), `task_attachments` + upload no Storage (`uploaded_by = auth.uid()`).

Cliente **nunca pode**: alterar projeto/etapa/tarefa/entregável em si, ver dependências/riscos/decisões/alteração de escopo (fora da lista de permissões da spec seção 11), nem qualquer dado de outro `client_id`.

**Como vincular um cliente de verdade ao Portal:** a pessoa precisa criar a própria conta pela tela de login primeiro; depois, na tela de edição do cliente (admin), usar "Usuários com acesso ao Portal" para vincular pelo e-mail.

**Pendência conhecida:** a regra de 30 dias de acompanhamento pós-entrega (adendo seções 1–5, campos `support_ends_at`/`access_ends_at`) ainda não é aplicada nas políticas — hoje o acesso do cliente não expira automaticamente. Isso pertence ao módulo de Chamados (fora do escopo desta fase).

## Promover o primeiro admin

Depois que você criar sua conta (e-mail/senha) pela tela de login (Fase 2) ou diretamente pelo painel do Supabase (Authentication → Users → Add user), rode uma vez:

```sql
update profiles set role = 'admin' where email = 'seu-email@exemplo.com';
```

## Políticas versionadas

Ficam em `supabase/migrations/` (numeradas, junto do schema) — decidimos manter tudo em um único histórico de migrations em vez de duplicar em `supabase/policies/`, para não haver dúvida sobre a ordem de aplicação.

## Testes obrigatórios de isolamento

Ver `docs/TEST_PLAN.md` — testes derivados da spec seção 69 e adendo seção 34.
