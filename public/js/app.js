// Global application state and utilities

// Toast Notifications
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✦' : '✕';
  toast.innerHTML = `
    <span class="toast-icon" style="font-weight: bold; color: ${type === 'success' ? 'var(--success)' : 'var(--danger)'}">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Remove toast after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Cart State Management (LocalStorage synced)
const Cart = {
  getItems() {
    const items = localStorage.getItem('cart');
    return items ? JSON.parse(items) : [];
  },

  setItems(items) {
    localStorage.setItem('cart', JSON.stringify(items));
    this.updateCartBadges();
  },

  add(product, quantity = 1) {
    const items = this.getItems();
    const existing = items.find(item => item.id === product.id);

    if (existing) {
      if (existing.quantity + quantity > product.stock) {
        showToast(`Cannot add more. Only ${product.stock} items in stock.`, 'error');
        return false;
      }
      existing.quantity += quantity;
    } else {
      if (quantity > product.stock) {
        showToast(`Cannot add. Only ${product.stock} items in stock.`, 'error');
        return false;
      }
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        quantity: quantity,
        stock: product.stock
      });
    }

    this.setItems(items);
    showToast(`Added ${product.name} to cart!`, 'success');
    return true;
  },

  updateQuantity(productId, newQty) {
    let items = this.getItems();
    const item = items.find(i => i.id === productId);
    
    if (item) {
      if (newQty <= 0) {
        this.remove(productId);
        return;
      }
      if (newQty > item.stock) {
        showToast(`Only ${item.stock} items available in stock.`, 'error');
        return;
      }
      item.quantity = newQty;
      this.setItems(items);
    }
  },

  remove(productId) {
    let items = this.getItems();
    const item = items.find(i => i.id === productId);
    items = items.filter(i => i.id !== productId);
    this.setItems(items);
    if (item) {
      showToast(`Removed ${item.name} from cart.`, 'success');
    }
  },

  clear() {
    localStorage.removeItem('cart');
    this.updateCartBadges();
  },

  count() {
    return this.getItems().reduce((total, item) => total + item.quantity, 0);
  },

  totalAmount() {
    return this.getItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  updateCartBadges() {
    const count = this.count();
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

// Global Layout & Header Rendering
function renderHeader() {
  const header = document.querySelector('header');
  if (!header) return;

  const currentPath = window.location.pathname;
  const user = API.auth.getCurrentUser();
  const isAuthenticated = API.auth.isAuthenticated();

  const navHtml = `
    <div class="nav-container">
      <a href="/" class="logo">
        <span>⚡</span> VELOCE
      </a>
      <ul class="nav-links">
        <li><a href="/" class="nav-item ${currentPath === '/' || currentPath.endsWith('index.html') ? 'active' : ''}">Shop</a></li>
        <li>
          <a href="/cart.html" class="nav-item cart-icon-wrapper ${currentPath.endsWith('cart.html') ? 'active' : ''}">
            Cart
            <span class="cart-badge" style="display: none;">0</span>
          </a>
        </li>
        ${
          isAuthenticated
            ? `
              <li><a href="/orders.html" class="nav-item ${currentPath.endsWith('orders.html') ? 'active' : ''}">My Orders</a></li>
              <li><span class="nav-item" style="cursor: default; opacity: 0.8;">Hi, ${user.username}</span></li>
              <li><button id="logout-btn" class="nav-btn">Logout</button></li>
            `
            : `
              <li><a href="/auth.html" class="nav-btn">Sign In</a></li>
            `
        }
      </ul>
    </div>
  `;

  header.className = 'app-header';
  header.innerHTML = navHtml;

  // Add logout action
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      API.auth.logout();
      showToast('Logged out successfully', 'success');
    });
  }

  // Update cart count immediately
  Cart.updateCartBadges();
}

// Document ready bootstrap
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  
  // Verify token session silently to keep backend state in sync
  if (API.auth.isAuthenticated()) {
    API.auth.verifySession();
  }
});
