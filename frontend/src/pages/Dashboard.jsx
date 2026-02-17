import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Icon from '../components/Icon'

const CAT_COLORS = { Electronics: '#4F7CFF', Stationery: '#2ECC71', Furniture: '#9B59B6', Clothing: '#E74C3C', 'Food & Beverage': '#F39C12', Other: '#8B91A6' }

export default function Dashboard() {
  const [stats,      setStats]      = useState(null)
  const [trend,      setTrend]      = useState([])
  const [categories, setCategories] = useState([])
  const [topProducts,setTopProducts]= useState([])
  const [pendingOrders, setPending] = useState([])
  const [loading,    setLoading]    = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/sales-trend?days=7'),
      api.get('/dashboard/category-breakdown'),
      api.get('/dashboard/top-products?limit=5'),
      api.get('/orders?status=pending&limit=5'),
    ]).then(([s, t, c, tp, p]) => {
      setStats(s.data.data)
      setTrend(t.data.data)
      setCategories(c.data.data)
      setTopProducts(tp.data.data)
      setPending(p.data.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-wrap"><div className="spinner"/><span>Loading dashboard…</span></div>
  if (!stats)  return <div className="error-msg">Failed to load dashboard data.</div>

  const maxRevenue = Math.max(...trend.map(d => d.revenue), 1)

  return (
    <div>
      {/* KPI CARDS */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Products</div>
          <div className="stat-value blue">{stats.totalProducts}</div>
          <div className="stat-sub">{stats.totalAlerts} alerts active</div>
          <div className="stat-icon"><Icon name="inventory" size={42} /></div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Inventory Value</div>
          <div className="stat-value green">${stats.inventoryValue.toLocaleString()}</div>
          <div className="stat-sub">at cost price</div>
          <div className="stat-icon"><Icon name="reports" size={42} /></div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value yellow">${stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-sub">gross profit: ${stats.grossProfit.toLocaleString()}</div>
          <div className="stat-icon"><Icon name="arrow" size={42} /></div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Stock Alerts</div>
          <div className="stat-value red">{stats.totalAlerts}</div>
          <div className="stat-sub">{stats.outOfStockCount} out of stock</div>
          <div className="stat-icon"><Icon name="alerts" size={42} /></div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="three-col">
        {/* SALES TREND */}
        <div className="card">
          <div className="section-title">Sales Trend <span>Last 7 days</span></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, paddingTop: 16 }}>
            {trend.map(d => (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{ width: '100%', borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg, #4F7CFF, #6B4EFF)', minHeight: 4, height: `${(d.revenue / maxRevenue) * 100}%`, transition: 'height 0.5s ease' }}
                  title={`$${d.revenue.toFixed(2)}`}
                />
                <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{d.date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP PRODUCTS */}
        <div className="card">
          <div className="section-title">Top Sellers <span>by units</span></div>
          {topProducts.length === 0
            ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No sales yet</div>
            : topProducts.map((p, i) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text3)', width: 20 }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.productName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.sku}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--accent2)', fontWeight: 600 }}>{p.totalSold}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>sold</div>
                </div>
              </div>
            ))}
        </div>

        {/* PENDING ORDERS */}
        <div className="card">
          <div className="section-title">Pending Orders <span>{stats.pendingOrders} total</span></div>
          {pendingOrders.length === 0
            ? <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>All caught up ✓</div>
            : pendingOrders.map(o => (
              <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, fontFamily: 'DM Mono', fontSize: 12, color: 'var(--accent2)' }}>{o.orderNumber}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{o.counterparty}</div>
                </div>
                <div>
                  <span className={`badge badge-${o.type === 'sale' ? 'blue' : 'purple'}`}>{o.type}</span>
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--yellow)', marginTop: 3, fontFamily: 'DM Mono' }}>${o.total.toFixed(2)}</div>
                </div>
              </div>
            ))}
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => navigate('/orders')}>View All Orders</button>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN */}
      <div className="card">
        <div className="section-title">Category Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {categories.map(c => (
            <div key={c._id} style={{ padding: 16, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <span className="cat-dot" style={{ background: CAT_COLORS[c._id] || '#8B91A6' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{c._id}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: CAT_COLORS[c._id] || 'var(--text)', fontFamily: 'DM Mono', marginBottom: 4 }}>{c.products}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.totalUnits} units total</div>
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text2)' }}>${c.totalValue.toFixed(0)} value</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
