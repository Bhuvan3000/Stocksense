const express = require('express');
const { body, validationResult } = require('express-validator');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/orders?page=1&limit=20&type=&status=&search=
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;

    const filter = {};
    if (type)   filter.type   = type;
    if (status) filter.status = status;
    if (search) filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { counterparty: { $regex: search, $options: 'i' } },
    ];

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name sku sellingPrice')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name sku sellingPrice costPrice')
      .populate('createdBy', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders
router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('type').isIn(['sale', 'purchase']).withMessage('Type must be sale or purchase'),
    body('counterparty').notEmpty().withMessage('Customer/Supplier name required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { type, counterparty, items, notes, tax = 0 } = req.body;

      // Validate products and build enriched items
      const enrichedItems = [];
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) return res.status(404).json({ success: false, message: `Product ${item.product} not found` });

        // For sales: check stock availability
        if (type === 'sale' && product.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`,
          });
        }

        const unitPrice = type === 'sale' ? product.sellingPrice : product.costPrice;
        enrichedItems.push({
          product:     product._id,
          productName: product.name,
          sku:         product.sku,
          quantity:    item.quantity,
          unitPrice,
          subtotal:    +(unitPrice * item.quantity).toFixed(2),
        });
      }

      const subtotal = +enrichedItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2);
      const total    = +(subtotal + tax).toFixed(2);

      const order = await Order.create({
        type, counterparty, items: enrichedItems,
        subtotal, tax, total, notes,
        createdBy: req.user._id,
      });

      res.status(201).json({ success: true, data: order });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// PATCH /api/orders/:id/status
router.patch('/:id/status', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'completed') return res.status(400).json({ success: false, message: 'Completed orders cannot be changed' });

    const wasCompleted = order.status !== 'completed' && status === 'completed';

    // Update stock when completing
    if (wasCompleted) {
      for (const item of order.items) {
        const delta = order.type === 'sale' ? -item.quantity : +item.quantity;
        const product = await Product.findById(item.product);
        if (!product) continue;
        if (order.type === 'sale' && product.quantity + delta < 0) {
          return res.status(400).json({ success: false, message: `Insufficient stock for "${product.name}"` });
        }
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: delta } });
      }
    }

    order.status = status;
    if (wasCompleted) order.completedAt = new Date();
    await order.save();

    res.json({ success: true, data: order, message: `Order marked as ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/:id  (only pending orders)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'completed') return res.status(400).json({ success: false, message: 'Cannot delete a completed order' });
    await order.deleteOne();
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
