import { useState, useEffect } from 'react'
import api from '../utils/api'

const CAT_COLORS = { Electronics: '#4F7CFF', Stationery: '#2ECC71', Furniture: '#9B59B6', Clothing: '#E74C3C', 'Food & Beverage': '#F39C12', Other: '#8B91A6' }

export default function Reports() {
  const [stats,      setStats]      = useState(null)
  const [categories, setCategories] = useState([])
  const [topProducts,setTopProducts]= useState([])
  const [products,   setProducts]   = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/category-breakdown'),
      api.get('/dashboard/top-products?limit=8'),
      api.get('/products?limit=200'),
    ]).then(([s, c, tp, p]) => {
      setStats(s.data.data)
      setCategories(c.data.data)
      setTopProducts(tp.data.data)
      setProducts(p.data.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-wrap"><div className="spinner"/><span>Loading reports…</span></div>
  if (!stats)  return <div className="error-msg">Failed to load reports.</div>

  const totalCatRevenue = categories.reduce((s, c) => s + c.totalValue, 0) || 1

  return (
    <div>
      {/* KPI ROW */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value green">${stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-sub">completed sales</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value blue">${stats.grossProfit.toLocaleString()}</div>
          <div className="stat-sub">revenue − COGS</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Inventory (Cost)</div>
          <div className="stat-value yellow">${stats.inventoryValue.toLocaleString()}</div>
          <div className="stat-sub">current stock value</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Total Spend</div>
          <div className="stat-value red">${stats.totalSpend.toLocaleString()}</div>
          <div className="stat-sub">on purchases</div>
        </div>
      </div>

      <div className="two-col">
        {/* CATEGORY BREAKDOWN */}
        <div className="card">
          <div className="section-title">Inventory Value by Category</div>
          {categories.length === 0
            ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No data</div>
            : categories.map(c => {
              const pct = (c.totalValue / totalCatRevenue * 100).toFixed(0)
              return (
                <div key={c._id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>
                      <span className="cat-dot" style={{ background: CAT_COLORS[c._id] || '#fff' }} />
                      {c._id} <span style={{ color: 'var(--text3)', fontSize: 11 }}>({c.products} products)</span>
                    </span>
                    <span className="mono" style={{ color: CAT_COLORS[c._id] || 'var(--text)' }}>${c.totalValue.toFixed(0)} ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: CAT_COLORS[c._id] || 'var(--accent)' }} />
                  </div>
                </div>
              )
            })}
        </div>

        {/* TOP SELLERS */}
        <div className="card">
          <div className="section-title">Best Selling Products <span>by units sold</span></div>
          {topProducts.length === 0
            ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No sales data yet</div>
            : topProducts.map((p, i) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text3)', width: 20 }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.productName}</div>
                  <div className="sku">{p.sku}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent2)' }}>{p.totalSold}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>${p.totalRevenue.toFixed(2)}</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* FULL INVENTORY VALUATION */}
      <div className="card">
        <div className="section-title">Full Inventory Valuation <span>{products.length} products</span></div>
        <div className="table-wrap" style={{ border: 'none', marginTop: 0 }}>
          <table>
            <thead>
              <tr><th>Product</th><th>Category</th><th>Qty</th><th>Cost/Unit</th><th>Retail/Unit</th><th>Stock Value</th><th>Retail Value</th><th>Margin</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div className="sku">{p.sku}</div>
                  </td>
                  <td>
                    <span className="cat-dot" style={{ background: CAT_COLORS[p.category] || '#fff' }} />
                    {p.category}
                  </td>
                  <td className="mono" style={{ fontWeight: 600 }}>{p.quantity}</td>
                  <td className="mono" style={{ color: 'var(--text3)' }}>${p.costPrice.toFixed(2)}</td>
                  <td className="mono">${p.sellingPrice.toFixed(2)}</td>
                  <td className="mono">${(p.quantity * p.costPrice).toFixed(2)}</td>
                  <td className="mono" style={{ color: 'var(--accent2)', fontWeight: 600 }}>${(p.quantity * p.sellingPrice).toFixed(2)}</td>
                  <td><span className={`badge badge-${p.margin >= 40 ? 'green' : p.margin >= 20 ? 'yellow' : 'red'}`}>{p.margin}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
