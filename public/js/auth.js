// Authentication Tab Switching and Submission Logic

// DOM Elements
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Toggle Active Form
function switchTab(target) {
  if (target === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  } else {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  }
}

// Extract redirect page if present
function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || '/';
}

// Event Listeners
function setupAuthListeners() {
  // Tab triggers
  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));

  // Login Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    try {
      await API.auth.login(email, password);
      showToast('Logged in successfully! Welcome back.', 'success');
      
      // Delay redirect to let user see toast
      setTimeout(() => {
        window.location.href = getRedirectUrl();
      }, 1000);
    } catch (error) {
      showToast(error.message || 'Login failed. Please verify credentials.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Register Submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
      await API.auth.register(username, email, password);
      showToast('Registration successful! Welcome to Veloce.', 'success');

      // Delay redirect to let user see toast
      setTimeout(() => {
        window.location.href = getRedirectUrl();
      }, 1000);
    } catch (error) {
      showToast(error.message || 'Registration failed. Choose a unique name or email.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Redirect if already logged in
function checkSession() {
  if (API.auth.isAuthenticated()) {
    window.location.href = '/';
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  setupAuthListeners();
  
  // Direct to correct tab if specified in hash e.g., #register
  if (window.location.hash === '#register') {
    switchTab('register');
  }
});
