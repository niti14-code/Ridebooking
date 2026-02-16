// API Service - Connects frontend to backend

const API_BASE_URL = 'http://localhost:5000/api';

const api = {
  getToken() {
    return localStorage.getItem('ridebooking_token');
  },

  setToken(token) {
    localStorage.setItem('ridebooking_token', token);
  },

  removeToken() {
    localStorage.removeItem('ridebooking_token');
  },

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`API Request: ${options.method || 'GET'} ${url}`); // Debug log

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      console.log(`Response status: ${response.status}`); // Debug log

      // Handle 401 - Unauthorized
      if (response.status === 401) {
        this.removeToken();
        window.location.href = 'login.html?auth=required';
        throw new Error('Session expired. Please login again.');
      }

      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: 'Invalid response from server' };
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;

    } catch (error) {
      console.error("API Error:", error.message);
      
      // Network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  },

  // Auth endpoints
  auth: {
    register: (userData) => api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    
    login: (credentials) => api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    
    getMe: () => api.request('/auth/me')
  },

  // Rides endpoints
  rides: {
    create: (rideData) => api.request('/rides', {
      method: 'POST',
      body: JSON.stringify(rideData)
    }),
    
    getAll: () => api.request('/rides'),
    
    cancel: (id) => api.request(`/rides/${id}/cancel`, {
      method: 'PUT'
    }),
    
    delete: (id) => api.request(`/rides/${id}`, {
      method: 'DELETE'
    })
  }
};