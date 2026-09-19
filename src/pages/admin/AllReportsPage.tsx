import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllReports, type ProjectReportWithProject } from '../../services/supabase/reports'
import { StatusBadge } from '../../components/common/Badge'
import { getErrorMessage } from '../../lib/errorMessage'
import '../../components/common/admin-ui.css'

export default function AllReportsPage() {
  const [reports, setReports] = useState<ProjectReportWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    listAllReports()
      .then(setReports)
      .catch((err) => setError(getErrorMessage(err, 'Erro ao carregar relatórios')))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (status && r.status !== status) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const haystack = `${r.projects?.name ?? ''} ${r.projects?.clients?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [reports, status, search])

  return (
    <div>
      <div className="page-header">
        <h1>Relatórios</h1>
      </div>

      <div className="filters-bar">
        <input placeholder="Buscar por projeto ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="Rascunho">Rascunho</option>
          <option value="Publicado">Publicado</option>
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Nenhum relatório encontrado.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Projeto</th>
              <th>Cliente</th>
              <th>Período</th>
              <th>Status</th>
              <th>Gerado em</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td data-label="Projeto">
                  {r.projects && <Link to={`/admin/projetos/${r.projects.id}`}>{r.projects.code}</Link>}
                </td>
                <td data-label="Cliente">{r.projects?.clients?.name ?? '—'}</td>
                <td data-label="Período">
                  {r.period_start ?? '—'} a {r.period_end ?? '—'}
                </td>
                <td data-label="Status">
                  <StatusBadge status={r.status} />
                </td>
                <td data-label="Gerado em">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
