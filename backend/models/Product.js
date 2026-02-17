const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name:     { type: String, required: [true, 'Product name is required'], trim: true },
    sku:      { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true },
    category: {
  type: String,
  required: true,
  enum: [
    'Electronics',
    'Stationery',
    'Furniture',
    'Clothing',
    'Food & Beverage',
    'Accessories',
    'Storage',
    'Office',
    'Other'
  ],
  default: 'Other'
},

    description: { type: String, default: '' },

    quantity:    { type: Number, required: true, min: 0, default: 0 },
    minStock:    { type: Number, required: true, min: 0, default: 5 },
    unit:        { type: String, default: 'pcs' },

    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice:    { type: Number, required: true, min: 0 },

    supplier: { type: String, default: '' },
    location: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: stock status
ProductSchema.virtual('stockStatus').get(function () {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.minStock) return 'low_stock';
  return 'in_stock';
});

// Virtual: profit margin %
ProductSchema.virtual('margin').get(function () {
  if (!this.sellingPrice) return 0;
  return +((this.sellingPrice - this.costPrice) / this.sellingPrice * 100).toFixed(2);
});

// Virtual: total stock value at cost
ProductSchema.virtual('stockValue').get(function () {
  return +(this.quantity * this.costPrice).toFixed(2);
});

// Index for fast search
ProductSchema.index({ name: 'text', sku: 'text', supplier: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
