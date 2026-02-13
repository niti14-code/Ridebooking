// Authentication Manager

const Auth = {
    currentUser: null,

    // Initialize auth state
    init() {
        this.checkAuth();
    },

    // Check if user is logged in
    checkAuth() {
        const user = Utils.getWithExpiry('luxeride_user');
        if (user) {
            this.currentUser = user;
            this.updateUI();
            return true;
        } else {
            this.showAuthButtons();
            return false;
        }
    },

    // Login user
    async login(email, password) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('luxeride_users') || '[]');
                const user = users.find(u => u.email === email && u.password === password);
                
                if (user) {
                    this.currentUser = {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone
                    };
                    Utils.setWithExpiry('luxeride_user', this.currentUser, 24 * 60 * 60 * 1000); // 24 hours
                    resolve(this.currentUser);
                } else {
                    reject(new Error('Invalid email or password'));
                }
            }, 800);
        });
    },

    // Register user
    async register(userData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('luxeride_users') || '[]');
                
                // Check if email exists
                if (users.find(u => u.email === userData.email)) {
                    reject(new Error('Email already registered'));
                    return;
                }

                const newUser = {
                    id: Utils.generateId(),
                    ...userData,
                    createdAt: new Date().toISOString()
                };

                users.push(newUser);
                localStorage.setItem('luxeride_users', JSON.stringify(users));

                // Auto login
                this.currentUser = {
                    id: newUser.id,
                    email: newUser.email,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    phone: newUser.phone
                };
                Utils.setWithExpiry('luxeride_user', this.currentUser, 24 * 60 * 60 * 1000);
                
                resolve(this.currentUser);
            }, 1000);
        });
    },

    // Social login
    async socialLogin(provider) {
        showToast(`Connecting to ${provider}...`, 'info');
        
        // Simulate social login
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockUser = {
                    id: Utils.generateId(),
                    email: `user@${provider}.com`,
                    firstName: provider === 'google' ? 'Google' : 'Apple',
                    lastName: 'User',
                    phone: ''
                };
                
                this.currentUser = mockUser;
                Utils.setWithExpiry('luxeride_user', mockUser, 24 * 60 * 60 * 1000);
                resolve(mockUser);
            }, 1500);
        });
    },

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('luxeride_user');
        window.location.href = 'index.html';
    },

    // Update UI based on auth state
    updateUI() {
        // Update avatar
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
        
        if (authButtons && userMenu) {
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
        }
    },

    // Show auth buttons
    showAuthButtons() {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        
        if (authButtons && userMenu) {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    },

    // Require auth for protected pages
    requireAuth() {
        if (!this.checkAuth()) {
            showToast('Please sign in to continue', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return false;
        }
        return true;
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});