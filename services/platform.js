const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { Kafka, Partitioners } = require('kafkajs');
const { Client } = require('@opensearch-project/opensearch');

process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://namma:nammastore_dev@127.0.0.1:5433/nammastore' });
pool.on('error', error => console.error('PostgreSQL pool error:', error.message));

const kafka = new Kafka({ clientId: 'nammastore', brokers: (process.env.KAFKA_BROKERS || 'localhost:29092').split(',') });
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
const consumer = kafka.consumer({ groupId: 'nammastore-search-and-notifications' });
const search = new Client({ node: process.env.OPENSEARCH_NODE || 'http://localhost:9200' });
const INDEX = 'nammastore-products';
const TOPIC = 'nammastore.order-events';
const sessionSecret = process.env.SESSION_SECRET || 'local-prototype-session-secret-change-before-deployment';

function loadCatalog() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'products-data.js'), 'utf8');
  const context = {};
  vm.runInNewContext(`${source}\nglobalThis.__catalog = { products: PRODUCTS, categories: CATEGORIES, coupons: COUPONS };`, context);
  return context.__catalog;
}

function productDocument(row) {
  return { ...row.data, id: row.id, price: Number(row.price), originalPrice: Number(row.original_price), stockQuantity: row.stock_quantity, inStock: row.stock_quantity > 0, city: row.data.availableCities || ['Bengaluru', 'Chennai', 'Mumbai', 'Delhi'] };
}

async function ensureSearchIndex() {
  try {
    await search.indices.create({ index: INDEX, body: { mappings: { properties: {
      id: { type: 'keyword' }, name: { type: 'text' }, brand: { type: 'text' }, category: { type: 'keyword' },
      price: { type: 'double' }, city: { type: 'text', fields: { raw: { type: 'keyword' } } },
      stockQuantity: { type: 'integer' }, inStock: { type: 'boolean' }, description: { type: 'text' }
    } } } });
  } catch (error) {
    const type = error.meta?.body?.error?.type || error.body?.error?.type;
    if (type !== 'resource_already_exists_exception') throw error;
  }
}

async function indexProduct(row) {
  await search.index({ index: INDEX, id: row.id, body: productDocument(row), refresh: true });
}

async function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
  const { products } = loadCatalog();
  for (const product of products) {
    await pool.query(`INSERT INTO products (id,name,category,brand,price,original_price,stock_quantity,data)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, brand=EXCLUDED.brand,
        price=EXCLUDED.price, original_price=EXCLUDED.original_price, data=EXCLUDED.data, updated_at=now()`,
    [product.id, product.name, product.category, product.brand, product.price, product.originalPrice, product.stockQuantity, JSON.stringify(product)]);
  }
}

function signSession(customerId) {
  const payload = Buffer.from(JSON.stringify({ customerId, exp: Date.now() + 7 * 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

async function customerFromRequest(req) {
  const raw = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('namma_session='))?.slice('namma_session='.length);
  if (!raw) return null;
  try {
    const [payload, signature] = decodeURIComponent(raw).split('.');
    const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (session.exp < Date.now()) return null;
    const result = await pool.query('SELECT id, username, email, phone, created_at FROM customers WHERE id=$1', [session.customerId]);
    return result.rows[0] || null;
  } catch { return null; }
}

function setSession(res, token, age = 7 * 86400) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `namma_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure}`);
}

function addRoutes(app) {
  app.get('/api/health/services', async (req, res) => {
    const status = { postgres: false, kafka: kafkaConnected, opensearch: false };
    try { await pool.query('SELECT 1'); status.postgres = true; } catch {}
    try { await search.cluster.health(); status.opensearch = true; } catch {}
    res.status(Object.values(status).every(Boolean) ? 200 : 503).json({ status });
  });
  app.get('/api/products', async (req, res, next) => {
    try {
      const result = await pool.query('SELECT * FROM products ORDER BY id');
      res.json({ products: result.rows.map(productDocument) });
    } catch (error) { next(error); }
  });

  app.get('/api/search', async (req, res, next) => {
    try {
      const filters = [];
      if (req.query.category && req.query.category !== 'all') filters.push({ term: { category: req.query.category } });
      const range = {};
      if (req.query.minPrice) range.gte = Number(req.query.minPrice);
      if (req.query.maxPrice) range.lte = Number(req.query.maxPrice);
      if (Object.keys(range).length) filters.push({ range: { price: range } });
      if (req.query.city) filters.push({ match: { city: { query: req.query.city, fuzziness: 'AUTO' } } });
      const query = String(req.query.q || '').trim();
      const response = await search.search({ index: INDEX, body: { size: 100, query: { bool: {
        must: query ? [{ multi_match: { query, fields: ['name^4', 'brand^2', 'description'], fuzziness: 'AUTO', type: 'best_fields' } }] : [{ match_all: {} }],
        filter: filters
      } } } });
      const hits = response.body?.hits?.hits || response.hits?.hits || [];
      res.json({ products: hits.map(hit => hit._source), total: hits.length });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/prototype-login', async (req, res, next) => {
    try {
      const username = String(req.body.username || '').trim().slice(0, 80) || 'NammaStore Customer';
      const email = username.includes('@') ? username.toLowerCase() : null;
      const result = await pool.query(`INSERT INTO customers (username,email) VALUES ($1,$2)
        ON CONFLICT (username) DO UPDATE SET email=COALESCE(EXCLUDED.email,customers.email)
        RETURNING id,username,email,phone,created_at`, [username, email]);
      const customer = result.rows[0];
      setSession(res, signSession(customer.id));
      res.json({ customer: { id: customer.id, name: customer.username, email: customer.email || `${customer.username}@prototype.local`, phone: customer.phone } });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    req.body.username = req.body.username || req.body.email;
    const username = String(req.body.username || '').trim().slice(0, 80) || 'NammaStore Customer';
    try {
      const result = await pool.query(`INSERT INTO customers (username,email) VALUES ($1,$2)
        ON CONFLICT (username) DO UPDATE SET email=COALESCE(EXCLUDED.email,customers.email)
        RETURNING id,username,email,phone`, [username, username.includes('@') ? username.toLowerCase() : null]);
      const customer = result.rows[0];
      setSession(res, signSession(customer.id));
      res.json({ customer: { id: customer.id, name: customer.username, email: customer.email || `${customer.username}@prototype.local`, phone: customer.phone } });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/register', async (req, res, next) => {
    req.body.username = req.body.username || req.body.name || req.body.email;
    try {
      const username = String(req.body.username || '').trim().slice(0, 80) || 'NammaStore Customer';
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : (username.includes('@') ? username.toLowerCase() : null);
      const result = await pool.query(`INSERT INTO customers (username,email,phone) VALUES ($1,$2,$3)
        ON CONFLICT (username) DO UPDATE SET email=COALESCE(EXCLUDED.email,customers.email), phone=EXCLUDED.phone
        RETURNING id,username,email,phone`, [username, email, String(req.body.phone || '')]);
      const customer = result.rows[0];
      setSession(res, signSession(customer.id));
      res.status(201).json({ customer: { id: customer.id, name: customer.username, email: customer.email || `${customer.username}@prototype.local`, phone: customer.phone } });
    } catch (error) { next(error); }
  });

  app.get('/api/auth/me', async (req, res, next) => {
    try {
      const customer = await customerFromRequest(req);
      if (!customer) return res.status(401).json({ error: 'Not signed in.' });
      res.json({ customer: { id: customer.id, name: customer.username, email: customer.email, phone: customer.phone } });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/logout', (req, res) => {
    setSession(res, '', 0);
    res.json({ success: true });
  });

  app.get('/api/cart', async (req, res, next) => {
    try {
      const customer = await customerFromRequest(req);
      if (!customer) return res.status(401).json({ error: 'Sign in first.' });
      const result = await pool.query(`SELECT c.cart_item_id,c.product_id,c.quantity,c.options,p.data,p.price,p.original_price,p.stock_quantity
        FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.customer_id=$1`, [customer.id]);
      res.json({ items: result.rows.map(row => ({ ...row.data, ...row.options, cartItemId: row.cart_item_id, productId: row.product_id, quantity: row.quantity, price: Number(row.price), originalPrice: Number(row.original_price), image: row.data.images?.[0], maxStock: row.stock_quantity })) });
    } catch (error) { next(error); }
  });

  app.put('/api/cart', async (req, res, next) => {
    const client = await pool.connect();
    try {
      const customer = await customerFromRequest(req);
      if (!customer) return res.status(401).json({ error: 'Sign in first.' });
      const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : [];
      await client.query('BEGIN');
      await client.query('DELETE FROM cart_items WHERE customer_id=$1', [customer.id]);
      for (const item of items) {
        const quantity = Math.floor(Number(item.quantity));
        if (!item.productId || quantity < 1) continue;
        const saved = await client.query(`INSERT INTO cart_items (customer_id,cart_item_id,product_id,quantity,options)
          SELECT $1,$2,id,$4,$5::jsonb FROM products WHERE id=$3 AND stock_quantity >= $4
          ON CONFLICT (customer_id,cart_item_id) DO UPDATE SET quantity=EXCLUDED.quantity,options=EXCLUDED.options RETURNING cart_item_id`,
        [customer.id, String(item.cartItemId), String(item.productId), quantity, JSON.stringify({ selectedColor: item.selectedColor, selectedSize: item.selectedSize })]);
        if (!saved.rowCount) throw Object.assign(new Error(`Not enough available stock for ${item.name || 'an item'}.`), { status: 409 });
      }
      await client.query('COMMIT');
      res.json({ success: true, count: items.length });
    } catch (error) { await client.query('ROLLBACK'); next(error); }
    finally { client.release(); }
  });

  app.get('/api/orders', async (req, res, next) => {
    try {
      const customer = await customerFromRequest(req);
      if (!customer) return res.status(401).json({ error: 'Sign in first.' });
      const result = await pool.query('SELECT order_data FROM customer_orders WHERE customer_id=$1 ORDER BY created_at DESC', [customer.id]);
      res.json({ orders: result.rows.map(row => row.order_data) });
    } catch (error) { next(error); }
  });

  app.get('/api/notifications', async (req, res, next) => {
    try {
      const customer = await customerFromRequest(req);
      const result = customer
        ? await pool.query('SELECT order_id,message,created_at FROM customer_notifications WHERE customer_id=$1 ORDER BY created_at DESC', [customer.id])
        : await pool.query('SELECT order_id,message,created_at FROM customer_notifications WHERE customer_id IS NULL ORDER BY created_at DESC LIMIT 10');
      res.json({ notifications: result.rows });
    } catch (error) { next(error); }
  });

  app.post('/api/orders', async (req, res, next) => {
    const client = await pool.connect();
    try {
      const customer = await customerFromRequest(req);
      const items = Array.isArray(req.body.items) ? req.body.items : [];
      if (!items.length) return res.status(400).json({ error: 'Order must contain items.' });
      await client.query('BEGIN');
      const savedItems = [];
      let subtotal = 0;
      for (const item of items) {
        const quantity = Math.floor(Number(item.quantity));
        if (!Number.isInteger(quantity) || quantity < 1) throw Object.assign(new Error('Invalid item quantity.'), { status: 400 });
        const updated = await client.query(`UPDATE products SET stock_quantity=stock_quantity-$2, updated_at=now()
          WHERE id=$1 AND stock_quantity >= $2 RETURNING *`, [String(item.productId), quantity]);
        if (!updated.rowCount) throw Object.assign(new Error(`Not enough stock for ${item.name || 'an item'}.`), { status: 409 });
        const row = updated.rows[0];
        const product = productDocument(row);
        const price = Number(row.price);
        subtotal += price * quantity;
        savedItems.push({ productId: row.id, name: row.name, price, quantity, image: product.images?.[0], selectedSize: item.selectedSize || null, selectedColor: item.selectedColor || null });
        await client.query('INSERT INTO outbox_events(topic,event_key,payload) VALUES($1,$2,$3::jsonb)', [TOPIC, row.id, JSON.stringify({ type: 'inventory.changed', productId: row.id, remaining: row.stock_quantity, product: productDocument(row) })]);
      }
      const discount = Math.min(subtotal, Math.max(0, Number(req.body.discount) || 0));
      const shipping = Math.min(500, Math.max(0, Number(req.body.shippingCost) || (subtotal >= 999 ? 0 : 70)));
      const total = Math.max(0, subtotal - discount + shipping + Math.round(subtotal * 0.05));
      const order = { id: `NM-${crypto.randomInt(100000, 1000000)}`, date: new Date().toISOString(), status: 'Confirmed', items: savedItems, subtotal, discount, shippingCost: shipping, total, paymentMethod: String(req.body.paymentMethod || 'UPI'), shippingAddress: req.body.shippingAddress || {}, trackingNumber: `NMX-BLR-${crypto.randomInt(10000, 100000)}` };
      await client.query('INSERT INTO customer_orders(id,customer_id,status,total,order_data) VALUES($1,$2,$3,$4,$5::jsonb)', [order.id, customer?.id || null, order.status, total, JSON.stringify(order)]);
      await client.query('INSERT INTO outbox_events(topic,event_key,payload) VALUES($1,$2,$3::jsonb)', [TOPIC, order.id, JSON.stringify({ type: 'order.placed', order, customer: customer ? { id: customer.id, email: customer.email, username: customer.username } : null })]);
      if (customer) await client.query('DELETE FROM cart_items WHERE customer_id=$1', [customer.id]);
      await client.query('COMMIT');
      res.status(201).json({ success: true, order });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally { client.release(); }
  });

  app.get('/api/orders/:id', async (req, res, next) => {
    try {
      const result = await pool.query('SELECT order_data FROM customer_orders WHERE id=$1', [req.params.id]);
      if (!result.rowCount) return res.status(404).json({ error: 'Order not found.' });
      res.json(result.rows[0].order_data);
    } catch (error) { next(error); }
  });
}

async function publishOutbox() {
  const result = await pool.query('SELECT id,topic,event_key,payload FROM outbox_events WHERE published_at IS NULL ORDER BY id LIMIT 50');
  for (const event of result.rows) {
    await producer.send({ topic: event.topic, messages: [{ key: event.event_key, value: JSON.stringify({ eventId: event.id, ...event.payload }) }] });
    await pool.query('UPDATE outbox_events SET published_at=now() WHERE id=$1', [event.id]);
  }
}

async function ensureKafkaTopic() {
  const admin = kafka.admin();
  try {
    await admin.connect();
    const topics = await admin.listTopics();
    if (!topics.includes(TOPIC)) {
      await admin.createTopics({
        topics: [{ topic: TOPIC, numPartitions: 1, replicationFactor: 1 }],
        waitForLeaders: true
      });
      console.log(`Kafka topic "${TOPIC}" created successfully.`);
    }
  } catch (err) {
    console.warn('Kafka ensure topic notice:', err.message);
  } finally {
    try { await admin.disconnect(); } catch {}
  }
}

async function startPlatform(app) {
  await initializeDatabase();
  await ensureSearchIndex();
  const products = await pool.query('SELECT * FROM products');
  for (const row of products.rows) await indexProduct(row);
  await producer.connect();
  await ensureKafkaTopic();
  kafkaConnected = true;
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  await consumer.run({ eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());
    if (event.type === 'inventory.changed') {
      await indexProduct({ ...event.product, data: event.product, price: event.product.price, original_price: event.product.originalPrice, stock_quantity: event.remaining });
    } else if (event.type === 'order.placed') {
      await pool.query(`INSERT INTO customer_notifications(customer_id,order_id,message) VALUES($1,$2,$3)
        ON CONFLICT (order_id) DO NOTHING`, [event.customer?.id || null, event.order.id, `Your NammaStore order ${event.order.id} is confirmed.`]);
      console.log(`Kafka consumer processed order ${event.order.id} and recorded its customer confirmation.`);
    }
  } });
  const outboxTimer = setInterval(() => publishOutbox().catch(error => console.error('Kafka outbox publish failed:', error.message)), 1000);
  outboxTimer.unref();
  return { pool, producer, consumer, search };
}

let kafkaConnected = false;
module.exports = { startPlatform, registerRoutes: addRoutes, pool };
