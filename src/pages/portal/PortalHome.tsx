import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { listProjects } from '../../services/supabase/projects'
import { StatusBadge } from '../../components/common/Badge'
import ProgressBar from '../../components/common/ProgressBar'
import type { ProjectWithClient } from '../../types/database'
import { getErrorMessage } from '../../lib/errorMessage'

export default function PortalHome() {
  const [projects, setProjects] = useState<ProjectWithClient[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listProjects({ search: '', status: '', clientId: '' })
      .then(setProjects)
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  if (error) return <p className="form-error">{error}</p>
  if (!projects) return <p>Carregando...</p>

  if (projects.length === 1) {
    return <Navigate to={`/portal/projetos/${projects[0].id}`} replace />
  }

  if (projects.length === 0) {
    return <div className="empty-state">Nenhum projeto disponível no momento.</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-5)' }}>Seus projetos</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/portal/projetos/${p.id}`}
            className="form-card"
            style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <strong>{p.name}</strong>
              <StatusBadge status={p.status} />
            </div>
            <ProgressBar value={Number(p.progress)} />
          </Link>
        ))}
      </div>
    </div>
  )
}
