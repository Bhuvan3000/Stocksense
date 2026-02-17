import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'
import { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    api.get('/dashboard/low-stock')
      .then(r => setAlertCount(r.data.data.lowStock.length + r.data.data.outOfStock.length))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/',          label: 'Dashboard',  icon: 'dashboard' },
    { to: '/inventory', label: 'Inventory',  icon: 'inventory' },
    { to: '/orders',    label: 'Orders',     icon: 'orders'    },
  ]
  const insightItems = [
    { to: '/reports', label: 'Reports',      icon: 'reports' },
    { to: '/alerts',  label: 'Stock Alerts', icon: 'alerts', badge: alertCount },
  ]

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">
          <div className="logo-icon">S</div>
          <div>
            <div className="logo-text">StockSense</div>
            <div className="logo-sub">Inventory</div>
          </div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">Main</div>
        {navItems.map(item => (
          <NavLink
            key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </NavLink>
        ))}

        <div className="nav-label" style={{ marginTop: 8 }}>Insights</div>
        {insightItems.map(item => (
          <NavLink
            key={item.to} to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--glow)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--accent2)', fontWeight: 700 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'Outfit' }}>{user?.name}</div>
            <div style={{ fontSize: 10 }}>{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
          <Icon name="logout" size={12} /> Sign out
        </button>
      </div>
    </aside>
  )
}
