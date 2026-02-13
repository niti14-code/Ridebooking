// Main Application Logic

const App = {
    // Initialize application
    init() {
        this.setupEventListeners();
        this.renderVehiclePreviews();
        this.checkUrlParams();
    },

    // Setup global event listeners
    setupEventListeners() {
        // Listen for ride updates
        window.addEventListener('rideCreated', (e) => {
            console.log('New ride created:', e.detail);
        });

        window.addEventListener('rideUpdated', (e) => {
            console.log('Ride updated:', e.detail);
        });

        // Handle offline/online
        window.addEventListener('online', () => {
            showToast('Back online', 'success');
        });

        window.addEventListener('offline', () => {
            showToast('You are offline', 'error');
        });
    },

    // Render vehicle previews on homepage
    renderVehiclePreviews() {
        const container = document.getElementById('vehicles-preview');
        if (!container) return;

        const vehicles = [
            { icon: '🏍️', name: 'Bike', desc: 'Quick & eco-friendly', price: 'From ₹30' },
            { icon: '🚗', name: 'Sedan', desc: 'Comfort & style', price: 'From ₹100' },
            { icon: '🚙', name: 'SUV', desc: 'Spacious luxury', price: 'From ₹150' },
            { icon: '🏎️', name: 'Luxury', desc: 'Premium experience', price: 'From ₹300' }
        ];

        container.innerHTML = vehicles.map(v => `
            <div class="vehicle-preview-card">
                <div class="vehicle-img">${v.icon}</div>
                <div class="vehicle-preview-info">
                    <h4>${v.name}</h4>
                    <p>${v.desc}</p>
                    <div style="color: var(--primary-gold); font-weight: 600; margin-top: 0.5rem;">${v.price}</div>
                </div>
            </div>
        `).join('');
    },

    // Check URL parameters for redirects
    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        
        // Handle auth redirects
        if (params.get('auth') === 'required') {
            showToast('Please sign in to continue', 'error');
        }
    },

    // Share ride details
    async shareRide(rideId) {
        const ride = RideManager.getRide(rideId);
        if (!ride) return;

        const shareData = {
            title: 'My LuxeRide Trip',
            text: `I'm taking a ${ride.vehicle.name} from ${ride.pickup} to ${ride.dropoff}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            const text = `${shareData.title}\n${shareData.text}`;
            navigator.clipboard.writeText(text);
            showToast('Trip details copied to clipboard', 'success');
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});