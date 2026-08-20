import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/auth/Login'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ClientsList from './pages/admin/clients/ClientsList'
import ClientForm from './pages/admin/clients/ClientForm'
import ProjectsList from './pages/admin/projects/ProjectsList'
import ProjectForm from './pages/admin/projects/ProjectForm'
import ProjectDetail from './pages/admin/projects/ProjectDetail'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<ClientsList />} />
            <Route path="clientes/novo" element={<ClientForm />} />
            <Route path="clientes/:id" element={<ClientForm />} />
            <Route path="projetos" element={<ProjectsList />} />
            <Route path="projetos/novo" element={<ProjectForm />} />
            <Route path="projetos/:id" element={<ProjectDetail />} />
            <Route path="projetos/:id/editar" element={<ProjectForm />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
