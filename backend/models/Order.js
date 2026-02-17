const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true }, // snapshot at time of order
  sku:       { type: String, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal:  { type: Number, required: true, min: 0 },
}, { _id: false });

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    type:        { type: String, required: true, enum: ['sale', 'purchase'] },
    status:      { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },

    counterparty: { type: String, required: [true, 'Customer/Supplier name is required'], trim: true },
    items:        { type: [OrderItemSchema], required: true, validate: v => v.length > 0 },

    subtotal: { type: Number, required: true },
    tax:      { type: Number, default: 0 },
    total:    { type: Number, required: true },

    notes:     { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-generate order number before save
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const prefix = this.type === 'sale' ? 'SAL' : 'PUR';
    this.orderNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// When order is completed, update stock
OrderSchema.post('findOneAndUpdate', async function (doc) {
  if (doc && doc.status === 'completed' && !doc.completedAt) {
    const Product = mongoose.model('Product');
    for (const item of doc.items) {
      const delta = doc.type === 'sale' ? -item.quantity : +item.quantity;
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: delta } });
    }
    await doc.updateOne({ completedAt: new Date() });
  }
});

module.exports = mongoose.model('Order', OrderSchema);
