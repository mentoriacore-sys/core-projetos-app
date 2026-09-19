import { useEffect, useState } from 'react'
import { generateReport, listReports, type ReportWithItems } from '../../../services/supabase/reports'
import { StatusBadge } from '../../../components/common/Badge'
import { getErrorMessage } from '../../../lib/errorMessage'
import ReportDetailDrawer from './ReportDetailDrawer'

interface Props {
  projectId: string
}

export default function ReportsTab({ projectId }: Props) {
  const [reports, setReports] = useState<ReportWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [openReportId, setOpenReportId] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    try {
      setReports(await listReports(projectId))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar relatórios'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const report = await generateReport(projectId, periodStart || null, periodEnd || null)
      setShowForm(false)
      setPeriodStart('')
      setPeriodEnd('')
      await reload()
      setOpenReportId(report.id)
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao gerar relatório'))
    } finally {
      setGenerating(false)
    }
  }

  const openReport = reports.find((r) => r.id === openReportId) ?? null

  return (
    <div>
      {error && <p className="form-error">{error}</p>}

      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Relatórios de acompanhamento</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Gerar relatório
        </button>
      </div>

      {showForm && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label>
              Período — de
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </label>
            <label>
              Período — até
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </label>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem' }}>
            O relatório nasce como rascunho, pré-preenchido com o que aconteceu no projeto. Você revisa e edita antes
            de publicar — nada é enviado ao cliente automaticamente.
          </p>
          <div className="row-actions">
            <button className="btn-primary" onClick={handleGenerate} disabled={generating} type="button">
              {generating ? 'Gerando...' : 'Gerar'}
            </button>
            <button onClick={() => setShowForm(false)} type="button">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : reports.length === 0 ? (
        <div className="empty-state">Nenhum relatório gerado ainda.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Status</th>
              <th>Gerado em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} onClick={() => setOpenReportId(r.id)} style={{ cursor: 'pointer' }}>
                <td data-label="Período">
                  {r.period_start ?? '—'} a {r.period_end ?? '—'}
                </td>
                <td data-label="Status">
                  <StatusBadge status={r.status} />
                </td>
                <td data-label="Gerado em">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                <td data-label="Ações">Ver detalhes →</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openReport && <ReportDetailDrawer report={openReport} onClose={() => setOpenReportId(null)} onChange={reload} />}
    </div>
  )
}
