import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllTickets, type TicketWithProject } from '../../../services/supabase/tickets'
import { listProfiles } from '../../../services/supabase/profiles'
import { TICKET_PRIORITY_OPTIONS, TICKET_STATUS_OPTIONS } from '../../../types/database'
import { StatusBadge } from '../../../components/common/Badge'
import { getErrorMessage } from '../../../lib/errorMessage'
import TicketDetailDrawer from './TicketDetailDrawer'
import '../../../components/common/admin-ui.css'

const PRIORITY_ORDER: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 }

export default function AllTicketsPage() {
  const [tickets, setTickets] = useState<TicketWithProject[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [admins, setAdmins] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    try {
      const [t, profiles] = await Promise.all([listAllTickets(), listProfiles()])
      setTickets(t)
      const names: Record<string, string> = {}
      profiles.forEach((p) => (names[p.id] = p.name || p.email || 'Usuário'))
      setProfileNames(names)
      setAdmins(profiles.filter((p) => p.role === 'admin').map((p) => ({ id: p.id, name: p.name || p.email || 'Usuário' })))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar chamados'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const now = Date.now()
  const openTickets = tickets.filter((t) => !['Resolvido', 'Encerrado', 'Cancelado'].includes(t.status))
  const indicators = {
    abertos: tickets.filter((t) => t.status === 'Aberto').length,
    emAtendimento: tickets.filter((t) => t.status === 'Em atendimento').length,
    aguardandoCliente: tickets.filter((t) => t.status === 'Aguardando cliente').length,
    criticos: openTickets.filter((t) => t.priority === 'P1').length,
    vencendoSla: openTickets.filter((t) => t.due_at && !t.first_response_at && new Date(t.due_at).getTime() > now && new Date(t.due_at).getTime() - now < 4 * 3600 * 1000).length,
    slaVencido: openTickets.filter((t) => t.due_at && !t.first_response_at && new Date(t.due_at).getTime() < now).length,
    resolvidos30d: tickets.filter((t) => t.resolved_at && now - new Date(t.resolved_at).getTime() < 30 * 24 * 3600 * 1000).length,
  }

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => {
        if (status && t.status !== status) return false
        if (priority && t.priority !== priority) return false
        if (search.trim()) {
          const q = search.toLowerCase()
          const haystack = `${t.ticket_code} ${t.title} ${t.projects?.name ?? ''} ${t.projects?.clients?.name ?? ''}`.toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority ?? ''] ?? 99
        const pb = PRIORITY_ORDER[b.priority ?? ''] ?? 99
        if (pa !== pb) return pa - pb
        if (a.due_at && b.due_at) return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
        return new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
      })
  }, [tickets, status, priority, search])

  const openTicket = tickets.find((t) => t.id === openTicketId) ?? null

  return (
    <div>
      <div className="page-header">
        <h1>Chamados</h1>
      </div>

      <div className="summary-dots" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
        <span>🔵 {indicators.abertos} abertos</span>
        <span>🛠️ {indicators.emAtendimento} em atendimento</span>
        <span>🟡 {indicators.aguardandoCliente} aguardando cliente</span>
        <span>🔴 {indicators.criticos} críticos</span>
        <span>⏳ {indicators.vencendoSla} vencendo SLA</span>
        <span>⚠️ {indicators.slaVencido} SLA vencido</span>
        <span>✅ {indicators.resolvidos30d} resolvidos (30d)</span>
      </div>

      <div className="filters-bar">
        <input placeholder="Buscar por código, título, projeto ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {TICKET_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Todas as prioridades</option>
          {TICKET_PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Nenhum chamado encontrado.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Prioridade</th>
              <th>Chamado</th>
              <th>Cliente</th>
              <th>Projeto</th>
              <th>Categoria</th>
              <th>Aberto em</th>
              <th>Status</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} onClick={() => setOpenTicketId(t.id)} style={{ cursor: 'pointer' }}>
                <td data-label="Prioridade">
                  <StatusBadge status={t.priority ?? 'Sem prioridade'} />
                </td>
                <td data-label="Chamado">
                  <strong>{t.ticket_code}</strong> — {t.title}
                </td>
                <td data-label="Cliente">{t.projects?.clients?.name ?? '—'}</td>
                <td data-label="Projeto">
                  {t.projects && (
                    <Link to={`/admin/projetos/${t.projects.id}`} onClick={(e) => e.stopPropagation()}>
                      {t.projects.code}
                    </Link>
                  )}
                </td>
                <td data-label="Categoria">{t.category ?? '—'}</td>
                <td data-label="Aberto em">{new Date(t.opened_at).toLocaleDateString('pt-BR')}</td>
                <td data-label="Status">
                  <StatusBadge status={t.status} />
                </td>
                <td data-label="Responsável">{profileNames[t.assigned_to ?? ''] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openTicket && (
        <TicketDetailDrawer ticket={openTicket} profileNames={profileNames} admins={admins} onClose={() => setOpenTicketId(null)} onChange={reload} />
      )}
    </div>
  )
}
