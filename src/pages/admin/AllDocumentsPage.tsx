import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllFiles, type ProjectFileWithProject } from '../../services/supabase/files'
import { FILE_CATEGORY_OPTIONS } from '../../types/database'
import { getErrorMessage } from '../../lib/errorMessage'
import '../../components/common/admin-ui.css'

export default function AllDocumentsPage() {
  const [files, setFiles] = useState<ProjectFileWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  async function reload() {
    setLoading(true)
    try {
      setFiles(await listAllFiles())
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar documentos'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const filtered = useMemo(() => {
    return files.filter((f) => {
      if (category && f.category !== category) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const haystack = `${f.name} ${f.projects?.name ?? ''} ${f.projects?.clients?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [files, category, search])

  return (
    <div>
      <div className="page-header">
        <h1>Documentos</h1>
      </div>

      <div className="filters-bar">
        <input placeholder="Buscar por nome, projeto ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas as categorias</option>
          {FILE_CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Nenhum documento encontrado.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Projeto</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Visibilidade</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td data-label="Nome">
                  <a href={f.file_or_url} target="_blank" rel="noreferrer">
                    {f.name}
                  </a>
                </td>
                <td data-label="Categoria">{f.category ?? '—'}</td>
                <td data-label="Projeto">
                  {f.projects && (
                    <Link to={`/admin/projetos/${f.projects.id}`}>{f.projects.code}</Link>
                  )}
                </td>
                <td data-label="Cliente">{f.projects?.clients?.name ?? '—'}</td>
                <td data-label="Data">{f.file_date}</td>
                <td data-label="Visibilidade">
                  {f.visibility === 'internal' ? 'Somente interno' : f.visibility === 'client' ? 'Somente cliente' : 'Interno + Cliente'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
