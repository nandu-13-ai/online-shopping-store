/**
 * NammaStore Express API Server
 * Provides RESTful endpoints backed by PostgreSQL, Kafka, and OpenSearch,
 * coupon validation, and serves the frontend application.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Auto-create .env from .env.example if missing (e.g. after fresh git clone)
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('📄 Automatically created .env from .env.example');
  } catch {}
}
require('dotenv').config({ path: envPath });

// Fallback environment variables so app runs out of the box anywhere
process.env.PORT = process.env.PORT || '3000';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://namma:nammastore_dev@127.0.0.1:5433/nammastore';
process.env.KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'localhost:29092';
process.env.OPENSEARCH_NODE = process.env.OPENSEARCH_NODE || 'http://localhost:9200';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'nammastore-local-dev-secret';

const { startPlatform, registerRoutes } = require('./services/platform');
const { ensureDockerServices } = require('./services/dockerManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Register PostgreSQL, Kafka, and OpenSearch REST routes
registerRoutes(app);

// Coupons database
const COUPONS = {
  'NAMMA20': { discount: 0.20, type: 'percent', label: '20% Off Your Entire Order', minSpend: 1000 },
  'FIRSTBUY': { discount: 500, type: 'fixed', label: '₹500 Flat Off on First Order', minSpend: 2500 },
  'FESTIVE': { discount: 0.15, type: 'percent', label: '15% Off Festive Season Discount', minSpend: 1500 },
  'FREESHIP': { discount: 0, type: 'free_shipping', label: 'Free Express Shipping', minSpend: 500 }
};

// API: Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    store: 'NammaStore API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API: Validate Coupon
app.post('/api/coupons/validate', (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const normalized = (code || '').trim().toUpperCase();
  const coupon = COUPONS[normalized];

  if (!coupon) {
    return res.status(400).json({ valid: false, message: 'Invalid coupon code.' });
  }

  if (subtotal < coupon.minSpend) {
    return res.status(400).json({
      valid: false,
      message: `Minimum spend of ₹${coupon.minSpend} required.`
    });
  }

  let discountAmount = 0;
  if (coupon.type === 'percent') {
    discountAmount = Math.round(subtotal * coupon.discount);
  } else if (coupon.type === 'fixed') {
    discountAmount = Math.min(coupon.discount, subtotal);
  }

  res.json({
    valid: true,
    code: normalized,
    discountAmount,
    label: coupon.label
  });
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error('Request failed:', error);
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : 'NammaStore service error.' });
});

// Serve frontend fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server & Services
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🌟 NammaStore server running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`==============================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n⚠️  Port ${PORT} is already in use by another running process.`);
      console.error(`👉 Close the previous terminal running NammaStore, or kill the process on port ${PORT}.\n`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });

  (async () => {
    // 1. Automatically check & bring up Docker Compose services if Docker is installed
    try {
      await ensureDockerServices();
    } catch (dockerErr) {
      console.warn('Docker startup check notice:', dockerErr.message);
    }

    // 2. Connect platform services (PostgreSQL, Kafka, OpenSearch)
    try {
      await startPlatform(app);
      console.log(`✅ All 3 services connected: PostgreSQL, Kafka, and OpenSearch are active!\n`);
    } catch (error) {
      console.warn(`⚠️  Background services (PostgreSQL/Kafka/OpenSearch) not ready: ${error.message}`);
      console.warn(`👉 To activate database & search: Open Docker Desktop and run: docker compose up -d`);
      console.warn(`🌐 Website is still fully browsable in preview mode at http://localhost:${PORT}\n`);
    }
  })();
}

module.exports = app;
