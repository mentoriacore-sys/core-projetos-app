import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createClient, getClient, updateClient, type ClientInput } from '../../../services/supabase/clients'
import { CLIENT_ORIGIN_OPTIONS } from '../../../types/database'
import { useDraftState } from '../../../hooks/useDraftState'
import '../../../components/common/admin-ui.css'

const emptyForm: ClientInput = {
  name: '',
  company: '',
  email: '',
  phone: '',
  segment: '',
  origin: null,
  internal_note: '',
  status: '',
  base_core_client_id: null,
}

export default function ClientForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const draftKey = isEdit ? `draft:client:edit:${id}` : 'draft:client:new'

  const [form, setForm, clearDraft] = useDraftState<ClientInput>(draftKey, emptyForm)
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoredDraft] = useState(() => Boolean(localStorage.getItem(draftKey)))

  useEffect(() => {
    if (!id) return
    getClient(id)
      .then((c) => {
        setCode(c.code)
        // Se já existe um rascunho salvo (a aba recarregou com dados não salvos),
        // mantemos o rascunho em vez de sobrescrever com o que está no servidor.
        if (!restoredDraft) {
          setForm({
            name: c.name,
            company: c.company,
            email: c.email,
            phone: c.phone,
            segment: c.segment,
            origin: c.origin,
            internal_note: c.internal_note,
            status: c.status,
            base_core_client_id: c.base_core_client_id,
          })
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function update<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isEdit && id) {
        await updateClient(id, form)
      } else {
        await createClient(form)
      }
      clearDraft()
      navigate('/admin/clientes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? `Editar cliente ${code ?? ''}` : 'Novo cliente'}</h1>
      </div>

      {restoredDraft && (
        <p className="form-info">Recuperamos os dados que você havia digitado antes da tela recarregar.</p>
      )}

      <form className="form-card" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="form-grid">
          <label>
            Nome *
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </label>
          <label>
            Empresa
            <input value={form.company ?? ''} onChange={(e) => update('company', e.target.value)} />
          </label>
          <label>
            E-mail
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => update('email', e.target.value)}
            />
          </label>
          <label>
            Telefone
            <input value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
          </label>
          <label>
            Segmento
            <input value={form.segment ?? ''} onChange={(e) => update('segment', e.target.value)} />
          </label>
          <label>
            Origem
            <select
              value={form.origin ?? ''}
              onChange={(e) => update('origin', (e.target.value || null) as ClientInput['origin'])}
            >
              <option value="">—</option>
              {CLIENT_ORIGIN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <input value={form.status ?? ''} onChange={(e) => update('status', e.target.value)} />
          </label>
          <label>
            ID do cliente na Base C.O.R.E. (se houver)
            <input
              value={form.base_core_client_id ?? ''}
              onChange={(e) => update('base_core_client_id', e.target.value || null)}
            />
          </label>
          <label className="full-width">
            Observação interna
            <textarea
              rows={3}
              value={form.internal_note ?? ''}
              onChange={(e) => update('internal_note', e.target.value)}
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              clearDraft()
              navigate('/admin/clientes')
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
