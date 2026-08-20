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

## Status atual (após `0002_auth_and_rls.sql`)

- RLS **habilitado em todas as 23 tabelas**.
- Papel `admin` tem acesso total (`admin_full_access`), via função `is_admin()`.
- Papel `team` e `client` **não têm nenhuma política própria ainda** — ou seja, hoje têm acesso zero a qualquer tabela além da própria linha em `profiles`. É o padrão mais seguro possível (fail closed): nada vaza por falta de política, só falta liberar o que é permitido.
- Trigger `prevent_role_escalation` impede que um usuário altere o próprio `role` (mesmo tendo permissão de editar o próprio perfil).
- Todo novo usuário que se cadastra no Supabase Auth recebe automaticamente `role = 'client'` em `profiles` (trigger `handle_new_auth_user`). Promoção manual para `admin`/`team` é feita por SQL direto — ver "Promover o primeiro admin" abaixo.

## Por que as políticas de team/client ficaram para depois

A spec (seção 69) exige testar acesso cruzado real entre clientes antes de liberar qualquer coisa. Isso só é testável de verdade com uma tela de login funcionando — que é entregue na Fase 2. Escrever políticas de leitura para `client`/`team` agora, sem conseguir logar e testar, seria avançar de fase sem testar a anterior (proibido pelo CLAUDE.md deste projeto). Elas serão escritas e testadas junto da Fase 2 (administração) e Fase 6 (Portal do Cliente).

## Promover o primeiro admin

Depois que você criar sua conta (e-mail/senha) pela tela de login (Fase 2) ou diretamente pelo painel do Supabase (Authentication → Users → Add user), rode uma vez:

```sql
update profiles set role = 'admin' where email = 'seu-email@exemplo.com';
```

## Políticas versionadas

Ficam em `supabase/migrations/` (numeradas, junto do schema) — decidimos manter tudo em um único histórico de migrations em vez de duplicar em `supabase/policies/`, para não haver dúvida sobre a ordem de aplicação.

## Testes obrigatórios de isolamento

Ver `docs/TEST_PLAN.md` — testes derivados da spec seção 69 e adendo seção 34.
