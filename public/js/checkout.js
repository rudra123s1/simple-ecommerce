// Checkout billing, validation, and order routing

const checkoutForm = document.getElementById('checkout-form');
const itemsList = document.getElementById('checkout-items-list');
const subtotalEl = document.getElementById('checkout-subtotal');
const shippingEl = document.getElementById('checkout-shipping');
const totalEl = document.getElementById('checkout-total');
const placeOrderBtn = document.getElementById('place-order-btn');

function initCheckoutPage() {
  // 1. Session check
  if (!API.auth.isAuthenticated()) {
    showToast('Session required. Redirecting to login...', 'error');
    window.location.href = '/auth.html?redirect=checkout.html';
    return;
  }

  // 2. Empty cart check
  const items = Cart.getItems();
  if (items.length === 0) {
    showToast('Your cart is empty. Redirecting to catalog...', 'error');
    window.location.href = '/';
    return;
  }

  // 3. Render items list
  itemsList.innerHTML = '';
  items.forEach(item => {
    const itemRow = document.createElement('div');
    itemRow.className = 'order-item-row';
    itemRow.style.display = 'flex';
    itemRow.style.alignItems = 'center';
    itemRow.style.gap = '1rem';
    
    itemRow.innerHTML = `
      <img src="${item.image_url}" alt="${item.name}" style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border-color);" onerror="this.src='https://placehold.co/80x80/0d1426/a78bfa?text=${encodeURIComponent(item.name)}'">
      <div style="flex-grow: 1;">
        <div style="font-weight: 500; font-size: 0.95rem;">${item.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Qty: ${item.quantity} &times; $${item.price.toFixed(2)}</div>
      </div>
      <div style="font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</div>
    `;
    itemsList.appendChild(itemRow);
  });

  // 4. Set totals
  const subtotal = Cart.totalAmount();
  const shippingCost = subtotal >= 150 ? 0 : 15;
  const total = subtotal + shippingCost;

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  shippingEl.textContent = shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`;
  totalEl.textContent = `$${total.toFixed(2)}`;
}

// Order Submission
async function processOrder(e) {
  e.preventDefault();

  const originalBtnText = placeOrderBtn.textContent;
  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = 'Processing Order...';

  // Gather fields
  const name = document.getElementById('shipping-name').value.trim();
  const address = document.getElementById('shipping-address').value.trim();
  const city = document.getElementById('shipping-city').value.trim();
  const zip = document.getElementById('shipping-zip').value.trim();
  const country = document.getElementById('shipping-country').value.trim();
  
  // Format shipping address string
  const fullShippingAddress = `${name}, ${address}, ${city}, ${zip}, ${country}`;

  // Build items format
  const cartItems = Cart.getItems();
  const itemsPayload = cartItems.map(item => ({
    id: item.id,
    quantity: item.quantity
  }));

  try {
    const response = await API.orders.create(itemsPayload, fullShippingAddress);
    
    showToast('Order placed successfully!', 'success');
    
    // Clear shopping cart
    Cart.clear();
    
    // Redirect to orders profile page after delay
    setTimeout(() => {
      window.location.href = '/orders.html';
    }, 1500);

  } catch (error) {
    showToast(error.message || 'Failed to place order. Please review your stock quantities.', 'error');
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = originalBtnText;
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();
  
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', processOrder);
  }
});
