// Product Detail interactive page script

let product = null;
let selectedQty = 1;

// DOM Elements
const detailLoader = document.getElementById('detail-loader');
const detailContainer = document.getElementById('product-detail-container');
const pImg = document.getElementById('product-img');
const pCategory = document.getElementById('product-category');
const pTitle = document.getElementById('product-title');
const pPrice = document.getElementById('product-price');
const pDesc = document.getElementById('product-desc');
const pStock = document.getElementById('product-stock-status');
const qtyDisplay = document.getElementById('qty-display');
const btnMinus = document.getElementById('qty-minus');
const btnPlus = document.getElementById('qty-plus');
const btnAddCart = document.getElementById('add-to-cart-btn');

// Parse Query Parameters
function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Load Product Detail data
async function loadProductDetail() {
  const id = getProductId();
  if (!id) {
    showErrorState('Product ID is missing in URL.');
    return;
  }

  try {
    const data = await API.products.getById(id);
    product = data.product;

    if (!product) {
      showErrorState('Requested product was not found.');
      return;
    }

    // Populate data
    pTitle.textContent = product.name;
    pCategory.textContent = product.category;
    pPrice.textContent = `$${product.price.toFixed(2)}`;
    pDesc.textContent = product.description;
    
    // Set fallback image handler
    pImg.src = product.image_url;
    pImg.alt = product.name;
    pImg.onerror = () => {
      pImg.src = `https://placehold.co/800x600/0d1426/a78bfa?text=${encodeURIComponent(product.name)}`;
    };

    // Stock management
    if (product.stock <= 0) {
      pStock.textContent = 'Out of Stock';
      pStock.style.color = 'var(--danger)';
      btnAddCart.disabled = true;
      btnAddCart.textContent = 'Out of Stock';
      btnPlus.disabled = true;
      btnMinus.disabled = true;
      selectedQty = 0;
      qtyDisplay.textContent = 0;
    } else {
      pStock.textContent = `${product.stock} units available`;
      pStock.style.color = 'var(--success)';
      btnAddCart.disabled = false;
    }

    // Hide loader, show container
    detailLoader.style.display = 'none';
    detailContainer.style.display = 'block';

  } catch (error) {
    showErrorState('Could not retrieve product specs. Ensure backend server is running.');
  }
}

// Show error messages inside container
function showErrorState(message) {
  detailLoader.innerHTML = `
    <div class="empty-icon" style="color: var(--danger);">✕</div>
    <h3>Error Loading Specifications</h3>
    <p class="text-secondary mt-1">${message}</p>
    <a href="/" class="gradient-btn mt-3">Return to Catalog</a>
  `;
}

// Setup Event Listeners
function setupDetailListeners() {
  btnMinus.addEventListener('click', () => {
    if (selectedQty > 1) {
      selectedQty--;
      updateQtyDisplay();
    }
  });

  btnPlus.addEventListener('click', () => {
    if (!product) return;
    if (selectedQty < product.stock) {
      selectedQty++;
      updateQtyDisplay();
    } else {
      showToast(`Cannot add more. Only ${product.stock} units in stock.`, 'error');
    }
  });

  btnAddCart.addEventListener('click', () => {
    if (!product || selectedQty <= 0) return;
    const added = Cart.add(product, selectedQty);
    if (added) {
      // Show success animation or redirect to cart
      showToast(`${selectedQty}x ${product.name} added to cart.`, 'success');
    }
  });
}

function updateQtyDisplay() {
  qtyDisplay.textContent = selectedQty;
  btnMinus.disabled = selectedQty <= 1;
  btnPlus.disabled = product ? selectedQty >= product.stock : true;
}

// Bootstrap page
document.addEventListener('DOMContentLoaded', () => {
  setupDetailListeners();
  loadProductDetail();
});
