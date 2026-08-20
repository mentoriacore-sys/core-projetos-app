// Cadastra um projeto completo (cliente + projeto + etapas + tarefas + entregáveis)
// a partir de um payload JSON estruturado. Ver docs/PROCESSO_IMPORTACAO_PROJETO.md
// para o processo completo (extração dos documentos, mapeamento, aprovação).
//
// Uso: node --env-file=.env scripts/import-project.mjs caminho/para/payload.json
// Adicione --dry-run para só validar e mostrar o que seria criado, sem gravar.
//
// Formato esperado do JSON:
// {
//   "client": { "id": "uuid-existente" }              // OU
//   "client": { "name": "...", "company": "...", "email": "...", "phone": "...",
//               "segment": "...", "origin": "...", "internal_note": "...",
//               "base_core_client_id": null },
//   "project": { "name": "...", "description": "...", "context": "...",
//                "problem_identified": "...", "objective": "...",
//                "expected_result": "...", "scope_included": "...",
//                "scope_excluded": "...", "assumptions": "...",
//                "start_date": "YYYY-MM-DD", "expected_end_date": "YYYY-MM-DD",
//                "status": "Planejamento", "priority": null,
//                "current_responsibility": "C.O.R.E." },
//   "stages": [
//     { "name": "...", "description": "...", "objective": "...", "stage_order": 1,
//       "expected_start": "YYYY-MM-DD", "expected_end": "YYYY-MM-DD",
//       "tasks": [ { "title": "...", "description": "...", "expected_date": "YYYY-MM-DD",
//                    "responsible": "C.O.R.E." | "Cliente" | "Terceiro" | "Equipe" | "Nenhuma" | null,
//                    "status": "Não iniciada" (padrão) | "Concluída" | ...,
//                    "completed_at": "YYYY-MM-DDTHH:MM:SSZ" } ],
//       "deliverables": [ { "name": "...", "description": "...", "due_date": "YYYY-MM-DD",
//                            "requires_approval": true } ]
//     }
//   ]
// }

import { readFile } from 'node:fs/promises'
import pg from 'pg'

const { Client } = pg

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const filePath = args.find((a) => !a.startsWith('--'))

  if (!filePath) {
    console.error('Uso: node --env-file=.env scripts/import-project.mjs caminho/para/payload.json [--dry-run]')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não definida.')
    process.exit(1)
  }

  const raw = await readFile(filePath, 'utf8')
  const payload = JSON.parse(raw)

  if (!payload.project?.name) {
    console.error('payload.project.name é obrigatório.')
    process.exit(1)
  }
  if (!payload.client?.id && !payload.client?.name) {
    console.error('payload.client precisa ter "id" (cliente existente) ou "name" (novo cliente).')
    process.exit(1)
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    await client.query('begin')

    let clientId = payload.client.id
    let clientCode = null

    if (!clientId) {
      const c = payload.client
      const res = await client.query(
        `insert into clients (name, company, email, phone, segment, origin, internal_note, base_core_client_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8) returning id, code`,
        [c.name, c.company ?? null, c.email ?? null, c.phone ?? null, c.segment ?? null, c.origin ?? null, c.internal_note ?? null, c.base_core_client_id ?? null],
      )
      clientId = res.rows[0].id
      clientCode = res.rows[0].code
    } else {
      const res = await client.query('select code from clients where id = $1', [clientId])
      if (res.rows.length === 0) throw new Error(`Cliente com id ${clientId} não encontrado.`)
      clientCode = res.rows[0].code
    }

    const p = payload.project
    const projRes = await client.query(
      `insert into projects (
         client_id, name, description, context, problem_identified, objective, expected_result,
         scope_included, scope_excluded, assumptions, start_date, expected_end_date,
         status, priority, current_responsibility
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       returning id, code`,
      [
        clientId, p.name, p.description ?? null, p.context ?? null, p.problem_identified ?? null,
        p.objective ?? null, p.expected_result ?? null, p.scope_included ?? null, p.scope_excluded ?? null,
        p.assumptions ?? null, p.start_date ?? null, p.expected_end_date ?? null,
        p.status ?? 'Planejamento', p.priority ?? null, p.current_responsibility ?? null,
      ],
    )
    const projectId = projRes.rows[0].id
    const projectCode = projRes.rows[0].code

    const summary = { clientId, clientCode, projectId, projectCode, stages: [] }

    for (const [i, stage] of (payload.stages ?? []).entries()) {
      const stageRes = await client.query(
        `insert into project_stages (project_id, name, description, objective, stage_order, expected_start, expected_end)
         values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [projectId, stage.name, stage.description ?? null, stage.objective ?? null, stage.stage_order ?? i, stage.expected_start ?? null, stage.expected_end ?? null],
      )
      const stageId = stageRes.rows[0].id
      const stageSummary = { name: stage.name, id: stageId, tasks: [], deliverables: [] }

      for (const task of stage.tasks ?? []) {
        const taskRes = await client.query(
          `insert into tasks (stage_id, project_id, title, description, expected_date, responsible, status, completed_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
          [
            stageId, projectId, task.title, task.description ?? null, task.expected_date ?? null,
            task.responsible ?? null, task.status ?? 'Não iniciada', task.completed_at ?? null,
          ],
        )
        stageSummary.tasks.push({ id: taskRes.rows[0].id, title: task.title })
      }

      for (const deliverable of stage.deliverables ?? []) {
        const delRes = await client.query(
          `insert into deliverables (project_id, stage_id, name, description, due_date, requires_approval)
           values ($1,$2,$3,$4,$5,$6) returning id`,
          [projectId, stageId, deliverable.name, deliverable.description ?? null, deliverable.due_date ?? null, deliverable.requires_approval ?? true],
        )
        stageSummary.deliverables.push({ id: delRes.rows[0].id, name: deliverable.name })
      }

      summary.stages.push(stageSummary)
    }

    if (dryRun) {
      await client.query('rollback')
      console.log('--dry-run: nada foi gravado. Resumo do que seria criado:')
    } else {
      await client.query('commit')
      console.log('Gravado com sucesso:')
    }

    console.log(JSON.stringify(summary, null, 2))
  } catch (err) {
    await client.query('rollback')
    console.error('Falhou, nada foi gravado:', err.message)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
