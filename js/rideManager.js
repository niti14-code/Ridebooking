// Ride Manager - Handles all ride-related CRUD operations

const RideManager = {
    // Create new ride
    createRide(rideData) {
        const rides = this.getRides();
        const newRide = {
            id: Date.now(),
            ...rideData,
            status: 'ongoing',
            createdAt: new Date().toISOString(),
            driver: this.assignDriver(),
            otp: Math.floor(1000 + Math.random() * 9000),
            estimatedArrival: this.calculateETA()
        };
        
        rides.unshift(newRide);
        localStorage.setItem('luxeride_trips', JSON.stringify(rides));
        
        // Dispatch event for real-time updates
        window.dispatchEvent(new CustomEvent('rideCreated', { detail: newRide }));
        
        return newRide;
    },

    // Get all rides
    getRides() {
        return JSON.parse(localStorage.getItem('luxeride_trips')) || [];
    },

    // Get ride by ID
    getRide(id) {
        const rides = this.getRides();
        return rides.find(r => r.id === id);
    },

    // Update ride
    updateRide(id, updates) {
        const rides = this.getRides();
        const index = rides.findIndex(r => r.id === id);
        
        if (index !== -1) {
            rides[index] = { 
                ...rides[index], 
                ...updates,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('luxeride_trips', JSON.stringify(rides));
            window.dispatchEvent(new CustomEvent('rideUpdated', { detail: rides[index] }));
            return rides[index];
        }
        return null;
    },

    // Cancel ride
    cancelRide(id) {
        return this.updateRide(id, { 
            status: 'cancelled', 
            cancelledAt: new Date().toISOString() 
        });
    },

    // Complete ride
    completeRide(id) {
        return this.updateRide(id, { 
            status: 'completed', 
            completedAt: new Date().toISOString() 
        });
    },

    // Delete ride
    deleteRide(id) {
        let rides = this.getRides();
        rides = rides.filter(r => r.id !== id);
        localStorage.setItem('luxeride_trips', JSON.stringify(rides));
        window.dispatchEvent(new CustomEvent('rideDeleted', { detail: { id } }));
    },

    // Assign random driver
    assignDriver() {
        const drivers = [
            { name: 'Rajesh Kumar', vehicle: 'Toyota Camry', rating: 4.8, trips: 1240, image: 'https://randomuser.me/api/portraits/men/1.jpg' },
            { name: 'Priya Singh', vehicle: 'Honda City', rating: 4.9, trips: 890, image: 'https://randomuser.me/api/portraits/women/2.jpg' },
            { name: 'Amit Shah', vehicle: 'Mercedes C-Class', rating: 4.7, trips: 2100, image: 'https://randomuser.me/api/portraits/men/3.jpg' },
            { name: 'Sneha Patel', vehicle: 'BMW 5 Series', rating: 5.0, trips: 567, image: 'https://randomuser.me/api/portraits/women/4.jpg' },
            { name: 'Vikram Rao', vehicle: 'Audi A6', rating: 4.8, trips: 1567, image: 'https://randomuser.me/api/portraits/men/5.jpg' },
            { name: 'Anita Desai', vehicle: 'Tesla Model 3', rating: 4.9, trips: 430, image: 'https://randomuser.me/api/portraits/women/6.jpg' }
        ];
        
        return drivers[Math.floor(Math.random() * drivers.length)];
    },

    // Calculate estimated arrival
    calculateETA() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + Math.floor(Math.random() * 10 + 5));
        return now.toISOString();
    },

    // Get ride statistics
    getStats() {
        const rides = this.getRides();
        return {
            total: rides.length,
            completed: rides.filter(r => r.status === 'completed').length,
            cancelled: rides.filter(r => r.status === 'cancelled').length,
            ongoing: rides.filter(r => r.status === 'ongoing').length,
            totalSpent: rides.reduce((sum, r) => sum + (r.fare || 0), 0)
        };
    },

    // Clear all rides (for testing)
    clearAll() {
        localStorage.removeItem('luxeride_trips');
    }
};