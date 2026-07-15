const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('SQL Run Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('SQL Get Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('SQL All Error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function initDB() {
  console.log('Initializing SQLite Database at:', dbPath);

  // Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products Table
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER NOT NULL
    )
  `);

  // Orders Table
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      shipping_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Order Items Table
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )
  `);

  // Seed initial products if empty
  const count = await get('SELECT COUNT(*) as count FROM products');
  if (count.count === 0) {
    console.log('Seeding products database...');
    const seedProducts = [
      {
        name: 'AeroSound Pro Headphones',
        description: 'Premium wireless headphones with hybrid active noise cancellation, high-fidelity spatial audio, and an ultra-comfortable memory foam headband.',
        price: 289.99,
        image_url: '/images/headphones.jpg',
        category: 'Audio',
        stock: 15
      },
      {
        name: 'Keystone Mechanical Keyboard',
        description: 'Sleek 75% mechanical keyboard featuring hot-swappable tactile switches, frosted polycarbonate casing, customizable RGB, and premium double-shot PBT keycaps.',
        price: 165.00,
        image_url: '/images/keyboard.jpg',
        category: 'Peripherals',
        stock: 8
      },
      {
        name: 'Omni Charging Dock',
        description: 'Minimalist 3-in-1 magnetic wireless charging station crafted from aircraft-grade aluminium and premium walnut wood. Charges phone, watch, and earbuds simultaneously.',
        price: 89.50,
        image_url: '/images/charging-dock.jpg',
        category: 'Accessories',
        stock: 25
      },
      {
        name: 'Nomad Leather Backpack',
        description: 'Water-resistant travel companion constructed from full-grain vegetable-tanned leather. Features a suspended 16-inch laptop compartment and hidden luggage pass-through.',
        price: 210.00,
        image_url: '/images/backpack.jpg',
        category: 'Lifestyle',
        stock: 12
      },
      {
        name: 'Eclipse Ambient Desk Light',
        description: 'Smart bedside and desk lamp with touch-sensitive dimming, stepless color temperature adjustment, and full integration with your smart home ecosystem.',
        price: 79.99,
        image_url: '/images/desk-light.jpg',
        category: 'Lifestyle',
        stock: 20
      },
      {
        name: 'Apex Ergonomic Laptop Stand',
        description: 'Brushed aluminium laptop elevator with 360-degree rotating base, adjustable heights, and open-air cooling design. Folds flat for portability.',
        price: 55.00,
        image_url: '/images/laptop-stand.jpg',
        category: 'Peripherals',
        stock: 30
      }
    ];

    for (const prod of seedProducts) {
      await run(
        `INSERT INTO products (name, description, price, image_url, category, stock) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [prod.name, prod.description, prod.price, prod.image_url, prod.category, prod.stock]
      );
    }
    console.log('Database seeded successfully!');
  }
}

module.exports = {
  run,
  get,
  all,
  initDB,
  db
};
