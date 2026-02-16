// js/rideManager.js - COMPLETE FILE

const RideManager = {
  async createRide(rideData) {
    try {
      const data = await api.rides.create(rideData);
      
      // Store in localStorage as backup
      const localRides = JSON.parse(localStorage.getItem('localRides') || '[]');
      localRides.push(data.ride);
      localStorage.setItem('localRides', JSON.stringify(localRides));
      
      window.dispatchEvent(new CustomEvent('rideCreated', { detail: data.ride }));
      return data.ride;
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  },

  async getRides(filter = 'all') {
    try {
      const data = await api.rides.getAll(filter);
      return data.rides;
    } catch (error) {
      const localRides = JSON.parse(localStorage.getItem('localRides') || '[]');
      return localRides;
    }
  },

  async rescheduleRide(id, newScheduledTime) {
    try {
      const data = await api.request(`/rides/${id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ newScheduledTime })
      });
      
      // Update localStorage
      const localRides = JSON.parse(localStorage.getItem('localRides') || '[]');
      const rideIndex = localRides.findIndex(r => (r._id || r.id) === id);
      if (rideIndex > -1) {
        localRides[rideIndex] = data.ride;
        localStorage.setItem('localRides', JSON.stringify(localRides));
      }
      
      window.dispatchEvent(new CustomEvent('rideUpdated', { detail: data.ride }));
      return data.ride;
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  },

  async cancelRide(id) {
    try {
      const data = await api.rides.cancel(id);
      window.dispatchEvent(new CustomEvent('rideUpdated', { detail: data.ride }));
      return data.ride;
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  },

  async deleteRide(id) {
    try {
      await api.rides.delete(id);
      
      // Remove from localStorage
      const localRides = JSON.parse(localStorage.getItem('localRides') || '[]');
      const filtered = localRides.filter(r => (r._id || r.id) !== id);
      localStorage.setItem('localRides', JSON.stringify(filtered));
      
      window.dispatchEvent(new CustomEvent('rideDeleted', { detail: { id } }));
      return true;
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  }
};

