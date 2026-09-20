# Decisões de negócio — C.O.R.E. Projetos

Registro de decisões que não estavam definidas em `CORE_PROJETOS_SPEC_V1.md` e foram esclarecidas diretamente com a Andréia durante a construção. Consultar antes de reintroduzir algo que já foi decidido.

## 2026-08-20 — Campo "Status" do Cliente removido

A spec (seção 13) listava `status` como campo do cadastro de cliente, mas não definia quais valores ele deveria ter.

**Decisão:** o campo foi removido do cadastro de cliente (tela, tipo TypeScript e coluna no banco — migration `0005_drop_client_status.sql`).

**Motivo (Andréia):** projetos só são cadastrados quando contratados, e cada projeto nasce de uma necessidade identificada durante a jornada de mentoria — portanto todo cliente com projeto é, por definição, um cliente ativo. Não existe um "status do cliente" independente do status dos projetos dele.

**Como aplicar:** o status que importa é sempre o `status` do **Projeto** (Planejamento, Não iniciado, Em andamento, etc. — spec seção 16), não algo no nível do Cliente. Se no futuro surgir necessidade de segmentar clientes (ex.: ex-cliente, lead), registrar nova decisão aqui antes de recriar o campo.

## 2026-08-20 — Cadastro de projeto a partir de documentos (Camada 1 de 3)

A Andréia trabalha com uma pasta por cliente/projeto contendo os documentos já negociados (Termo de Abertura, Proposta etc.) e queria automatizar o cadastro no C.O.R.E. Projetos a partir desses documentos, eventualmente disparado por um botão no Pipeline da Base C.O.R.E.

**Decisão:** implementar em 3 camadas, começando pela mais simples:

- **Camada 1 (implementada agora):** processo manual assistido. A Andréia pede no chat, no Claude Code, para cadastrar um projeto a partir de uma pasta; o Claude lê os documentos, apresenta um resumo para aprovação, e grava usando `scripts/import-project.mjs` (ver `docs/PROCESSO_IMPORTACAO_PROJETO.md`).
- **Camada 2 (futura, fora deste repositório):** um campo no Pipeline da Base C.O.R.E. guarda o link da pasta do cliente quando "Projetos" é marcado como produto contratado. Não depende de nenhuma automação nova, só um campo a mais no cadastro de lá.
- **Camada 3 (futura, opcional):** usar o Make.com (orquestrador de automações da Base C.O.R.E.) para notificar a Andréia automaticamente quando a Camada 2 acontecer, tornando o pedido da Camada 1 quase instantâneo.

**Por que não uma automação completa desde já:** o passo de "ler documentos não estruturados e extrair dados" é inerentemente um trabalho de interpretação (mesma natureza do que a spec exclui em "IA complexa" — seção 74). Como cada projeto é diferente, esse passo continua precisando de uma sessão do Claude Code ativa. O que ficou pronto é a parte que *pode* ser reaproveitada por uma automação futura: `scripts/import-project.mjs` grava um projeto completo (cliente, etapas, tarefas, entregáveis) a partir de um JSON estruturado — qualquer automação que produza esse mesmo formato pode chamá-lo, sem depender do Claude.

**Como aplicar:** ao receber um pedido de cadastro de projeto a partir de pasta, seguir `docs/PROCESSO_IMPORTACAO_PROJETO.md`. Nunca gravar sem antes mostrar o resumo extraído para aprovação da Andréia.

## 2026-09-20 — Pendência: telas "Configurações" e "Central de Ajuda" não construídas

Ao completar as telas do menu que ainda estavam "em breve" (Documentos, Relatórios e Central de Chamados), essas duas ficaram de fora.

**Motivo:** diferente das outras, `CORE_PROJETOS_SPEC_V1.md` não tem nenhuma seção definindo o que essas telas devem conter. Construí-las agora seria inventar escopo/regra de negócio (proibido pela regra 3 do `CLAUDE.md`). A única menção a "Configuração" no documento é como categoria de chamado (adendo, seção 7), não uma tela de configurações do sistema.

**O que existe hoje no lugar de "Configurações":** o SLA dos chamados (seção 18 do adendo, "deverá ficar configurável, não hardcode") já está numa tabela própria (`sla_config`) editável via SQL/painel do Supabase — só não tem tela dedicada no app ainda.

**Como aplicar:** antes de construir qualquer uma das duas, perguntar à Andréia o que ela espera ver ali (ex.: Configurações — dados da conta, preferências de notificação, gestão de usuários da equipe, o próprio SLA de chamados? Central de Ajuda — FAQ estático, documentação, contato?) e registrar a resposta aqui como nova decisão antes de implementar.

## 2026-09-20 — Botão "Abrir chamado" não é bloqueado pelo fim do acompanhamento

A spec (adendo, seção 32) manda desabilitar o botão "Abrir chamado" quando `support_ends_at` já passou. Foi implementado assim inicialmente (migration `0011_support_tickets.sql`).

**Decisão:** removido esse bloqueio — migration `0015_tickets_no_window_block.sql`. O botão "+ Abrir chamado" no Portal do Cliente agora fica sempre ativo, independente da data.

**Motivo (Andréia):** se algo surge bem no fim do período de acompanhamento e exige mais tempo de correção/implantação, bloquear o botão tira do cliente justamente a oportunidade de comunicar isso na hora que mais importa.

**Por que isso não abre brecha de segurança:** o corte de acesso de verdade continua existindo e é outro mecanismo — `client_users.access_status`. Quando a administradora desativa o acesso do cliente (seção 4 da spec), `my_client_ids()` fica vazia e **todas** as políticas de RLS do cliente deixam de retornar qualquer linha, incluindo a de abrir chamado. Ou seja: enquanto o acesso ao Portal estiver ativo, o cliente pode abrir chamado a qualquer momento; quando a administradora encerrar o acesso, ele perde tudo de uma vez (não só o botão).

**Como aplicar:** o bloco "Acompanhamento" no Portal (datas, avisos de 7/2 dias) continua sendo exibido normalmente, é só informativo — não afeta mais se o botão fica ativo ou não. Se precisar reintroduzir algum bloqueio por data no futuro, discutir com a Andréia antes.
