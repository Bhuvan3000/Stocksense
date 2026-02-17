import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import Icon from '../components/Icon'
import { useNotify } from '../context/NotifyContext'

export default function Orders() {
  const [orders,   setOrders]   = useState([])
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(false)
  const [viewOrder,setViewOrder]= useState(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [form,     setForm]     = useState({ type: 'sale', counterparty: '', notes: '', tax: 0, items: [{ product: '', quantity: 1 }] })
  const notify = useNotify()

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 100 })
      if (tab !== 'all' && ['sale', 'purchase'].includes(tab)) params.set('type', tab)
      if (tab === 'pending' || tab === 'completed') params.set('status', tab)
      if (search) params.set('search', search)
      const { data } = await api.get(`/orders?${params}`)
      setOrders(data.data)
    } catch { notify('Failed to load orders', 'error') }
    finally  { setLoading(false) }
  }, [tab, search])

  useEffect(() => { loadOrders() }, [loadOrders])
  useEffect(() => {
    api.get('/products?limit=200').then(r => setProducts(r.data.data)).catch(() => {})
  }, [])

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { product: '', quantity: 1 }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, k, v) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }))

  const calcTotal = () => form.items.reduce((s, it) => {
    const p = products.find(x => x._id === it.product)
    return s + (p ? (form.type === 'sale' ? p.sellingPrice : p.costPrice) * (+it.quantity || 0) : 0)
  }, 0)

  const submitOrder = async () => {
    if (!form.counterparty) { setError('Customer/supplier name required'); return }
    const validItems = form.items.filter(it => it.product && it.quantity > 0)
    if (!validItems.length) { setError('Add at least one item'); return }
    setSaving(true); setError('')
    try {
      await api.post('/orders', { ...form, items: validItems.map(it => ({ product: it.product, quantity: +it.quantity })), tax: +form.tax })
      notify('Order created successfully')
      setModal(false)
      setForm({ type: 'sale', counterparty: '', notes: '', tax: 0, items: [{ product: '', quantity: 1 }] })
      loadOrders()
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.errors?.[0]?.msg || 'Failed to create order')
    } finally { setSaving(false) }
  }

  const markStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      notify(`Order marked as ${status}`)
      loadOrders()
    } catch (e) {
      notify(e.response?.data?.message || 'Failed to update order', 'error')
    }
  }

  const deleteOrder = async (orderId) => {
    try {
      await api.delete(`/orders/${orderId}`)
      notify('Order deleted', 'info')
      loadOrders()
    } catch (e) {
      notify(e.response?.data?.message || 'Cannot delete order', 'error')
    }
  }

  return (
    <div>
      {/* TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div className="tab-bar" style={{ maxWidth: 420 }}>
          {['all', 'sale', 'purchase', 'pending', 'completed'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="search-box">
            <Icon name="search" size={14} />
            <input placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setError(''); setModal(true) }}><Icon name="plus" size={14} /> New Order</button>
        </div>
      </div>

      {loading
        ? <div className="loading-wrap"><div className="spinner"/></div>
        : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order #</th><th>Type</th><th>Date</th><th>Customer / Supplier</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {orders.length === 0
                  ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No orders found</td></tr>
                  : orders.map(o => (
                    <tr key={o._id}>
                      <td><span className="mono" style={{ fontSize: 12, color: 'var(--accent2)' }}>{o.orderNumber}</span></td>
                      <td><span className={`badge badge-${o.type === 'sale' ? 'blue' : 'purple'}`}>{o.type}</span></td>
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>{o.counterparty}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</td>
                      <td><span className={`badge badge-${o.status === 'completed' ? 'green' : o.status === 'cancelled' ? 'red' : 'yellow'}`}>{o.status}</span></td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setViewOrder(o)}>View</button>
                          {o.status === 'pending' && <>
                            <button className="btn btn-primary btn-sm" onClick={() => markStatus(o._id, 'completed')}><Icon name="check" size={12} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteOrder(o._id)}><Icon name="trash" size={12} /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

      {/* NEW ORDER MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <h2>Create New Order</h2>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label>Order Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="sale">Sale (outgoing)</option>
                  <option value="purchase">Purchase (incoming)</option>
                </select>
              </div>
              <div className="form-group">
                <label>{form.type === 'sale' ? 'Customer' : 'Supplier'} *</label>
                <input value={form.counterparty} onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))} placeholder={form.type === 'sale' ? 'Customer name' : 'Supplier name'} />
              </div>
            </div>

            <div style={{ margin: '16px 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Order Items</div>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select style={{ flex: 2 }} value={item.product} onChange={e => updateItem(i, 'product', e.target.value)}>
                  <option value="">Select product…</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku}) — {p.quantity} in stock</option>)}
                </select>
                <input type="number" min="1" style={{ width: 80 }} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="Qty" />
                {form.items.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeItem(i)}><Icon name="close" size={12} /></button>}
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginBottom: 12 }}><Icon name="plus" size={12} /> Add Item</button>

            <div style={{ display: 'flex', gap: 8 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Tax ($)</label>
                <input type="number" step="0.01" min="0" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, fontSize: 14, display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ color: 'var(--text2)' }}>Estimated Total</span>
              <strong className="mono" style={{ color: 'var(--accent2)' }}>${(calcTotal() + +form.tax).toFixed(2)}</strong>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitOrder} disabled={saving}>{saving ? 'Creating…' : 'Create Order'}</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ORDER MODAL */}
      {viewOrder && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewOrder(null)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <h2 style={{ fontFamily: 'DM Mono, monospace', fontSize: 18 }}>{viewOrder.orderNumber}</h2>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>{new Date(viewOrder.createdAt).toLocaleString()} · {viewOrder.counterparty}</div>
              </div>
              <span className={`badge badge-${viewOrder.status === 'completed' ? 'green' : viewOrder.status === 'cancelled' ? 'red' : 'yellow'}`}>{viewOrder.status}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {viewOrder.items.map((it, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{it.productName}</div>
                        <div className="sku">{it.sku}</div>
                      </td>
                      <td className="mono">{it.quantity}</td>
                      <td className="mono">${it.unitPrice.toFixed(2)}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>${it.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>
                <span>Subtotal</span><span className="mono">${viewOrder.subtotal.toFixed(2)}</span>
              </div>
              {viewOrder.tax > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>
                <span>Tax</span><span className="mono">${viewOrder.tax.toFixed(2)}</span>
              </div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <span>Total</span><span className="mono" style={{ color: 'var(--accent2)' }}>${viewOrder.total.toFixed(2)}</span>
              </div>
            </div>
            {viewOrder.notes && <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, fontSize: 13, color: 'var(--text2)' }}>📝 {viewOrder.notes}</div>}
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setViewOrder(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
