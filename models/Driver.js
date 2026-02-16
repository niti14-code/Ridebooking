const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  vehicle: {
    type: { type: String, enum: ['cycle', 'bike', 'auto', 'sedan', 'suv', 'luxury'] },
    model: String,
    color: String,
    numberPlate: { type: String, required: true, unique: true }
  },
  isAvailable: { type: Boolean, default: true },
  rating: {
    average: { type: Number, default: 5 },
    count: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', driverSchema);