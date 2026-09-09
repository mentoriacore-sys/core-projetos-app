import { useEffect, useState } from 'react'
import { listFiles } from '../../services/supabase/files'
import type { ProjectFile } from '../../types/database'
import { getErrorMessage } from '../../lib/errorMessage'

export default function PortalDocumentsView({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listFiles(projectId)
      .then(setFiles)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return <p>Carregando...</p>
  if (error) return <p className="form-error">{error}</p>
  if (files.length === 0) return <div className="empty-state">Nenhum documento liberado ainda.</div>

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Categoria</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {files.map((f) => (
          <tr key={f.id}>
            <td data-label="Nome">
              <a href={f.file_or_url} target="_blank" rel="noreferrer">
                {f.name}
              </a>
            </td>
            <td data-label="Categoria">{f.category ?? '—'}</td>
            <td data-label="Data">{f.file_date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
