const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect); // All product routes require auth

// GET /api/products?page=1&limit=20&category=&search=&status=
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, status, sortBy = 'createdAt', sortDir = 'desc' } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search)   filter.$text = { $search: search };
    if (status === 'low_stock')    filter.$where = 'this.quantity > 0 && this.quantity <= this.minStock';
    if (status === 'out_of_stock') filter.quantity = 0;

    // Use aggregation for virtual stock status filter
    let query = Product.find(filter)
      .sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const [products, total] = await Promise.all([query, Product.countDocuments(filter)]);

    // Summary stats
    const allProducts = await Product.find();
    const stats = {
      total: allProducts.length,
      inStock:    allProducts.filter(p => p.quantity > p.minStock).length,
      lowStock:   allProducts.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length,
      outOfStock: allProducts.filter(p => p.quantity === 0).length,
      totalValue: +allProducts.reduce((s, p) => s + p.quantity * p.costPrice, 0).toFixed(2),
    };

    res.json({
      success: true,
      data: products,
      pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) },
      stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('name').notEmpty().withMessage('Product name required'),
    body('sku').notEmpty().withMessage('SKU required'),
    body('sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price required'),
    body('costPrice').isFloat({ min: 0 }).withMessage('Valid cost price required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or more'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    try {
      const product = await Product.create({ ...req.body, createdBy: req.user._id });
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      if (err.code === 11000) return res.status(400).json({ success: false, message: 'SKU already exists' });
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// PUT /api/products/:id
router.put('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/products/:id/adjust-stock
router.patch('/:id/adjust-stock', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    if (typeof adjustment !== 'number') return res.status(400).json({ success: false, message: 'Adjustment must be a number' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const newQty = product.quantity + adjustment;
    if (newQty < 0) return res.status(400).json({ success: false, message: 'Adjustment would result in negative stock' });
    product.quantity = newQty;
    await product.save();
    res.json({ success: true, data: product, message: `Stock adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
