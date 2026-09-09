import { useEffect, useState } from 'react'
import {
  linkUserToClientByEmail,
  listClientUsers,
  removeClientUser,
  updateClientUserAccess,
  type ClientUserRow,
} from '../../../services/supabase/clientUsers'
import { getErrorMessage } from '../../../lib/errorMessage'
import { StatusBadge } from '../../../components/common/Badge'

export default function ClientUsersSection({ clientId }: { clientId: string }) {
  const [users, setUsers] = useState<ClientUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [label, setLabel] = useState('')
  const [linking, setLinking] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      setUsers(await listClientUsers(clientId))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  async function handleLink() {
    if (!email.trim()) return
    setLinking(true)
    setError(null)
    try {
      await linkUserToClientByEmail(clientId, email.trim(), label.trim())
      setEmail('')
      setLabel('')
      await reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLinking(false)
    }
  }

  async function handleToggleAccess(user: ClientUserRow) {
    const next = user.access_status === 'Ativo' ? 'Acesso encerrado' : 'Ativo'
    await updateClientUserAccess(user.id, next)
    await reload()
  }

  async function handleRemove(user: ClientUserRow) {
    if (!confirm(`Remover o acesso de ${user.profiles?.name || user.profiles?.email}?`)) return
    await removeClientUser(user.id)
    await reload()
  }

  return (
    <div className="form-card" style={{ marginTop: 'var(--space-5)' }}>
      <h2 style={{ fontSize: 'var(--text-base)', margin: '0 0 var(--space-2)' }}>Usuários com acesso ao Portal</h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4)' }}>
        A pessoa precisa se cadastrar primeiro pela tela de login (com o mesmo e-mail) — depois você vincula aqui.
      </p>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : users.length === 0 ? (
        <div className="empty-state">Nenhum usuário vinculado ainda.</div>
      ) : (
        <table className="data-table" style={{ marginBottom: 'var(--space-4)' }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Rótulo</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Nome">{u.profiles?.name || '—'}</td>
                <td data-label="E-mail">{u.profiles?.email || '—'}</td>
                <td data-label="Rótulo">{u.label || '—'}</td>
                <td data-label="Status">
                  <StatusBadge status={u.access_status} />
                </td>
                <td data-label="Ações">
                  <div className="row-actions">
                    <button onClick={() => handleToggleAccess(u)} type="button">
                      {u.access_status === 'Ativo' ? 'Encerrar acesso' : 'Reativar'}
                    </button>
                    <button className="danger" onClick={() => handleRemove(u)} type="button">
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="inline-form-grid" style={{ marginBottom: 0 }}>
        <label>
          E-mail da pessoa (já cadastrada)
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@cliente.com" />
        </label>
        <label>
          Rótulo (opcional)
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex.: principal, financeiro" />
        </label>
      </div>
      <button className="btn-primary" onClick={handleLink} disabled={linking} type="button" style={{ marginTop: 'var(--space-3)' }}>
        {linking ? 'Vinculando...' : '+ Vincular usuário'}
      </button>
    </div>
  )
}
