import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../context/NotifyContext'

export default function AuthPage() {
  const [tab, setTab]     = useState('login')
  const [form, setForm]   = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]    = useState('')

  const { login, register } = useAuth()
  const notify   = useNotify()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (tab === 'login') {
        await login(form.email, form.password)
        notify('Welcome back!', 'success')
      } else {
        await register(form.name, form.email, form.password)
        notify('Account created!', 'success')
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon" style={{ margin: '0 auto 12px', width: 48, height: 48, fontSize: 22 }}>S</div>
          <h1>StockSense</h1>
          <p>Inventory Management System</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError('') }}>Sign In</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError('') }}>Register</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={tab === 'register' ? 'Min 6 characters' : '••••••••'} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, justifyContent: 'center' }}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: '14px', background: 'var(--surface2)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
          <strong style={{ color: 'var(--text2)' }}>Demo credentials:</strong><br />
          admin@stocksense.com / admin123
        </div>
      </div>
    </div>
  )
}
