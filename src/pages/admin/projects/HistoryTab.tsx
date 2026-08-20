import { useEffect, useState } from 'react'
import { listHistory } from '../../../services/supabase/history'
import type { ProjectHistoryEntry } from '../../../types/database'
import { getErrorMessage } from '../../../lib/errorMessage'

interface Props {
  projectId: string
}

export default function HistoryTab({ projectId }: Props) {
  const [items, setItems] = useState<ProjectHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listHistory(projectId)
      .then(setItems)
      .catch((err) => setError(getErrorMessage(err, 'Erro ao carregar histórico')))
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return <p>Carregando...</p>
  if (error) return <p className="form-error">{error}</p>

  return (
    <div>
      <h2 style={{ fontSize: '1rem', margin: '0 0 1rem' }}>Histórico</h2>
      <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '-0.5rem', marginBottom: '1rem' }}>
        Registrado automaticamente pelo sistema — não é possível editar.
      </p>
      {items.length === 0 ? (
        <div className="empty-state">Nenhum evento registrado ainda.</div>
      ) : (
        <div className="form-card">
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid #f0f1f3' }}>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af', minWidth: '130px' }}>
                {new Date(item.created_at).toLocaleString('pt-BR')}
              </span>
              <span style={{ fontSize: '0.88rem' }}>{item.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
