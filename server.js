const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbHelper = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'veloce-tech-secret-key-2026';

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid or expired' });
    }
    req.user = user;
    next();
  });
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  try {
    // Check if user already exists
    const existingUser = await dbHelper.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const result = await dbHelper.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const token = jwt.sign({ id: result.id, username, email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: result.id, username, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    // Find user
    const user = await dbHelper.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbHelper.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching user details' });
  }
});

// ==========================================
// PRODUCT ENDPOINTS
// ==========================================

// Get all products
app.get('/api/products', async (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM products';
  const params = [];

  const conditions = [];
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  try {
    const products = await dbHelper.all(sql, params);
    res.json({ products });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await dbHelper.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    res.status(500).json({ error: 'Server error fetching product details' });
  }
});

// ==========================================
// ORDER ENDPOINTS
// ==========================================

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
    return res.status(400).json({ error: 'Missing items or shipping address' });
  }

  try {
    // We'll calculate total amount and validate stock in a simulated transaction
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await dbHelper.get('SELECT * FROM products WHERE id = ?', [item.id]);

      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item.id} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      const itemCost = product.price * item.quantity;
      totalAmount += itemCost;
      validatedItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
        new_stock: product.stock - item.quantity
      });
    }

    // Insert order record
    const orderResult = await dbHelper.run(
      'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)',
      [req.user.id, totalAmount, shippingAddress, 'Processing']
    );
    const orderId = orderResult.id;

    // Deduct stock and insert order items
    for (const item of validatedItems) {
      // Deduct stock
      await dbHelper.run('UPDATE products SET stock = ? WHERE id = ?', [item.new_stock, item.product_id]);
      
      // Insert item
      await dbHelper.run(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    res.status(201).json({
      message: 'Order placed successfully',
      orderId,
      totalAmount
    });

  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({ error: 'Server error processing your order' });
  }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await dbHelper.all(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Fetch items for each order
    for (const order of orders) {
      order.items = await dbHelper.all(
        `SELECT oi.quantity, oi.price, p.name, p.image_url 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
    }

    res.json({ orders });
  } catch (error) {
    console.error('Fetch user orders error:', error);
    res.status(500).json({ error: 'Server error retrieving orders' });
  }
});

// Default route for SPA-like index fallback (if we use html5 routing, but we use hash/simple routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database then start server if not running in serverless environment
if (!process.env.VERCEL) {
  dbHelper.initDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`==================================================`);
        console.log(` Veloce Tech backend listening on port ${PORT}`);
        console.log(` Local URL: http://localhost:${PORT}`);
        console.log(`==================================================`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database, shutting down:', err);
      process.exit(1);
    });
} else {
  // On Vercel (serverless), invoke DB schema initialization on start
  dbHelper.initDB().catch(err => {
    console.error('Vercel Database Schema Init failed:', err);
  });
}

module.exports = app;

