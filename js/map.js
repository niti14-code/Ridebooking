// Map Manager - Handles all map-related functionality

const MapManager = {
    map: null,
    pickupMarker: null,
    dropoffMarker: null,
    routeLine: null,
    pickupCoords: null,
    dropoffCoords: null,
    distance: 0,
    duration: 0,

    // Initialize map
    init() {
        // Default to New York City
        this.map = L.map('map').setView([40.7128, -74.0060], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add custom styles for dark theme
        this.addDarkThemeStyles();
        
        // Setup click handlers
        this.setupMapInteractions();
        
        // Setup input listeners
        this.setupInputListeners();
    },

    // Add CSS filters for dark theme
    addDarkThemeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .leaflet-layer {
                filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
            }
            .leaflet-container {
                background: #1a1a1a;
            }
        `;
        document.head.appendChild(style);
    },

    // Setup map interactions
    setupMapInteractions() {
        this.map.on('click', (e) => {
            // If no pickup set, set pickup, else set dropoff
            if (!this.pickupCoords) {
                this.setPickup(e.latlng);
            } else if (!this.dropoffCoords) {
                this.setDropoff(e.latlng);
            }
        });
    },

    // Setup input listeners for real-time updates
    setupInputListeners() {
        const pickupInput = document.getElementById('pickup-input');
        const dropoffInput = document.getElementById('dropoff-input');
        
        if (pickupInput) {
            pickupInput.addEventListener('change', () => {
                if (pickupInput.value && dropoffInput && dropoffInput.value) {
                    this.calculateRoute();
                }
            });
        }
        
        if (dropoffInput) {
            dropoffInput.addEventListener('change', () => {
                if (dropoffInput.value && pickupInput && pickupInput.value) {
                    this.calculateRoute();
                }
            });
        }
    },

    // Set pickup location
    async setPickup(latlng, address = null) {
        this.pickupCoords = latlng;
        
        if (this.pickupMarker) {
            this.map.removeLayer(this.pickupMarker);
        }
        
        const pickupIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: #00C853; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        this.pickupMarker = L.marker(latlng, { icon: pickupIcon })
            .addTo(this.map)
            .bindPopup('<b>Pickup</b><br>' + (address || 'Selected Location'));
        
        if (address && document.getElementById('pickup-input')) {
            document.getElementById('pickup-input').value = address;
        }
        
        // If we have both points, update route
        if (this.dropoffCoords) {
            this.updateRoute();
        } else {
            this.map.setView(latlng, 16);
        }
    },

    // Set dropoff location
    async setDropoff(latlng, address = null) {
        this.dropoffCoords = latlng;
        
        if (this.dropoffMarker) {
            this.map.removeLayer(this.dropoffMarker);
        }
        
        const dropoffIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: #ff4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        this.dropoffMarker = L.marker(latlng, { icon: dropoffIcon })
            .addTo(this.map)
            .bindPopup('<b>Dropoff</b><br>' + (address || 'Selected Location'));
        
        if (address && document.getElementById('dropoff-input')) {
            document.getElementById('dropoff-input').value = address;
        }
        
        // If we have both points, update route
        if (this.pickupCoords) {
            this.updateRoute();
        } else {
            this.map.setView(latlng, 16);
        }
    },

    // Get user's current location
    locateUser() {
        if (navigator.geolocation) {
            showToast('Getting your location...', 'info');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const latlng = L.latLng(latitude, longitude);
                    
                    this.map.setView(latlng, 16);
                    this.setPickup(latlng, 'Current Location');
                    
                    showToast('Location found!', 'success');
                    
                    // Try to calculate route if dropoff exists
                    if (this.dropoffCoords) {
                        this.updateRoute();
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    showToast('Unable to get location. Please enable location services.', 'error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            showToast('Geolocation is not supported by your browser', 'error');
        }
    },

    // Calculate and display route
    async calculateRoute() {
        const pickupInput = document.getElementById('pickup-input');
        const dropoffInput = document.getElementById('dropoff-input');
        
        const pickupAddress = pickupInput ? pickupInput.value : '';
        const dropoffAddress = dropoffInput ? dropoffInput.value : '';
        
        if (!pickupAddress || !dropoffAddress) {
            showToast('Please enter both pickup and dropoff locations', 'error');
            return;
        }

        showToast('Calculating route...', 'info');

        try {
            // Geocode both addresses
            const [pickupResult, dropoffResult] = await Promise.all([
                this.geocodeAddress(pickupAddress),
                this.geocodeAddress(dropoffAddress)
            ]);

            await this.setPickup(L.latLng(pickupResult.lat, pickupResult.lng), pickupResult.name);
            await this.setDropoff(L.latLng(dropoffResult.lat, dropoffResult.lng), dropoffResult.name);

        } catch (error) {
            console.error('Routing error:', error);
            showToast('Error calculating route. Please try again.', 'error');
        }
    },

    // Geocode address using Nominatim (OpenStreetMap)
    async geocodeAddress(address) {
        // Check if it's "Current Location"
        if (address.toLowerCase().includes('current')) {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        name: 'Current Location'
                    }),
                    () => reject(new Error('Could not get current location'))
                );
            });
        }

        // Try to use predefined locations first
        const predefined = {
            'jfk': [40.6413, -73.7781],
            'times square': [40.7580, -73.9855],
            'central park': [40.7829, -73.9654],
            'wall street': [40.7074, -74.0113],
            'airport': [40.6413, -73.7781],
            'downtown': [40.7128, -74.0060],
            'brooklyn': [40.6782, -73.9442],
            'queens': [40.7282, -73.7949]
        };

        const key = Object.keys(predefined).find(k => 
            address.toLowerCase().includes(k)
        );

        if (key) {
            return {
                lat: predefined[key][0],
                lng: predefined[key][1],
                name: address
            };
        }

        // Use Nominatim API for geocoding
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            const data = await response.json();
            
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    name: data[0].display_name.split(',')[0]
                };
            }
        } catch (e) {
            console.warn('Geocoding failed, using fallback');
        }

        // Fallback to random offset from NYC center for demo
        return {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
            lng: -74.0060 + (Math.random() - 0.5) * 0.1,
            name: address
        };
    },

    // Update route line between markers
    updateRoute() {
        if (!this.pickupCoords || !this.dropoffCoords) return;

        // Remove existing route
        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
        }

        // Draw line between points
        const latlngs = [this.pickupCoords, this.dropoffCoords];
        
        this.routeLine = L.polyline(latlngs, {
            color: '#D4AF37',
            weight: 4,
            opacity: 0.9,
            dashArray: '10, 10',
            lineCap: 'round'
        }).addTo(this.map);

        // Fit bounds to show both markers
        this.map.fitBounds(L.latLngBounds(latlngs), { padding: [100, 100] });

        // Calculate distance
        this.distance = this.calculateDistance(this.pickupCoords, this.dropoffCoords);
        this.duration = Math.ceil(this.distance * 2.5); // Rough estimate: 2.5 min per km
        
        // Update global booking state
        if (window.BookingState) {
            window.BookingState.distance = this.distance;
            window.BookingState.duration = this.duration;
        }
        
        // Update UI
        this.updateRouteInfo(this.distance, this.duration);
        
        // Update all vehicle prices
        updateAllVehiclePrices(this.distance);
        
        // If a vehicle is selected, recalculate fare
        if (window.BookingState && window.BookingState.selectedVehicle) {
            calculateFare();
        }
        
        console.log(`Route calculated: ${this.distance} km, ${this.duration} min`);
    },

    // Calculate distance between coordinates
    calculateDistance(latlng1, latlng2) {
        const R = 6371; // km
        const dLat = (latlng2.lat - latlng1.lat) * Math.PI / 180;
        const dLon = (latlng2.lng - latlng1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(latlng1.lat * Math.PI / 180) * Math.cos(latlng2.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c * 10) / 10; // Round to 1 decimal
    },

    // Update route info display
    updateRouteInfo(distance, duration) {
        const infoPanel = document.getElementById('route-info');
        const distanceEl = document.getElementById('route-distance');
        const durationEl = document.getElementById('route-duration');
        
        if (infoPanel) infoPanel.style.display = 'flex';
        if (distanceEl) distanceEl.textContent = `${distance} km`;
        if (durationEl) durationEl.textContent = `${duration} min`;
        
        // Enable book button if vehicle selected
        const bookBtn = document.getElementById('book-btn');
        if (bookBtn && window.BookingState && window.BookingState.selectedVehicle) {
            bookBtn.disabled = false;
        }
    },

    // Swap pickup and dropoff
    swapLocations() {
        const pickupInput = document.getElementById('pickup-input');
        const dropoffInput = document.getElementById('dropoff-input');
        
        if (!pickupInput || !dropoffInput) return;
        
        const temp = pickupInput.value;
        pickupInput.value = dropoffInput.value;
        dropoffInput.value = temp;
        
        // Swap coordinates
        const tempCoords = this.pickupCoords;
        this.pickupCoords = this.dropoffCoords;
        this.dropoffCoords = tempCoords;
        
        // Swap markers
        if (this.pickupMarker && this.dropoffMarker) {
            const pickupLatLng = this.pickupMarker.getLatLng();
            const dropoffLatLng = this.dropoffMarker.getLatLng();
            
            this.pickupMarker.setLatLng(dropoffLatLng);
            this.dropoffMarker.setLatLng(pickupLatLng);
        }
        
        this.updateRoute();
    },

    // Reset map view
    resetView() {
        this.map.setView([40.7128, -74.0060], 13);
    },

    // Clear all markers and route
    clear() {
        if (this.pickupMarker) this.map.removeLayer(this.pickupMarker);
        if (this.dropoffMarker) this.map.removeLayer(this.dropoffMarker);
        if (this.routeLine) this.map.removeLayer(this.routeLine);
        
        this.pickupMarker = null;
        this.dropoffMarker = null;
        this.routeLine = null;
        this.pickupCoords = null;
        this.dropoffCoords = null;
        this.distance = 0;
        this.duration = 0;
    }
};