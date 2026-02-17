import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotifyProvider }        from './context/NotifyContext'
import Sidebar    from './components/Sidebar'
import AuthPage   from './pages/AuthPage'
import Dashboard  from './pages/Dashboard'
import Inventory  from './pages/Inventory'
import Orders     from './pages/Orders'
import Reports    from './pages/Reports'
import Alerts     from './pages/Alerts'

const PAGE_TITLES = {
  '/':          ['Stock', 'Sense Dashboard'],
  '/inventory': ['Product ', 'Inventory'],
  '/orders':    ['Purchase & ', 'Sales Orders'],
  '/reports':   ['Analytics & ', 'Reports'],
  '/alerts':    ['Stock ', 'Alerts'],
}

function Layout() {
  const { user, loading } = useAuth()
  const path = window.location.pathname

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  const [plain, accent] = PAGE_TITLES[path] || ['Stock', 'Sense']

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="topbar">
          <div className="page-title">
            {plain}<span>{accent}</span>
          </div>
        </header>
        <div className="content">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders"    element={<Orders />} />
            <Route path="/reports"   element={<Reports />} />
            <Route path="/alerts"    element={<Alerts />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotifyProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/*"     element={<Layout />} />
        </Routes>
      </NotifyProvider>
    </AuthProvider>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}
