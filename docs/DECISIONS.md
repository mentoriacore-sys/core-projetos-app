# Decisões de negócio — C.O.R.E. Projetos

Registro de decisões que não estavam definidas em `CORE_PROJETOS_SPEC_V1.md` e foram esclarecidas diretamente com a Andréia durante a construção. Consultar antes de reintroduzir algo que já foi decidido.

## 2026-08-20 — Campo "Status" do Cliente removido

A spec (seção 13) listava `status` como campo do cadastro de cliente, mas não definia quais valores ele deveria ter.

**Decisão:** o campo foi removido do cadastro de cliente (tela, tipo TypeScript e coluna no banco — migration `0005_drop_client_status.sql`).

**Motivo (Andréia):** projetos só são cadastrados quando contratados, e cada projeto nasce de uma necessidade identificada durante a jornada de mentoria — portanto todo cliente com projeto é, por definição, um cliente ativo. Não existe um "status do cliente" independente do status dos projetos dele.

**Como aplicar:** o status que importa é sempre o `status` do **Projeto** (Planejamento, Não iniciado, Em andamento, etc. — spec seção 16), não algo no nível do Cliente. Se no futuro surgir necessidade de segmentar clientes (ex.: ex-cliente, lead), registrar nova decisão aqui antes de recriar o campo.
