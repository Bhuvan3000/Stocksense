/**
 * Seed script — populates MongoDB with demo data
 * Run: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');

const PRODUCTS = [
  { name: 'Wireless Keyboard',  sku: 'WK-001', category: 'Electronics', quantity: 45, minStock: 10, sellingPrice: 79.99, costPrice: 40.00, supplier: 'TechCorp',        location: 'A1-B2' },
  { name: 'USB-C Hub',          sku: 'UC-002', category: 'Electronics', quantity: 8,  minStock: 15, sellingPrice: 49.99, costPrice: 22.00, supplier: 'TechCorp',        location: 'A1-C3' },
  { name: 'Mechanical Pencils', sku: 'MP-003', category: 'Stationery',  quantity: 200,minStock: 50, sellingPrice: 3.99,  costPrice: 1.20,  supplier: 'OfficeSupply Co', location: 'B2-A1' },
  { name: 'Ergonomic Chair',    sku: 'EC-004', category: 'Furniture',   quantity: 5,  minStock: 3,  sellingPrice: 349.99,costPrice: 180.00,supplier: 'FurniturePlus',   location: 'C3-D4' },
  { name: 'Monitor Stand',      sku: 'MS-005', category: 'Electronics', quantity: 0,  minStock: 5,  sellingPrice: 89.99, costPrice: 38.00, supplier: 'TechCorp',        location: 'A2-B1' },
  { name: 'Sticky Notes (Pack)',sku: 'SN-006', category: 'Stationery',  quantity: 500,minStock: 100,sellingPrice: 2.49,  costPrice: 0.80,  supplier: 'OfficeSupply Co', location: 'B1-A3' },
  { name: 'LED Desk Lamp',      sku: 'DL-007', category: 'Electronics', quantity: 22, minStock: 8,  sellingPrice: 59.99, costPrice: 25.00, supplier: 'LightingWorld',   location: 'A3-C1' },
  { name: 'Filing Cabinet',     sku: 'FC-008', category: 'Furniture',   quantity: 3,  minStock: 2,  sellingPrice: 199.99,costPrice: 95.00, supplier: 'FurniturePlus',   location: 'D1-E2' },
  { name: 'Wireless Mouse', sku: 'WM-009', category: 'Electronics', quantity: 60, minStock: 15, sellingPrice: 29.99, costPrice: 12.00, supplier: 'TechCorp', location: 'A4-B2' },
{ name: 'Gaming Headset', sku: 'GH-010', category: 'Electronics', quantity: 18, minStock: 10, sellingPrice: 89.99, costPrice: 45.00, supplier: 'SoundMax', location: 'A5-C1' },
{ name: 'Laptop Sleeve', sku: 'LS-011', category: 'Accessories', quantity: 75, minStock: 20, sellingPrice: 19.99, costPrice: 7.00, supplier: 'CarryPro', location: 'B3-A2' },
{ name: 'Notebook Pack', sku: 'NB-012', category: 'Stationery', quantity: 300, minStock: 80, sellingPrice: 6.99, costPrice: 2.00, supplier: 'OfficeSupply Co', location: 'B4-B1' },
{ name: 'Ball Pen Set', sku: 'BP-013', category: 'Stationery', quantity: 450, minStock: 120, sellingPrice: 4.49, costPrice: 1.50, supplier: 'OfficeSupply Co', location: 'B5-C3' },
{ name: 'Office Desk', sku: 'OD-014', category: 'Furniture', quantity: 7, minStock: 3, sellingPrice: 249.99, costPrice: 130.00, supplier: 'FurniturePlus', location: 'C4-D1' },
{ name: 'Bookshelf', sku: 'BS-015', category: 'Furniture', quantity: 10, minStock: 4, sellingPrice: 179.99, costPrice: 90.00, supplier: 'FurniturePlus', location: 'C5-E2' },
{ name: 'Webcam HD', sku: 'WC-016', category: 'Electronics', quantity: 35, minStock: 12, sellingPrice: 54.99, costPrice: 25.00, supplier: 'VisionTech', location: 'A6-A1' },
{ name: 'External HDD 1TB', sku: 'HD-017', category: 'Storage', quantity: 20, minStock: 8, sellingPrice: 99.99, costPrice: 60.00, supplier: 'DataStore', location: 'A7-B3' },
{ name: 'Portable SSD 512GB', sku: 'SD-018', category: 'Storage', quantity: 15, minStock: 6, sellingPrice: 129.99, costPrice: 75.00, supplier: 'DataStore', location: 'A8-C2' },
{ name: 'Whiteboard', sku: 'WB-019', category: 'Office', quantity: 12, minStock: 5, sellingPrice: 69.99, costPrice: 30.00, supplier: 'OfficeSupply Co', location: 'B6-D3' },
{ name: 'Printer Ink Cartridge', sku: 'IC-020', category: 'Office', quantity: 90, minStock: 25, sellingPrice: 24.99, costPrice: 10.00, supplier: 'PrintPro', location: 'B7-A4' },
{ name: 'Ethernet Cable 5m', sku: 'EC-021', category: 'Accessories', quantity: 140, minStock: 40, sellingPrice: 9.99, costPrice: 2.50, supplier: 'CableLink', location: 'A9-B5' },
{ name: 'Surge Protector', sku: 'SP-022', category: 'Electronics', quantity: 55, minStock: 18, sellingPrice: 34.99, costPrice: 14.00, supplier: 'PowerSafe', location: 'A10-C4' },
{ name: 'Desk Organizer', sku: 'DO-023', category: 'Office', quantity: 80, minStock: 20, sellingPrice: 14.99, costPrice: 5.00, supplier: 'OfficeSupply Co', location: 'B8-D2' },
{ name: 'Paper Ream A4', sku: 'PR-024', category: 'Stationery', quantity: 500, minStock: 150, sellingPrice: 5.99, costPrice: 2.00, supplier: 'PaperWorld', location: 'B9-E3' },
{ name: 'Bluetooth Speaker', sku: 'BS-025', category: 'Electronics', quantity: 28, minStock: 10, sellingPrice: 74.99, costPrice: 35.00, supplier: 'SoundMax', location: 'A11-A2' }

];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB Atlas');

  // Clear existing data
  await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany()]);
  console.log('🗑️   Cleared existing data');

  // Create admin user
  const admin = await User.create({ name: 'Admin User', email: 'admin@stocksense.com', password: 'admin123', role: 'admin' });
  console.log('👤  Admin user created  →  admin@stocksense.com / admin123');

  // Create products
  const products = await Product.insertMany(PRODUCTS.map(p => ({ ...p, createdBy: admin._id })));
  console.log(`📦  ${products.length} products created`);

  // Create sample orders
  const orders = [
    {
      type: 'sale', status: 'completed', counterparty: 'Acme Corp',
      items: [
        { product: products[0]._id, productName: products[0].name, sku: products[0].sku, quantity: 5, unitPrice: products[0].sellingPrice, subtotal: 5 * products[0].sellingPrice },
        { product: products[2]._id, productName: products[2].name, sku: products[2].sku, quantity: 20, unitPrice: products[2].sellingPrice, subtotal: 20 * products[2].sellingPrice },
      ],
    },
    {
      type: 'purchase', status: 'completed', counterparty: 'TechCorp',
      items: [
        { product: products[1]._id, productName: products[1].name, sku: products[1].sku, quantity: 30, unitPrice: products[1].costPrice, subtotal: 30 * products[1].costPrice },
        { product: products[4]._id, productName: products[4].name, sku: products[4].sku, quantity: 15, unitPrice: products[4].costPrice, subtotal: 15 * products[4].costPrice },
      ],
    },
    {
      type: 'sale', status: 'pending', counterparty: 'GlobalTech Ltd',
      items: [
        { product: products[3]._id, productName: products[3].name, sku: products[3].sku, quantity: 2, unitPrice: products[3].sellingPrice, subtotal: 2 * products[3].sellingPrice },
      ],
    },
    {
      type: 'sale', status: 'completed', counterparty: 'StartupHub',
      items: [
        { product: products[6]._id, productName: products[6].name, sku: products[6].sku, quantity: 4, unitPrice: products[6].sellingPrice, subtotal: 4 * products[6].sellingPrice },
        { product: products[2]._id, productName: products[2].name, sku: products[2].sku, quantity: 50, unitPrice: products[2].sellingPrice, subtotal: 50 * products[2].sellingPrice },
      ],
    },
  ];

  for (const o of orders) {
    const sub = +o.items.reduce((s, i) => s + i.subtotal, 0).toFixed(2);
    await Order.create({ ...o, subtotal: sub, tax: 0, total: sub, createdBy: admin._id });
  }
  console.log(`📋  ${orders.length} orders created`);

  console.log('\n🎉  Seed complete! You can now start the server.\n');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
