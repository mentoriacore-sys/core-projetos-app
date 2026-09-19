import { useState } from 'react'
import {
  addReportItem,
  deleteReport,
  deleteReportItem,
  publishReport,
  updateReport,
  updateReportItem,
  type ReportWithItems,
} from '../../../services/supabase/reports'
import { REPORT_ITEM_TYPES, REPORT_ITEM_TYPE_LABELS } from '../../../types/database'
import { StatusBadge } from '../../../components/common/Badge'
import { getErrorMessage } from '../../../lib/errorMessage'
import './TaskDetailDrawer.css'

interface Props {
  report: ReportWithItems
  onClose: () => void
  onChange: () => void
}

export default function ReportDetailDrawer({ report, onClose, onChange }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState(report.executive_summary ?? '')
  const [newItemText, setNewItemText] = useState<Record<string, string>>({})
  const [publishing, setPublishing] = useState(false)
  const isDraft = report.status === 'Rascunho'

  async function handleSaveSummary() {
    try {
      await updateReport(report.id, { executive_summary: summary })
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleAddItem(itemType: string) {
    const text = (newItemText[itemType] ?? '').trim()
    if (!text) return
    try {
      await addReportItem(report.id, itemType, text)
      setNewItemText({ ...newItemText, [itemType]: '' })
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleEditItem(id: string, current: string) {
    const next = prompt('Editar item:', current)
    if (next === null || next.trim() === current) return
    try {
      await updateReportItem(id, next.trim())
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      await deleteReportItem(id)
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handlePublish() {
    if (!confirm('Publicar este relatório? Depois de publicado, o conteúdo fica congelado e não pode mais ser editado — só liberado para o cliente ver no Portal.')) return
    setPublishing(true)
    try {
      await publishReport(report.id)
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPublishing(false)
    }
  }

  async function handleDeleteDraft() {
    if (!confirm('Excluir este rascunho de relatório? Essa ação não pode ser desfeita.')) return
    try {
      await deleteReport(report.id)
      onClose()
      onChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2>
              Relatório {report.period_start ?? '—'} a {report.period_end ?? '—'}
            </h2>
            <StatusBadge status={report.status} />
          </div>
          <button className="drawer-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="drawer-section">
          <span className="drawer-section-label">Resumo executivo</span>
          {isDraft ? (
            <>
              <textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} onBlur={handleSaveSummary} />
              <p className="drawer-section-hint">Salva automaticamente ao sair do campo.</p>
            </>
          ) : (
            <p>{report.executive_summary || '—'}</p>
          )}
        </div>

        {REPORT_ITEM_TYPES.map((itemType) => {
          const items = report.report_items.filter((i) => i.item_type === itemType)
          if (!isDraft && items.length === 0) return null
          return (
            <div className="drawer-section" key={itemType}>
              <span className="drawer-section-label">{REPORT_ITEM_TYPE_LABELS[itemType]}</span>
              {items.length === 0 ? (
                <p className="drawer-section-hint">Nenhum item.</p>
              ) : (
                <ul className="drawer-attachments">
                  {items.map((i) => (
                    <li key={i.id}>
                      <span>{i.description}</span>
                      {isDraft && (
                        <span className="row-actions">
                          <button className="drawer-attachment-link" onClick={() => handleEditItem(i.id, i.description)}>
                            Editar
                          </button>
                          <button className="drawer-attachment-remove" onClick={() => handleDeleteItem(i.id)}>
                            Excluir
                          </button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {isDraft && (
                <div className="drawer-comment-form">
                  <input
                    placeholder="Adicionar item..."
                    value={newItemText[itemType] ?? ''}
                    onChange={(e) => setNewItemText({ ...newItemText, [itemType]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(itemType)}
                  />
                  <button className="btn-secondary" onClick={() => handleAddItem(itemType)}>
                    + Adicionar
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {isDraft && (
          <div className="drawer-quick-actions">
            <button className="btn-primary" onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publicando...' : '📤 Publicar relatório'}
            </button>
            <button className="btn-secondary" onClick={handleDeleteDraft}>
              Excluir rascunho
            </button>
          </div>
        )}

        {!isDraft && report.published_at && (
          <p className="drawer-section-hint">
            Publicado em {new Date(report.published_at).toLocaleString('pt-BR')} — visível para o cliente no Portal.
          </p>
        )}
      </div>
    </div>
  )
}
