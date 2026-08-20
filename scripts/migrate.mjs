import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'

const { Client } = pg

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../supabase/migrations',
)

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não definida. Rode com: npm run migrate')
    process.exit(1)
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  await client.query(`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `)

  const { rows: applied } = await client.query('select name from _migrations')
  const appliedNames = new Set(applied.map((r) => r.name))

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort()

  let ranAny = false
  for (const file of files) {
    if (appliedNames.has(file)) continue
    ranAny = true
    const sql = await readFile(path.join(migrationsDir, file), 'utf8')
    console.log(`Aplicando ${file}...`)
    try {
      await client.query('begin')
      await client.query(sql)
      await client.query('insert into _migrations (name) values ($1)', [file])
      await client.query('commit')
      console.log(`OK: ${file}`)
    } catch (err) {
      await client.query('rollback')
      console.error(`FALHOU: ${file}`)
      console.error(err.message)
      await client.end()
      process.exit(1)
    }
  }

  if (!ranAny) {
    console.log('Nenhuma migration pendente.')
  }

  await client.end()
}

main()
