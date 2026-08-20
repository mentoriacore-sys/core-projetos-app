import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listClients } from '../../../services/supabase/clients'
import type { Client } from '../../../types/database'
import '../../../components/common/admin-ui.css'

export default function ClientsList() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    listClients(search)
      .then((data) => {
        if (active) setClients(data)
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [search])

  return (
    <div>
      <div className="page-header">
        <h1>Clientes</h1>
        <Link to="/admin/clientes/novo" className="btn-primary">
          + Novo cliente
        </Link>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por nome, empresa ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : clients.length === 0 ? (
        <div className="empty-state">Nenhum cliente cadastrado ainda.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Empresa</th>
              <th>E-mail</th>
              <th>Telefone</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} onClick={() => navigate(`/admin/clientes/${c.id}`)}>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.company || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>{c.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
