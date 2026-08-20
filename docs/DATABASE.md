# Banco de dados — C.O.R.E. Projetos

Referência completa: `CORE_PROJETOS_SPEC_V1.md`, seções 51–52 (modelo principal) e adendo seção 35 (módulo de chamados).

**Status: aplicado.** As 22 tabelas da spec (mais `report_items` e o módulo de chamados) foram criadas no projeto Supabase via `supabase/migrations/0001_schema.sql`. Rodar `npm run migrate` aplica migrations pendentes; `npm run verify:db` lista tabelas e confirma RLS.

## Tabelas principais (spec seção 51)

`profiles`, `clients`, `client_users`, `projects`, `project_members`, `project_stages`, `tasks`, `dependencies`, `deliverables`, `approvals`, `scope_changes`, `project_files`, `project_links`, `project_decisions`, `project_risks`, `project_history`, `project_reports`, `report_items`, `notifications`

## Módulo de acompanhamento pós-projeto e chamados (adendo seção 35)

`support_tickets`, `support_ticket_messages`, `support_ticket_attachments`, `support_ticket_history`

Campos adicionais em `projects`: `execution_completed_at`, `support_started_at`, `support_ends_at`, `support_status`

Campos adicionais em `client_users` (ou estrutura equivalente): `access_status`, `access_ends_at`

## Relacionamentos (spec seção 52)

Client → muitos Projects e muitos Users · Project → muitas Stages, Dependencies, Risks, Decisions, Files, Reports · Stage → muitas Tasks · Deliverable → muitas Versions/Approvals

## Migrations

Versionadas em `supabase/migrations/`:

- `0001_schema.sql` — tabelas, constraints, índices, códigos amigáveis (CLI-/PRJ-/CHM-)
- `0002_auth_and_rls.sql` — bootstrap de `profiles`, funções de autorização, RLS habilitado em todas as tabelas

Pendente para a Fase 2/6 (quando existir login para testar de verdade): políticas RLS específicas de `team` e `client` — ver `docs/RLS_POLICIES.md`.
