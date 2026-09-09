import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './PortalLayout.css'

export default function PortalLayout() {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) return <div className="portal-loading">Carregando...</div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <div className="portal-loading">Carregando...</div>

  if (profile.role === 'admin') return <Navigate to="/admin" replace />
  if (profile.role !== 'client') {
    return (
      <div className="portal-loading">
        <p>Seu acesso ainda está sendo configurado. Fale com a administradora.</p>
        <button onClick={signOut}>Sair</button>
      </div>
    )
  }

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <div className="portal-brand">
          <span className="admin-brand-mark">C</span>
          <span>C.O.R.E. Projetos</span>
        </div>
        <div className="portal-header-right">
          <span className="portal-user-name">{profile.name || profile.email}</span>
          <button className="admin-icon-btn" onClick={signOut}>
            Sair
          </button>
        </div>
      </header>
      <main className="portal-content">
        <Outlet />
      </main>
    </div>
  )
}
