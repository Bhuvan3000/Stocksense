import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('ss_user') || 'null'))
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('ss_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(r => { setUser(r.data.user); localStorage.setItem('ss_user', JSON.stringify(r.data.user)) })
      .catch(() => { localStorage.removeItem('ss_token'); localStorage.removeItem('ss_user'); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('ss_token', data.token)
    localStorage.setItem('ss_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('ss_token', data.token)
    localStorage.setItem('ss_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('ss_token')
    localStorage.removeItem('ss_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
