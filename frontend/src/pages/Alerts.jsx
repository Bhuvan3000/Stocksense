import { useState, useEffect } from 'react'
import api from '../utils/api'
import Icon from '../components/Icon'
import { useNotify } from '../context/NotifyContext'

export default function Alerts() {
  const [outOfStock, setOut]  = useState([])
  const [lowStock,   setLow]  = useState([])
  const [loading,    setLoading] = useState(true)
  const notify = useNotify()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/dashboard/low-stock')
      setOut(data.data.outOfStock)
      setLow(data.data.lowStock)
    } catch { notify('Failed to load alerts', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const quickRestock = async (product, amount) => {
    try {
      await api.patch(`/products/${product._id}/adjust-stock`, { adjustment: amount, reason: 'Quick restock from alerts' })
      notify(`Restocked "${product.name}" +${amount} units`)
      load()
    } catch (e) {
      notify(e.response?.data?.message || 'Restock failed', 'error')
    }
  }

  if (loading) return <div className="loading-wrap"><div className="spinner"/></div>

  const healthy = outOfStock.length === 0 && lowStock.length === 0

  return (
    <div>
      {/* SUMMARY */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card red">
          <div className="stat-label">Out of Stock</div>
          <div className="stat-value red">{outOfStock.length}</div>
          <div className="stat-sub">needs immediate action</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value yellow">{lowStock.length}</div>
          <div className="stat-sub">below minimum level</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Alerts</div>
          <div className="stat-value green">{outOfStock.length + lowStock.length}</div>
          <div className="stat-sub">products need attention</div>
        </div>
      </div>

      {/* ALL GOOD */}
      {healthy && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>All stock levels are healthy!</div>
          <div style={{ color: 'var(--text3)', fontSize: 14 }}>No alerts at this time. Keep up the great work.</div>
        </div>
      )}

      {/* OUT OF STOCK */}
      {outOfStock.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ color: 'var(--red)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="warning" size={16} /> Out of Stock — Immediate Action Required</span>
            <span>{outOfStock.length} products</span>
          </div>
          {outOfStock.map(p => (
            <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)', marginBottom: 8 }}>
              <div style={{ color: 'var(--red)' }}><Icon name="warning" size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>SKU: {p.sku} · {p.category} · {p.location}</div>
              </div>
              <div className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => quickRestock(p, 10)}>+10 Units</button>
                <button className="btn btn-ghost btn-sm" onClick={() => quickRestock(p, 50)}>+50 Units</button>
                <button className="btn btn-primary btn-sm" onClick={() => quickRestock(p, 100)}>+100 Units</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LOW STOCK */}
      {lowStock.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ color: 'var(--yellow)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="alerts" size={16} /> Low Stock — Reorder Soon</span>
            <span>{lowStock.length} products</span>
          </div>
          {lowStock.map(p => {
            const pct = Math.min(Math.round((p.quantity / (p.minStock * 2)) * 100), 100)
            return (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: 'rgba(243,156,18,0.06)', border: '1px solid rgba(243,156,18,0.2)', marginBottom: 8 }}>
                <div style={{ color: 'var(--yellow)' }}><Icon name="alerts" size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--yellow)' }}>{p.quantity} / {p.minStock} min</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>SKU: {p.sku} · {p.supplier} · {p.location}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--yellow)' }} />
                  </div>
                </div>
                <div className="actions" style={{ marginLeft: 12 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => quickRestock(p, 10)}>+10</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => quickRestock(p, 25)}>+25</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* REFRESH */}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={load}><Icon name="refresh" size={14} /> Refresh Alerts</button>
      </div>
    </div>
  )
}
