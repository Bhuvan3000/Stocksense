const express = require('express');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [products, orders] = await Promise.all([Product.find(), Order.find()]);

    const completedSales     = orders.filter(o => o.type === 'sale'     && o.status === 'completed');
    const completedPurchases = orders.filter(o => o.type === 'purchase' && o.status === 'completed');

    const totalRevenue   = completedSales.reduce((s, o) => s + o.total, 0);
    const totalSpend     = completedPurchases.reduce((s, o) => s + o.total, 0);
    const inventoryValue = products.reduce((s, p) => s + p.quantity * p.costPrice, 0);
    const lowStock       = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
    const outOfStock     = products.filter(p => p.quantity === 0).length;

    // Gross profit: revenue minus COGS
    let cogs = 0;
    completedSales.forEach(o => {
      o.items.forEach(item => {
        const product = products.find(p => p._id.equals(item.product));
        if (product) cogs += item.quantity * product.costPrice;
      });
    });

    res.json({
      success: true,
      data: {
        totalProducts:    products.length,
        inventoryValue:   +inventoryValue.toFixed(2),
        totalRevenue:     +totalRevenue.toFixed(2),
        grossProfit:      +(totalRevenue - cogs).toFixed(2),
        totalSpend:       +totalSpend.toFixed(2),
        pendingOrders:    orders.filter(o => o.status === 'pending').length,
        lowStockCount:    lowStock,
        outOfStockCount:  outOfStock,
        totalAlerts:      lowStock + outOfStock,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/sales-trend?days=7
router.get('/sales-trend', async (req, res) => {
  try {
    const days = Math.min(Math.max(+req.query.days || 7, 1), 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const salesByDay = await Order.aggregate([
      { $match: { type: 'sale', status: 'completed', createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders:  { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with 0
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = salesByDay.find(x => x._id === key);
      result.push({ date: key, revenue: found ? +found.revenue.toFixed(2) : 0, orders: found?.orders || 0 });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/category-breakdown
router.get('/category-breakdown', async (req, res) => {
  try {
    const breakdown = await Product.aggregate([
      { $group: {
        _id:        '$category',
        products:   { $sum: 1 },
        totalUnits: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
        avgMargin:  { $avg: { $cond: [{ $gt: ['$sellingPrice', 0] }, { $multiply: [{ $divide: [{ $subtract: ['$sellingPrice', '$costPrice'] }, '$sellingPrice'] }, 100] }, 0] } },
      }},
      { $sort: { totalValue: -1 } },
    ]);
    res.json({ success: true, data: breakdown });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/top-products?by=sales&limit=5
router.get('/top-products', async (req, res) => {
  try {
    const limit = Math.min(+req.query.limit || 5, 20);

    const topSellers = await Order.aggregate([
      { $match: { type: 'sale', status: 'completed' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' }, productName: { $first: '$items.productName' }, sku: { $first: '$items.sku' } } },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);

    res.json({ success: true, data: topSellers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/low-stock
router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find();
    const lowStock   = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock);
    const outOfStock = products.filter(p => p.quantity === 0);
    res.json({ success: true, data: { outOfStock, lowStock } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
