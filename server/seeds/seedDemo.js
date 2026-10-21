// Usage: npm run seed:demo  – inserts clearly-labelled DEMO products and services (isDemo: true). Safe to re-run.
require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Service = require('../models/Service');

const products = [
  ['Wheat seed (certified, 10 kg)', 'seed', 650, 'bag', 120], ['Paddy seed (hybrid, 5 kg)', 'seed', 780, 'bag', 80], ['Tomato seed packet (10 g)', 'seed', 220, 'packet', 200],
  ['Urea (45 kg)', 'fertilizer', 270, 'bag', 150], ['DAP (50 kg)', 'fertilizer', 1350, 'bag', 90], ['Vermicompost (25 kg)', 'fertilizer', 300, 'bag', 60],
  ['Neem-based bio-pesticide (1 L)', 'pesticide', 420, 'bottle', 70], ['Garden sprayer 16 L', 'tool', 1600, 'piece', 25], ['Hand hoe (steel)', 'tool', 350, 'piece', 5],
  ['Drip irrigation kit (1 acre)', 'equipment', 9800, 'kit', 8], ['Soil pH test kit', 'tool', 450, 'kit', 40],
];
const services = [
  ['Tractor rental (with driver)', 'equipment-rental', 1200, 'per hour', 'Ploughing / tilling. Demo listing.'],
  ['Power sprayer rental', 'equipment-rental', 400, 'per day', 'Includes 16 L sprayer. Demo listing.'],
  ['Agronomy consultation (30 min)', 'consultation', 300, 'per session', 'Phone/video call with a (demo) agronomy advisor.'],
  ['Soil sample collection visit', 'other', 500, 'per visit', 'Collection for lab testing. Demo listing.'],
];
(async () => {
  await connectDB();
  for (const [name, category, price, unit, stock] of products)
    await Product.updateOne({ name }, { $setOnInsert: { name, category, price, unit, stock, isDemo: true, description: 'Demo listing for the capstone – not a real product.' } }, { upsert: true });
  for (const [name, category, price, priceUnit, description] of services)
    await Service.updateOne({ name }, { $setOnInsert: { name, category, price, priceUnit, description, isDemo: true, capacityPerSlot: 2 } }, { upsert: true });
  console.log(`Demo data ready: ${products.length} products, ${services.length} services.`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
