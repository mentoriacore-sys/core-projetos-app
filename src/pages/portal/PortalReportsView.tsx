import { useEffect, useState } from 'react'
import { listPublishedReports, type ReportWithItems } from '../../services/supabase/reports'
import { REPORT_ITEM_TYPES, REPORT_ITEM_TYPE_LABELS } from '../../types/database'
import { getErrorMessage } from '../../lib/errorMessage'

export default function PortalReportsView({ projectId }: { projectId: string }) {
  const [reports, setReports] = useState<ReportWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listPublishedReports(projectId)
      .then(setReports)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return <p>Carregando...</p>
  if (error) return <p className="form-error">{error}</p>
  if (reports.length === 0) return <div className="empty-state">Nenhum relatório publicado ainda.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {reports.map((r) => (
        <div className="form-card" key={r.id}>
          <h3 style={{ marginTop: 0 }}>
            Relatório — {r.period_start ?? '—'} a {r.period_end ?? '—'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Publicado em {r.published_at ? new Date(r.published_at).toLocaleDateString('pt-BR') : '—'}
          </p>
          {r.executive_summary && <p>{r.executive_summary}</p>}
          {REPORT_ITEM_TYPES.map((itemType) => {
            const items = r.report_items.filter((i) => i.item_type === itemType)
            if (items.length === 0) return null
            return (
              <div key={itemType} style={{ marginTop: '1rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>{REPORT_ITEM_TYPE_LABELS[itemType]}</strong>
                <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem' }}>
                  {items.map((i) => (
                    <li key={i.id} style={{ fontSize: '0.9rem' }}>
                      {i.description}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
