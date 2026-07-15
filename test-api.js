// Programmatic test script to verify e-commerce backend API flows

const http = require('http');

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject({ status: res.statusCode, error: parsed.error || 'Request failed' });
          }
        } catch (e) {
          reject({ status: res.statusCode, error: 'Could not parse JSON response' });
        }
      });
    });

    req.on('error', (err) => {
      reject({ status: 500, error: err.message });
    });

    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 STARTING API END-TO-END FLOW VERIFICATION...');
  let token = null;
  const username = `tester_${Date.now()}`; // Unique username per run
  const email = `tester_${Date.now()}@example.com`;

  try {
    // 1. Register User
    console.log('\n1. Testing Registration Endpoint (/api/auth/register)...');
    const regRes = await makeRequest('POST', '/api/auth/register', {
      username,
      email,
      password: 'password123'
    });
    console.log('✅ Registration success!', regRes.data.message);
    token = regRes.data.token;

    // 2. Fetch User Profile
    console.log('\n2. Testing User Verification Profile Endpoint (/api/auth/me)...');
    const meRes = await makeRequest('GET', '/api/auth/me', null, token);
    console.log(`✅ Profile retrieved! Logged in as: ${meRes.data.user.username} (${meRes.data.user.email})`);

    // 3. Fetch Products List
    console.log('\n3. Testing Product Catalog Retrieval (/api/products)...');
    const prodRes = await makeRequest('GET', '/api/products');
    const products = prodRes.data.products;
    console.log(`✅ Catalog retrieved! Total products: ${products.length}`);
    products.forEach((p, idx) => {
      console.log(`   [${idx + 1}] ${p.name} ($${p.price}) - Stock: ${p.stock}`);
    });

    if (products.length === 0) {
      throw new Error('Database is empty. Seeding might have failed.');
    }

    const firstProduct = products[0];

    // 4. Place Order
    console.log(`\n4. Testing Checkout / Order Placement (/api/orders)...`);
    console.log(`   Purchasing: 2x "${firstProduct.name}"`);
    const orderPayload = {
      items: [
        { id: firstProduct.id, quantity: 2 }
      ],
      shippingAddress: '456 Tester Studio, Silicon Valley, CA, 94025, United States'
    };
    
    const orderRes = await makeRequest('POST', '/api/orders', orderPayload, token);
    console.log(`✅ Order placed successfully! Reference ID: ${orderRes.data.orderId}, Charge: $${orderRes.data.totalAmount}`);

    // 5. Fetch Order History
    console.log('\n5. Testing Transaction Log Retrieval (/api/orders)...');
    const historyRes = await makeRequest('GET', '/api/orders', null, token);
    const orders = historyRes.data.orders;
    console.log(`✅ History retrieved! Total orders under account: ${orders.length}`);
    orders.forEach((o, oIdx) => {
      console.log(`   Order [${oIdx + 1}] Reference: #VL-${o.id} | Total: $${o.total_amount} | Status: ${o.status}`);
      o.items.forEach((item, iIdx) => {
        console.log(`     - Item [${iIdx + 1}]: ${item.name} | Qty: ${item.quantity} | Paid Unit Cost: $${item.price}`);
      });
    });

    console.log('\n==================================================');
    console.log('🎉 ALL BACKEND API ENDPOINTS VERIFIED SUCCESSFULLY!');
    console.log('==================================================');

  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.error || err);
    process.exit(1);
  }
}

// Give server half a second to initialize if called concurrently
setTimeout(runTests, 500);
