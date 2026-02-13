// Utility Functions

const Utils = {
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Format currency
    formatCurrency(amount) {
        return '₹' + Math.round(amount).toLocaleString('en-IN');
    },

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    // Geocode address (simulated - replace with real API)
    async geocodeAddress(address) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Return mock coordinates for demo
                const mockCoords = {
                    'airport': [28.5562, 77.1000],
                    'downtown': [28.6139, 77.2090],
                    'station': [28.6429, 77.2191],
                    'park': [28.6139, 77.2090]
                };
                
                const key = Object.keys(mockCoords).find(k => 
                    address.toLowerCase().includes(k)
                );
                
                resolve({
                    lat: key ? mockCoords[key][0] : 28.6139 + (Math.random() - 0.5) * 0.1,
                    lng: key ? mockCoords[key][1] : 77.2090 + (Math.random() - 0.5) * 0.1,
                    name: address
                });
            }, 300);
        });
    },

    // Validate email
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validate phone
    isValidPhone(phone) {
        return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.length >= 10;
    },

    // Store with expiry
    setWithExpiry(key, value, ttl) {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl,
        };
        localStorage.setItem(key, JSON.stringify(item));
    },

    getWithExpiry(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        const item = JSON.parse(itemStr);
        const now = new Date();
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return item.value;
    }
};

// Global toast function
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icons[type]}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Global location setter
function setLocation(location, page = 'home') {
    const inputId = page === 'home' ? 'home-pickup' : 'pickup-input';
    const input = document.getElementById(inputId);
    if (input) {
        input.value = location;
        input.dispatchEvent(new Event('input'));
    }
}

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        showToast('Locating you...', 'info');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                showToast('Location found!', 'success');
                return position.coords;
            },
            () => {
                showToast('Unable to get location', 'error');
                return null;
            }
        );
    } else {
        showToast('Geolocation not supported', 'error');
        return null;
    }
}

// Search rides from home
function searchRides() {
    const pickup = document.getElementById('home-pickup')?.value;
    const drop = document.getElementById('home-drop')?.value;
    
    if (!pickup || !drop) {
        showToast('Please enter both locations', 'error');
        return;
    }
    
    window.location.href = `booking.html?pickup=${encodeURIComponent(pickup)}&dropoff=${encodeURIComponent(drop)}`;
}