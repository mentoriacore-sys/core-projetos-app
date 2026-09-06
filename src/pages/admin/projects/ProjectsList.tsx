import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listProjects } from '../../../services/supabase/projects'
import { listClients } from '../../../services/supabase/clients'
import { PROJECT_STATUS_OPTIONS } from '../../../types/database'
import type { Client, ProjectWithClient } from '../../../types/database'
import { StatusBadge } from '../../../components/common/Badge'
import '../../../components/common/admin-ui.css'

export default function ProjectsList() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [clientId, setClientId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listClients('').then(setClients).catch(() => undefined)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    listProjects({ search, status, clientId })
      .then((data) => {
        if (active) setProjects(data)
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [search, status, clientId])

  return (
    <div>
      <div className="page-header">
        <h1>Projetos</h1>
        <Link to="/admin/projetos/novo" className="btn-primary">
          + Novo projeto
        </Link>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {PROJECT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">Nenhum projeto cadastrado ainda.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Projeto</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Saúde</th>
              <th>Progresso</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/admin/projetos/${p.id}`)}>
                <td data-label="Código">{p.code}</td>
                <td data-label="Projeto">{p.name}</td>
                <td data-label="Cliente">{p.clients?.name ?? '—'}</td>
                <td data-label="Status">
                  <StatusBadge status={p.status} />
                </td>
                <td data-label="Saúde">{p.health ? <StatusBadge status={p.health} /> : '—'}</td>
                <td data-label="Progresso">{Number(p.progress).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
