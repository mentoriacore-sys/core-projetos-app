import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

const { rows: tables } = await client.query(`
  select relname as table_name, relrowsecurity as rls_enabled
  from pg_class
  join pg_namespace on pg_namespace.oid = pg_class.relnamespace
  where pg_namespace.nspname = 'public' and relkind = 'r'
  order by relname
`)
console.log(`Tabelas criadas: ${tables.length}`)
for (const t of tables) {
  console.log(`  ${t.rls_enabled ? '[RLS ON] ' : '[RLS OFF]'} ${t.table_name}`)
}

const { rows: policies } = await client.query(`
  select count(*)::int as n from pg_policies where schemaname = 'public'
`)
console.log(`Total de policies: ${policies[0].n}`)

await client.end()
