// API wrapper for communicating with the Node/Express backend

const API_BASE = '/api';

const API = {
  // Helper to make fetch requests
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  },

  // Auth operations
  auth: {
    async register(username, email, password) {
      const data = await API.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    },

    async login(email, password) {
      const data = await API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    },

    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    },

    getCurrentUser() {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
      return !!localStorage.getItem('authToken');
    },

    async verifySession() {
      if (!this.isAuthenticated()) return null;
      try {
        const data = await API.request('/auth/me');
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      } catch (err) {
        this.logout();
        return null;
      }
    }
  },

  // Product operations
  products: {
    async getAll(category = '', search = '') {
      let query = '';
      const params = [];
      if (category) params.push(`category=${encodeURIComponent(category)}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (params.length > 0) query = '?' + params.join('&');
      
      return await API.request(`/products${query}`);
    },

    async getById(id) {
      return await API.request(`/products/${id}`);
    }
  },

  // Order operations
  orders: {
    async create(items, shippingAddress) {
      return await API.request('/orders', {
        method: 'POST',
        body: JSON.stringify({ items, shippingAddress })
      });
    },

    async getHistory() {
      return await API.request('/orders');
    }
  }
};
