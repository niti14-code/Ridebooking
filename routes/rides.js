const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');

// Create ride (supports both immediate and scheduled)
router.post('/', auth, async (req, res) => {
  try {
    const { 
      pickup, 
      dropoff, 
      vehicle, 
      vehicleType,
      fare, 
      distance, 
      duration, 
      preferences, 
      promoCode,
      scheduledFor  // NEW: ISO date string for scheduled rides
    } = req.body;

    // Validate pickup/dropoff
    if (!pickup || !dropoff) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pickup and dropoff locations are required' 
      });
    }

    // Determine if this is a scheduled ride
    const isScheduled = !!scheduledFor;
    const scheduleDate = isScheduled ? new Date(scheduledFor) : new Date();
    
    // Validate scheduled time (must be at least 30 mins in future)
    if (isScheduled) {
      const minScheduleTime = new Date(Date.now() + 30 * 60000);
      if (scheduleDate < minScheduleTime) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled rides must be at least 30 minutes in advance'
        });
      }

      // Max 7 days in advance
      const maxScheduleTime = new Date(Date.now() + 7 * 24 * 60 * 60000);
      if (scheduleDate > maxScheduleTime) {
        return res.status(400).json({
          success: false,
          message: 'Cannot schedule rides more than 7 days in advance'
        });
      }
    }

    const finalVehicleType = vehicleType || (vehicle && vehicle.id) || 'sedan';
    const fareData = fare || { baseFare: 0, distanceFare: 0, tax: 0, discount: 0, total: 0 };
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const ride = new Ride({
      user: req.user._id,
      pickup: {
        address: typeof pickup === 'string' ? pickup : pickup.address,
        coordinates: pickup.coordinates || { lat: 0, lng: 0 }
      },
      dropoff: {
        address: typeof dropoff === 'string' ? dropoff : dropoff.address,
        coordinates: dropoff.coordinates || { lat: 0, lng: 0 }
      },
      vehicleType: finalVehicleType,
      fare: {
        baseFare: fareData.baseFare || 0,
        distanceFare: fareData.distanceFare || 0,
        tax: fareData.tax || 0,
        discount: fareData.discount || 0,
        total: fareData.total || fareData || 0
      },
      distance: distance || 0,
      duration: duration || 0,
      preferences: preferences || {},
      otp,
      promoCode: promoCode || {},
      
      // NEW: Scheduling fields
      scheduledFor: scheduleDate,
      isScheduled: isScheduled,
      status: isScheduled ? 'scheduled' : 'searching'
    });

    await ride.save();

    // Prepare response
    const response = {
      success: true,
      ride: {
        ...ride.toObject(),
        vehicle: {
          id: finalVehicleType,
          name: finalVehicleType.charAt(0).toUpperCase() + finalVehicleType.slice(1),
          icon: getVehicleIcon(finalVehicleType)
        },
        formattedScheduledTime: isScheduled ? formatDateTime(scheduleDate) : null
      }
    };

    // Add scheduling-specific message
    if (isScheduled) {
      response.message = `Ride scheduled for ${formatDateTime(scheduleDate)}. We'll assign a driver 15 minutes before pickup.`;
      response.reminderSet = true;
    } else {
      response.message = 'Ride booked successfully!';
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create ride' 
    });
  }
});

// Get all rides (with filtering for scheduled/upcoming)
router.get('/', auth, async (req, res) => {
  try {
    const { filter } = req.query; // 'upcoming', 'past', 'scheduled'
    
    let query = { user: req.user._id };
    
    if (filter === 'upcoming') {
      query.scheduledFor = { $gte: new Date() };
      query.status = { $nin: ['completed', 'cancelled'] };
    } else if (filter === 'past') {
      query.$or = [
        { status: { $in: ['completed', 'cancelled'] } },
        { scheduledFor: { $lt: new Date() } }
      ];
    } else if (filter === 'scheduled') {
      query.isScheduled = true;
      query.status = 'scheduled';
    }

    const rides = await Ride.find(query)
      .sort({ scheduledFor: -1 })
      .lean();

    const transformedRides = rides.map(ride => ({
      ...ride,
      vehicle: {
        id: ride.vehicleType,
        name: ride.vehicleType.charAt(0).toUpperCase() + ride.vehicleType.slice(1),
        icon: getVehicleIcon(ride.vehicleType)
      },
      pickup: ride.pickup?.address || ride.pickup,
      dropoff: ride.dropoff?.address || ride.dropoff,
      isUpcoming: new Date(ride.scheduledFor) > new Date()
    }));

    res.json({ 
      success: true, 
      count: transformedRides.length, 
      rides: transformedRides 
    });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rides' });
  }
});

// Reschedule a ride
router.put('/:id/reschedule', auth, async (req, res) => {
  try {
    const { newScheduledTime } = req.body;
    const ride = await Ride.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot reschedule completed or cancelled rides' 
      });
    }

    if (ride.status === 'ongoing') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot reschedule ride in progress' 
      });
    }

    const newTime = new Date(newScheduledTime);
    const minScheduleTime = new Date(Date.now() + 30 * 60000);

    if (newTime < minScheduleTime) {
      return res.status(400).json({
        success: false,
        message: 'New time must be at least 30 minutes from now'
      });
    }

    // If driver already assigned, release them
    if (ride.driver) {
      const Driver = require('../models/Driver');
      await Driver.findByIdAndUpdate(ride.driver, { isAvailable: true });
      ride.driver = null;
      ride.driverAssignedAt = null;
      ride.status = 'scheduled';
    }

    ride.scheduledFor = newTime;
    ride.reminderSent = false; // Reset reminder
    await ride.save();

    res.json({
      success: true,
      message: `Ride rescheduled to ${formatDateTime(newTime)}`,
      ride: {
        ...ride.toObject(),
        formattedScheduledTime: formatDateTime(newTime)
      }
    });

  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to reschedule' });
  }
});

// Helper functions
function getVehicleIcon(type) {
  const icons = {
    bike: '🏍️', cycle: '🚲', auto: '🛺',
    sedan: '🚗', suv: '🚙', luxury: '🏎️'
  };
  return icons[type] || '🚗';
}

function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

module.exports = router;