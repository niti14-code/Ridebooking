const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickup: {
    address: { type: String, required: true },
    coordinates: { lat: Number, lng: Number }
  },
  dropoff: {
    address: { type: String, required: true },
    coordinates: { lat: Number, lng: Number }
  },
  vehicleType: { 
    type: String, 
    enum: ['cycle', 'bike', 'auto', 'sedan', 'suv', 'luxury'],
    required: true 
  },
  status: {
    type: String,
    enum: ['scheduled', 'searching', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'  // Changed from 'searching' to 'scheduled'
  },
  fare: {
    baseFare: Number,
    distanceFare: Number,
    tax: Number,
    discount: { type: Number, default: 0 },
    total: Number
  },
  distance: Number,
  duration: Number,
  preferences: {
    femaleDriver: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false },
    wheelchair: { type: Boolean, default: false },
    silent: { type: Boolean, default: false }
  },
  otp: { type: String, required: true },
  promoCode: {
    code: String,
    discount: Number
  },
  
  // NEW: Scheduling fields
  scheduledFor: { 
    type: Date, 
    required: true 
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  driverAssignedAt: Date,
  
  createdAt: { type: Date, default: Date.now },
  cancelledAt: Date
});

// Index for efficient querying of upcoming rides
rideSchema.index({ scheduledFor: 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);