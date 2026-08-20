// Promove um usuário já cadastrado (via tela de login) ao papel 'admin'.
// Uso: node --env-file=.env scripts/promote-admin.mjs email@exemplo.com
import pg from 'pg'
const { Client } = pg

const email = process.argv[2]
if (!email) {
  console.error('Uso: node --env-file=.env scripts/promote-admin.mjs email@exemplo.com')
  process.exit(1)
}

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
await client.connect()

const { rows } = await client.query(
  `update public.profiles set role = 'admin' where email = $1 returning id, name, email`,
  [email],
)

if (rows.length === 0) {
  console.error(`Nenhum usuário encontrado com o e-mail ${email}. Ele precisa se cadastrar primeiro pela tela de login.`)
} else {
  console.log('Promovido a admin:', rows[0])
}

await client.end()
