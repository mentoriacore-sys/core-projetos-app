import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './AdminLayout.css'

export default function AdminLayout() {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) return <div className="admin-loading">Carregando...</div>
  if (!session) return <Navigate to="/login" replace />

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="admin-loading">
        <p>Seu acesso ainda está sendo configurado. Fale com a administradora.</p>
        <button onClick={signOut}>Sair</button>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">C.O.R.E. Projetos</div>
        <nav>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/clientes" className={({ isActive }) => (isActive ? 'active' : '')}>
            Clientes
          </NavLink>
          <NavLink to="/admin/projetos" className={({ isActive }) => (isActive ? 'active' : '')}>
            Projetos
          </NavLink>
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <span>{profile?.name || profile?.email}</span>
          <button onClick={signOut}>Sair</button>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
