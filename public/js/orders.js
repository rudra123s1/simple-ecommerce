// Account profile rendering and transaction log list rendering

const loaderEl = document.getElementById('orders-loader');
const containerEl = document.getElementById('dashboard-container');
const avatarEl = document.getElementById('user-avatar');
const usernameEl = document.getElementById('user-username');
const emailEl = document.getElementById('user-email');
const joinedEl = document.getElementById('user-joined');
const listEl = document.getElementById('orders-list');
const emptyEl = document.getElementById('orders-empty');

async function loadDashboard() {
  // 1. Session check
  if (!API.auth.isAuthenticated()) {
    showToast('Please sign in to view your orders.', 'error');
    window.location.href = '/auth.html';
    return;
  }

  try {
    // 2. Fetch User verification details
    const user = await API.auth.verifySession();
    if (!user) return; // verifySession auto-redirects on fail

    // Populate profile card
    usernameEl.textContent = user.username;
    emailEl.textContent = user.email;
    avatarEl.textContent = user.username.charAt(0).toUpperCase();

    const joinDate = user.created_at 
      ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Recently Joined';
    joinedEl.textContent = joinDate;

    // 3. Fetch orders list
    const response = await API.orders.getHistory();
    const orders = response.orders;

    if (!orders || orders.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
    } else {
      emptyEl.style.display = 'none';
      listEl.innerHTML = '';

      orders.forEach(order => {
        const oCard = document.createElement('div');
        oCard.className = 'order-card glass-panel';
        oCard.style.padding = '1.5rem';
        
        // Date layout
        const orderDate = new Date(order.created_at).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Status badges
        const statusClass = order.status.toLowerCase() === 'processing' 
          ? 'processing' 
          : order.status.toLowerCase() === 'delivered' 
            ? 'delivered' 
            : 'pending';

        let itemsHtml = '';
        order.items.forEach(item => {
          itemsHtml += `
            <div class="order-item-row" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding: 0.5rem 0;">
              <div style="display: flex; align-items: center; gap: 0.8rem;">
                <img src="${item.image_url}" alt="${item.name}" style="width: 38px; height: 38px; border-radius: 4px; object-fit: cover;" onerror="this.src='https://placehold.co/60x60/0d1426/a78bfa?text=${encodeURIComponent(item.name)}'">
                <div>
                  <span style="font-weight: 500; font-size: 0.95rem;">${item.name}</span>
                  <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">x${item.quantity}</span>
                </div>
              </div>
              <span style="font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `;
        });

        oCard.innerHTML = `
          <div class="order-header">
            <div class="order-meta-info">
              <div>
                <span class="text-muted" style="font-size: 0.8rem; display: block; text-transform: uppercase;">Order Reference</span>
                <span style="font-weight: 600;">#VL-${order.id.toString().padStart(6, '0')}</span>
              </div>
              <div>
                <span class="text-muted" style="font-size: 0.8rem; display: block; text-transform: uppercase;">Date Placed</span>
                <span style="font-weight: 500;">${orderDate}</span>
              </div>
            </div>
            <div>
              <span class="order-status ${statusClass}">${order.status}</span>
            </div>
          </div>
          
          <div class="order-items-list" style="margin: 1rem 0;">
            ${itemsHtml}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem; flex-wrap: wrap; gap: 1rem;">
            <div style="max-width: 350px;">
              <span class="text-muted" style="font-size: 0.8rem; display: block; text-transform: uppercase;">Deliver To</span>
              <span style="font-size: 0.85rem; line-height: 1.4; display: block; color: var(--text-secondary);">${order.shipping_address}</span>
            </div>
            <div class="text-right">
              <span class="text-muted" style="font-size: 0.8rem; display: block; text-transform: uppercase;">Total Charge</span>
              <span style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary);">$${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        `;
        
        listEl.appendChild(oCard);
      });
    }

    loaderEl.style.display = 'none';
    containerEl.style.display = 'grid';

  } catch (error) {
    loaderEl.innerHTML = `
      <div class="empty-icon" style="color: var(--danger);">✕</div>
      <h3>Failed to Load Profile</h3>
      <p class="text-secondary mt-1">Could not connect to database server.</p>
    `;
    console.error('loadDashboard error:', error);
  }
}

// Bootstrap page
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});
