import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import Icon from '../components/Icon'
import { useNotify } from '../context/NotifyContext'

const CAT_COLORS = { Electronics: '#4F7CFF', Stationery: '#2ECC71', Furniture: '#9B59B6', Clothing: '#E74C3C', 'Food & Beverage': '#F39C12', Other: '#8B91A6' }
const CATEGORIES = ['Electronics', 'Stationery', 'Furniture', 'Clothing', 'Food & Beverage', 'Other']
const EMPTY_FORM  = { name: '', sku: '', category: 'Electronics', description: '', quantity: '', minStock: '', sellingPrice: '', costPrice: '', supplier: '', location: '', unit: 'pcs' }

const statusBadge = (p) => {
  if (p.quantity === 0)              return ['badge-red',    'Out of Stock']
  if (p.quantity <= p.minStock)      return ['badge-yellow', 'Low Stock']
  return                                    ['badge-green',  'In Stock']
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [stats,    setStats]    = useState({})
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('All')
  const [modal,    setModal]    = useState(null)  // null | 'add' | 'edit'
  const [editing,  setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const notify = useNotify()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 100 })
      if (filter !== 'All') params.set('category', filter)
      if (search) params.set('search', search)
      const { data } = await api.get(`/products?${params}`)
      setProducts(data.data)
      setStats(data.stats)
    } catch (e) {
      notify('Failed to load products', 'error')
    } finally { setLoading(false) }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [search])

  const openAdd  = () => { setForm(EMPTY_FORM); setError(''); setModal('add') }
  const openEdit = (p) => {
    setForm({ ...p, quantity: String(p.quantity), minStock: String(p.minStock), sellingPrice: String(p.sellingPrice), costPrice: String(p.costPrice) })
    setEditing(p); setError(''); setModal('edit')
  }

  const save = async () => {
    if (!form.name || !form.sku || form.quantity === '') { setError('Name, SKU and quantity are required'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form, quantity: +form.quantity, minStock: +form.minStock, sellingPrice: +form.sellingPrice, costPrice: +form.costPrice }
      if (modal === 'add') {
        await api.post('/products', payload)
        notify(`"${form.name}" added to inventory`)
      } else {
        await api.put(`/products/${editing._id}`, payload)
        notify(`"${form.name}" updated`)
      }
      setModal(null); load()
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.errors?.[0]?.msg || 'Save failed')
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    try {
      await api.delete(`/products/${deleting._id}`)
      notify(`"${deleting.name}" deleted`, 'info')
      setDeleting(null); load()
    } catch (e) {
      notify(e.response?.data?.message || 'Delete failed', 'error')
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      {/* MINI STATS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Products', value: stats.total || 0, cls: 'blue' },
          { label: 'In Stock',       value: stats.inStock || 0, cls: 'green' },
          { label: 'Low Stock',      value: stats.lowStock || 0, cls: 'yellow' },
          { label: 'Out of Stock',   value: stats.outOfStock || 0, cls: 'red' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div className="filter-bar">
          {['All', ...CATEGORIES].map(c => (
            <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="search-box">
            <Icon name="search" size={14} />
            <input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" size={14} /> Add Product</button>
        </div>
      </div>

      {/* TABLE */}
      {loading
        ? <div className="loading-wrap"><div className="spinner"/></div>
        : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Category</th><th>Qty</th><th>Min</th><th>Sell Price</th><th>Cost</th><th>Margin</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.length === 0
                  ? <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No products found</td></tr>
                  : products.map(p => {
                    const [cls, label] = statusBadge(p)
                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.supplier} · {p.location}</div>
                        </td>
                        <td><span className="sku">{p.sku}</span></td>
                        <td>
                          <span className="cat-dot" style={{ background: CAT_COLORS[p.category] || '#fff' }} />
                          {p.category}
                        </td>
                        <td className="mono" style={{ fontWeight: 600 }}>{p.quantity}</td>
                        <td className="mono" style={{ color: 'var(--text3)' }}>{p.minStock}</td>
                        <td className="mono">${p.sellingPrice.toFixed(2)}</td>
                        <td className="mono" style={{ color: 'var(--text3)' }}>${p.costPrice.toFixed(2)}</td>
                        <td><span className={`badge badge-${p.margin >= 40 ? 'green' : p.margin >= 20 ? 'yellow' : 'red'}`}>{p.margin}%</span></td>
                        <td><span className={`badge ${cls}`}>{label}</span></td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Icon name="edit" size={12} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleting(p)}><Icon name="trash" size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}

      {/* ADD / EDIT MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h2>{modal === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-grid">
              <div className="form-group full"><label>Product Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Wireless Mouse" /></div>
              <div className="form-group"><label>SKU *</label><input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. WM-001" /></div>
              <div className="form-group"><label>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <div className="form-group"><label>Quantity *</label><input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></div>
              <div className="form-group"><label>Min Stock Level</label><input type="number" min="0" value={form.minStock} onChange={e => set('minStock', e.target.value)} /></div>
              <div className="form-group"><label>Selling Price ($) *</label><input type="number" step="0.01" min="0" value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} /></div>
              <div className="form-group"><label>Cost Price ($) *</label><input type="number" step="0.01" min="0" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} /></div>
              <div className="form-group"><label>Supplier</label><input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Supplier name" /></div>
              <div className="form-group"><label>Location</label><input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. A1-B2" /></div>
              <div className="form-group"><label>Unit</label><input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="pcs, kg, etc." /></div>
              <div className="form-group full"><label>Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional product description" rows={2} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}><Icon name="check" size={14} />{saving ? 'Saving…' : modal === 'add' ? 'Add Product' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleting && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleting(null)}>
          <div className="modal" style={{ width: 380 }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <h2 style={{ textAlign: 'center' }}>Delete Product?</h2>
            <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14, margin: '8px 0 4px' }}>Remove <strong>"{deleting.name}"</strong> from inventory?</p>
            <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>This action cannot be undone.</p>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}><Icon name="trash" size={14} />Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
