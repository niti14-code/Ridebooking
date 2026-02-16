// Authentication Manager - API Version

const Auth = {
  currentUser: null,

  init() {
    this.checkAuth();
  },

  async checkAuth() {
    const token = api.getToken();
    if (!token) {
      this.showAuthButtons();
      return false;
    }
    
    try {
      const data = await api.auth.getMe();
      this.currentUser = data.user;
      this.updateUI();
      return true;
    } catch (error) {
      api.removeToken();
      this.showAuthButtons();
      return false;
    }
  },

  async login(email, password) {
    try {
      const data = await api.auth.login({ email, password });
      api.setToken(data.token);
      this.currentUser = data.user;
      this.updateUI();
      showToast('Welcome back!', 'success');
      return data.user;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  async register(userData) {
    try {
      const data = await api.auth.register(userData);
      api.setToken(data.token);
      this.currentUser = data.user;
      this.updateUI();
      showToast('Account created!', 'success');
      return data.user;
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  logout() {
    api.removeToken();
    this.currentUser = null;
    window.location.href = 'index.html';
  },

  updateUI() {
    const avatar = document.getElementById('user-avatar');
    const name = document.getElementById('user-name');
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');

    if (avatar && this.currentUser) {
      avatar.textContent = this.currentUser.firstName[0].toUpperCase();
    }
    
    if (name && this.currentUser) {
      name.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    
    if (authButtons) authButtons.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
  },

  showAuthButtons() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (authButtons) authButtons.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
  },

  requireAuth() {
    if (!api.getToken()) {
      showToast('Please sign in to continue', 'error');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return false;
    }
    return true;
  }
};

document.addEventListener('DOMContentLoaded', () => Auth.init());