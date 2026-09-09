# C.O.R.E. Projetos

Aplicação web para gestão e acompanhamento dos projetos personalizados executados para clientes da Metodologia C.O.R.E.

Aplicação **independente** da Base C.O.R.E. — código, repositório, deploy e banco de dados próprios.

Especificação completa: [`docs/CORE_PROJETOS_SPEC_V1.md`](docs/CORE_PROJETOS_SPEC_V1.md)
Instruções permanentes de desenvolvimento: [`CLAUDE.md`](CLAUDE.md)

Status: Fase 0 a 5 concluídas (produto completo). Redesign visual em andamento — Fases A a G concluídas (design system, cabeçalho + resumo executivo, modelo de tarefa expandido, nova tabela de tarefas e painel de detalhes, Etapas e demais abas com badges semânticos, responsividade mobile, e o Portal do Cliente com políticas de RLS testadas e isolamento entre clientes comprovado). Falta: tela "Tarefas" geral + polimento final (Fase H).

## Rodando localmente

1. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → Data API no painel do Supabase).
2. Instale as dependências: `npm install`
3. Rode em desenvolvimento: `npm run dev`
4. Gere a versão de produção: `npm run build`

## Primeiro acesso (criar sua conta de administradora)

1. Com o app rodando, acesse a tela de login e clique em "Criar conta". Cadastre-se com seu e-mail e uma senha.
2. Se o Supabase pedir confirmação por e-mail, confirme pelo link recebido.
3. Rode `npm run promote-admin -- seu-email@exemplo.com` para virar administradora (toda conta nova nasce como `client`, sem acesso administrativo, por segurança).
4. Faça login novamente.

## Banco de dados

- `npm run migrate` — aplica migrations pendentes de `supabase/migrations/` (precisa de `DATABASE_URL` no `.env`, ver `.env.example`)
- `npm run verify:db` — lista tabelas e confirma se o RLS está habilitado
- `npm run promote-admin -- email@exemplo.com` — promove um usuário já cadastrado ao papel `admin`
- `npm run import-project -- payload.json [--dry-run]` — cadastra cliente + projeto + etapas + tarefas + entregáveis a partir de um JSON estruturado (ver `docs/PROCESSO_IMPORTACAO_PROJETO.md`)

## Deploy

Publicação em produção via Netlify (`netlify.toml` já configurado). O deploy será conectado ao repositório Git nas fases finais do projeto.
