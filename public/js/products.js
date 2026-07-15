// Product listings and filtering logic

let activeCategory = '';
let searchQuery = '';
let searchTimeout = null;

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const categoryTabs = document.getElementById('category-tabs');

// Fetch and render products
async function loadProducts() {
  try {
    // Show loading state or clear previous grid
    productsGrid.innerHTML = '';
    
    const response = await API.products.getAll(activeCategory, searchQuery);
    const products = response.products;

    if (!products || products.length === 0) {
      productsGrid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    productsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card glass-panel';
      
      // Setup HTML for product card
      card.innerHTML = `
        <a href="/product.html?id=${product.id}" style="display: block; flex-grow: 1;">
          <div class="product-img-container">
            <span class="product-category-badge">${product.category}</span>
            <img src="${product.image_url}" alt="${product.name}" class="product-img" onerror="this.src='https://placehold.co/600x400/0d1426/a78bfa?text=${encodeURIComponent(product.name)}'">
          </div>
          <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-desc-excerpt">${product.description}</p>
          </div>
        </a>
        <div class="product-price-row">
          <span class="product-price">$${product.price.toFixed(2)}</span>
          <button class="gradient-btn add-to-cart-btn" data-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
            ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart ✦'}
          </button>
        </div>
      `;

      // Event listener for add-to-cart inside card
      const addBtn = card.querySelector('.add-to-cart-btn');
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (product.stock > 0) {
          Cart.add(product, 1);
        } else {
          showToast('Product is currently out of stock.', 'error');
        }
      });

      productsGrid.appendChild(card);
    });

  } catch (error) {
    showToast('Failed to load products. Server might be offline.', 'error');
    console.error('loadProducts error:', error);
  }
}

// Setup Event Listeners
function setupListeners() {
  // Category tabs filtering
  if (categoryTabs) {
    categoryTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.category-tab');
      if (!tab) return;

      // Update active tab styling
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      activeCategory = tab.dataset.category;
      loadProducts();
    });
  }

  // Search input with basic debounce
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadProducts();
      }, 300);
    });
  }
}

// Initialise page
document.addEventListener('DOMContentLoaded', () => {
  setupListeners();
  loadProducts();
});
