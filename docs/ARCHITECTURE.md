# Arquitetura — C.O.R.E. Projetos

Referência completa: `CORE_PROJETOS_SPEC_V1.md`, seções 2–7 e 56.

## Stack

- Frontend: React + TypeScript + Vite
- Backend/banco/auth/storage: Supabase (projeto próprio, independente da Base C.O.R.E.)
- Hospedagem: Netlify
- Segurança: Row Level Security (RLS) em todas as tabelas expostas ao frontend

## Princípio

Sistemas separados, ecossistema integrado — ver spec seção 2. Nenhum código, banco ou deploy é compartilhado com a Base C.O.R.E. Integração futura ocorrerá apenas por troca controlada de dados (spec seções 54–55).

## Estrutura de pastas

```
src/
  components/{common,dashboard,projects,clients,reports,portal}/
  pages/{admin,portal,auth}/
  services/{supabase,projects,reports}/
  hooks/
  lib/           (ex.: supabaseClient.ts)
  types/
  utils/
  contexts/
supabase/
  migrations/
  policies/
  seeds/
docs/
```

## Ambientes

- Desenvolvimento: execução local (`npm run dev`)
- Produção: Netlify, a partir do repositório Git
- Variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (nunca hardcoded — ver `.env.example`)
