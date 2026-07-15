// Cart rendering and interactive checkout routing

const cartContainer = document.getElementById('cart-container');
const cartEmpty = document.getElementById('cart-empty');
const itemsBody = document.getElementById('cart-items-body');
const subtotalEl = document.getElementById('summary-subtotal');
const shippingEl = document.getElementById('summary-shipping');
const totalEl = document.getElementById('summary-total');
const checkoutBtn = document.getElementById('checkout-btn');

function renderCart() {
  const items = Cart.getItems();

  if (items.length === 0) {
    cartContainer.style.display = 'none';
    cartEmpty.style.display = 'block';
    return;
  }

  cartContainer.style.display = 'grid';
  cartEmpty.style.display = 'none';

  itemsBody.innerHTML = '';
  
  items.forEach(item => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>
        <div class="cart-item-info">
          <img src="${item.image_url}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://placehold.co/120x120/0d1426/a78bfa?text=${encodeURIComponent(item.name)}'">
          <div>
            <a href="/product.html?id=${item.id}" class="cart-item-name">${item.name}</a>
            <div class="cart-item-category">${item.category}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="qty-selector" style="justify-content: center; margin-bottom: 0;">
          <button class="qty-btn btn-qty-minus" data-id="${item.id}" style="width: 28px; height: 28px; font-size: 0.9rem;">-</button>
          <span class="qty-val" style="font-size: 1rem; width: 24px;">${item.quantity}</span>
          <button class="qty-btn btn-qty-plus" data-id="${item.id}" style="width: 28px; height: 28px; font-size: 0.9rem;">+</button>
        </div>
      </td>
      <td>$${item.price.toFixed(2)}</td>
      <td style="font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</td>
      <td>
        <button class="cart-remove-btn" data-id="${item.id}">Remove</button>
      </td>
    `;

    // Event listeners inside row
    const minusBtn = row.querySelector('.btn-qty-minus');
    const plusBtn = row.querySelector('.btn-qty-plus');
    const removeBtn = row.querySelector('.cart-remove-btn');

    minusBtn.addEventListener('click', () => {
      Cart.updateQuantity(item.id, item.quantity - 1);
      renderCart();
    });

    plusBtn.addEventListener('click', () => {
      Cart.updateQuantity(item.id, item.quantity + 1);
      renderCart();
    });

    removeBtn.addEventListener('click', () => {
      Cart.remove(item.id);
      renderCart();
    });

    itemsBody.appendChild(row);
  });

  // Calculate Subtotals & Totals
  const subtotal = Cart.totalAmount();
  const shippingThreshold = 150;
  const shippingCost = subtotal >= shippingThreshold ? 0 : 15;
  const total = subtotal + shippingCost;

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  shippingEl.textContent = shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`;
  totalEl.textContent = `$${total.toFixed(2)}`;
}

// Router to checkout flow
function handleCheckout() {
  if (!API.auth.isAuthenticated()) {
    showToast('Please sign in or register to complete your checkout.', 'info');
    setTimeout(() => {
      window.location.href = '/auth.html?redirect=checkout.html';
    }, 1200);
  } else {
    window.location.href = '/checkout.html';
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }
});
