import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Login.css'

export default function Login() {
  const { session, profile, loading, signInWithPassword, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session && loading) return <main className="login-screen">Carregando...</main>
  if (session) return <Navigate to={profile?.role === 'admin' ? '/admin' : '/portal'} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    const result =
      mode === 'login'
        ? await signInWithPassword(email, password)
        : await signUp(email, password, name)

    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (mode === 'signup') {
      setInfo('Conta criada. Verifique seu e-mail para confirmar o acesso, se solicitado, e faça login.')
      setMode('login')
    }
  }

  return (
    <main className="login-screen">
      <div className="login-card">
        <div className="login-brand-mark">C</div>
        <h1>C.O.R.E. Projetos</h1>
        <p className="subtitle">{mode === 'login' ? 'Entrar' : 'Criar conta'}</p>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              Nome
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {info && <p className="form-info">{info}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(null)
            setInfo(null)
          }}
        >
          {mode === 'login' ? 'Ainda não tem conta? Criar conta' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </main>
  )
}
