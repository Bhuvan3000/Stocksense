import { createContext, useContext, useState, useCallback } from 'react'

const NotifyContext = createContext(null)

export const NotifyProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const notify = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setNotifications(n => [...n, { id, msg, type }])
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 3500)
  }, [])

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <div className="notify">
        {notifications.map(n => (
          <div key={n.id} className={`notify-item ${n.type}`}>
            {n.type === 'success' && '✓'}
            {n.type === 'error'   && '✕'}
            {n.type === 'info'    && 'ℹ'}
            <span>{n.msg}</span>
          </div>
        ))}
      </div>
    </NotifyContext.Provider>
  )
}

export const useNotify = () => {
  const ctx = useContext(NotifyContext)
  if (!ctx) throw new Error('useNotify must be inside NotifyProvider')
  return ctx
}
