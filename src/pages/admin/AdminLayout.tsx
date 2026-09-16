import { useState } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Icon from '../../components/common/Icon'
import './AdminLayout.css'

const MAIN_NAV = [
  { to: '/admin', end: true, icon: 'dashboard', label: 'Dashboard', ready: true },
  { to: '/admin/clientes', icon: 'clients', label: 'Clientes', ready: true },
  { to: '/admin/projetos', icon: 'projects', label: 'Projetos', ready: true },
  { to: '/admin/tarefas', icon: 'tasks', label: 'Tarefas', ready: true },
  { to: '/admin/documentos', icon: 'documents', label: 'Documentos', ready: false },
  { to: '/admin/relatorios', icon: 'reports', label: 'Relatórios', ready: false },
  { to: '/admin/configuracoes', icon: 'settings', label: 'Configurações', ready: false },
] as const

const SUPPORT_NAV = [
  { to: '/admin/chamados', icon: 'support', label: 'Chamados', ready: false },
  { to: '/admin/ajuda', icon: 'help', label: 'Central de Ajuda', ready: false },
] as const

export default function AdminLayout() {
  const { session, profile, loading, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

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

  const initials = (profile.name || profile.email || '?').trim().charAt(0).toUpperCase()

  return (
    <div className={`admin-shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">C</span>
          {!collapsed && (
            <span className="admin-brand-text">
              C.O.R.E.
              <small>Projetos</small>
            </span>
          )}
        </div>

        <nav className="admin-nav">
          <span className="admin-nav-heading">{!collapsed && 'Administração'}</span>
          {MAIN_NAV.map((item) =>
            item.ready ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : undefined}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon name={item.icon} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ) : (
              <span key={item.to} className="admin-nav-soon" title="Em breve">
                <Icon name={item.icon} />
                {!collapsed && <span>{item.label}</span>}
              </span>
            ),
          )}

          <span className="admin-nav-heading">{!collapsed && 'Suporte'}</span>
          {SUPPORT_NAV.map((item) => (
            <span key={item.to} className="admin-nav-soon" title="Em breve">
              <Icon name={item.icon} />
              {!collapsed && <span>{item.label}</span>}
            </span>
          ))}
        </nav>

        <div className="admin-user-card">
          <div className="admin-avatar">{initials}</div>
          {!collapsed && (
            <div className="admin-user-info">
              <strong>{profile.name || profile.email}</strong>
              <span>Administrador</span>
            </div>
          )}
        </div>

        <button className="admin-collapse-btn" onClick={() => setCollapsed((c) => !c)} title="Recolher menu">
          <Icon name="chevronLeft" size={16} />
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-brand admin-brand-mobile">
            <span className="admin-brand-mark">C</span>
          </div>
          <div className="admin-header-spacer" />
          <button className="admin-icon-btn" title="Notificações">
            <Icon name="bell" size={18} />
          </button>
          <button className="admin-icon-btn" onClick={signOut} title="Sair">
            <Icon name="logout" size={18} />
            <span>Sair</span>
          </button>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      <nav className="admin-mobile-nav">
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="dashboard" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/admin/clientes" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="clients" />
          <span>Clientes</span>
        </NavLink>
        <NavLink to="/admin/projetos" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="projects" />
          <span>Projetos</span>
        </NavLink>
        <NavLink to="/admin/tarefas" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="tasks" />
          <span>Tarefas</span>
        </NavLink>
        <button className="admin-mobile-nav-more" onClick={signOut}>
          <Icon name="logout" />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  )
}
