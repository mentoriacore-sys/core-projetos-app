import { useEffect, useState } from 'react'
import { createTicket, listTicketsByProject } from '../../services/supabase/tickets'
import { TICKET_CATEGORY_OPTIONS, TICKET_IMPACT_OPTIONS } from '../../types/database'
import type { ProjectWithClient, SupportTicket } from '../../types/database'
import { StatusBadge } from '../../components/common/Badge'
import { getErrorMessage } from '../../lib/errorMessage'
import PortalTicketDrawer from './PortalTicketDrawer'

interface Props {
  project: ProjectWithClient
}

function daysUntil(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10)
  return Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / (24 * 3600 * 1000))
}

export default function PortalTicketsView({ project }: Props) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)
  const [form, setForm] = useState({ category: '', title: '', description: '', reported_impact: '' })

  const supportEndsAt = project.support_ends_at
  const windowOpen = !supportEndsAt || supportEndsAt >= new Date().toISOString().slice(0, 10)
  const daysLeft = supportEndsAt ? daysUntil(supportEndsAt) : null

  async function reload() {
    setLoading(true)
    try {
      setTickets(await listTicketsByProject(project.id))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar chamados'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  async function handleSubmit() {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Preencha ao menos o título e a descrição.')
      return
    }
    setSaving(true)
    try {
      await createTicket({
        project_id: project.id,
        client_id: project.client_id,
        category: (form.category || null) as SupportTicket['category'],
        title: form.title.trim(),
        description: form.description.trim(),
        reported_impact: (form.reported_impact || null) as SupportTicket['reported_impact'],
      })
      setShowForm(false)
      setForm({ category: '', title: '', description: '', reported_impact: '' })
      setError(null)
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao abrir chamado'))
    } finally {
      setSaving(false)
    }
  }

  const openTicket = tickets.find((t) => t.id === openTicketId) ?? null

  return (
    <div>
      <div className="form-card" style={{ marginBottom: '1.2rem' }}>
        <h3 style={{ marginTop: 0 }}>Acompanhamento</h3>
        {supportEndsAt ? (
          windowOpen ? (
            <>
              <p>
                Seu período de acompanhamento vai até: <strong>{supportEndsAt}</strong>
              </p>
              {daysLeft !== null && daysLeft <= 7 && daysLeft > 2 && (
                <p style={{ color: 'var(--color-warning)' }}>Seu período de acompanhamento termina em {daysLeft} dias.</p>
              )}
              {daysLeft !== null && daysLeft <= 2 && daysLeft >= 0 && (
                <p style={{ color: 'var(--color-danger)' }}>
                  Seu acompanhamento termina em {daysLeft} dias. Caso exista alguma ocorrência relacionada ao projeto,
                  registre-a pela Central de Chamados.
                </p>
              )}
            </>
          ) : (
            <p>O período de acompanhamento deste projeto foi encerrado.</p>
          )
        ) : (
          <p className="drawer-section-hint">O período de acompanhamento ainda não foi iniciado.</p>
        )}
      </div>

      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Chamados</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)} disabled={!windowOpen} title={!windowOpen ? 'Período de acompanhamento encerrado' : ''}>
          + Abrir chamado
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {showForm && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label>
              Área relacionada
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">—</option>
                {TICKET_CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Impacto percebido
              <select value={form.reported_impact} onChange={(e) => setForm({ ...form, reported_impact: e.target.value })}>
                <option value="">—</option>
                {TICKET_IMPACT_OPTIONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Título *
              <input
                placeholder='Ex: "Formulário não está enviando os dados."'
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label className="full-width">
              Descrição *
              <textarea
                rows={3}
                placeholder="Conte o que aconteceu, o que você esperava que acontecesse e, se possível, quais passos realizou antes do problema aparecer."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
          </div>
          <div className="row-actions">
            <button className="btn-primary" onClick={handleSubmit} disabled={saving} type="button">
              {saving ? 'Enviando...' : 'Enviar chamado'}
            </button>
            <button onClick={() => setShowForm(false)} type="button">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : tickets.length === 0 ? (
        <div className="empty-state">Nenhum chamado aberto ainda.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Assunto</th>
              <th>Data</th>
              <th>Status</th>
              <th>Última atualização</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} onClick={() => setOpenTicketId(t.id)} style={{ cursor: 'pointer' }}>
                <td data-label="Código">{t.ticket_code}</td>
                <td data-label="Assunto">{t.title}</td>
                <td data-label="Data">{new Date(t.opened_at).toLocaleDateString('pt-BR')}</td>
                <td data-label="Status">
                  <StatusBadge status={t.status} />
                </td>
                <td data-label="Última atualização">{new Date(t.updated_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openTicket && <PortalTicketDrawer ticket={openTicket} onClose={() => setOpenTicketId(null)} />}
    </div>
  )
}
