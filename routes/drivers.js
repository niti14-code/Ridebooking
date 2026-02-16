const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');

// Get nearby drivers
router.get('/nearby', async (req, res) => {
  try {
    const { vehicleType } = req.query;
    const query = { isAvailable: true };
    if (vehicleType) query['vehicle.type'] = vehicleType;

    const drivers = await Driver.find(query).limit(5);
    res.json({ success: true, count: drivers.length, drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Seed test drivers - accepts both GET and POST
router.all('/seed', async (req, res) => {
  try {
    // Check if drivers already exist
    const existingCount = await Driver.countDocuments();
    if (existingCount > 0) {
      return res.json({ 
        success: true, 
        message: 'Drivers already seeded',
        count: existingCount 
      });
    }

    const drivers = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@luxeride.com',
        password: 'password123',
        phone: '+91 98765 43210',
        gender: 'male',
        vehicle: { type: 'sedan', model: 'Toyota Camry', color: 'Black', numberPlate: 'DL01AB1234' }
      },
      {
        name: 'Priya Singh',
        email: 'priya@luxeride.com',
        password: 'password123',
        phone: '+91 98765 43211',
        gender: 'female',
        vehicle: { type: 'sedan', model: 'Honda City', color: 'White', numberPlate: 'DL01CD5678' }
      },
      {
        name: 'Amit Shah',
        email: 'amit@luxeride.com',
        password: 'password123',
        phone: '+91 98765 43212',
        gender: 'male',
        vehicle: { type: 'luxury', model: 'Mercedes S-Class', color: 'Silver', numberPlate: 'DL01EF9012' }
      }
    ];

    await Driver.insertMany(drivers);
    res.json({ success: true, message: 'Drivers seeded successfully', count: drivers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;