const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const { sendPushNotification, sendSMS } = require('./notifications');

class RideScheduler {
  constructor() {
    this.checkInterval = null;
  }

  start() {
    // Check every minute for rides that need driver assignment
    this.checkInterval = setInterval(() => this.processScheduledRides(), 60000);
    console.log('🕐 Ride scheduler started');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      console.log('🕐 Ride scheduler stopped');
    }
  }

  async processScheduledRides() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 15 * 60000); // 15 mins from now
    const windowEnd = new Date(now.getTime() + 20 * 60000);   // 20 mins from now

    try {
      // Find rides scheduled within next 15-20 minutes that haven't been processed
      const rides = await Ride.find({
        status: 'scheduled',
        isScheduled: true,
        scheduledFor: {
          $gte: windowStart,
          $lte: windowEnd
        },
        driverAssignedAt: { $exists: false }
      }).populate('user');

      for (const ride of rides) {
        await this.assignDriver(ride);
      }

      // Send reminders for rides in 1 hour
      await this.sendReminders();

    } catch (error) {
      console.error('Scheduler error:', error);
    }
  }

  async assignDriver(ride) {
    try {
      // Find available driver matching preferences
      const query = {
        isAvailable: true,
        'vehicle.type': ride.vehicleType
      };

      if (ride.preferences.femaleDriver) {
        query.gender = 'female';
      }

      const driver = await Driver.findOne(query).sort({ rating: -1 });

      if (!driver) {
        // No driver available - notify user
        await this.notifyNoDriverAvailable(ride);
        return;
      }

      // Assign driver
      ride.driver = driver._id;
      ride.status = 'confirmed';
      ride.driverAssignedAt = new Date();
      await ride.save();

      // Mark driver as busy
      driver.isAvailable = false;
      await driver.save();

      // Notify user
      await sendPushNotification(ride.user._id, {
        title: 'Driver Assigned! 🚗',
        body: `${driver.name} will pick you up at ${ride.pickup.address}`,
        data: { rideId: ride._id, type: 'driver_assigned' }
      });

      // Notify driver
      await sendPushNotification(driver._id, {
        title: 'New Scheduled Ride',
        body: `Pickup: ${ride.pickup.address} at ${this.formatTime(ride.scheduledFor)}`,
        data: { rideId: ride._id, type: 'new_ride' }
      });

      console.log(`✅ Driver ${driver.name} assigned to ride ${ride._id}`);

    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  }

  async sendReminders() {
    const oneHourFromNow = new Date(Date.now() + 60 * 60000);
    const windowStart = new Date(oneHourFromNow.getTime() - 2 * 60000);
    const windowEnd = new Date(oneHourFromNow.getTime() + 2 * 60000);

    const rides = await Ride.find({
      status: { $in: ['scheduled', 'confirmed'] },
      reminderSent: { $ne: true },
      scheduledFor: {
        $gte: windowStart,
        $lte: windowEnd
      }
    }).populate('user');

    for (const ride of rides) {
      await sendPushNotification(ride.user._id, {
        title: 'Ride Reminder ⏰',
        body: `Your ride to ${ride.dropoff.address} is in 1 hour`,
        data: { rideId: ride._id, type: 'reminder' }
      });

      // Also send SMS as backup
      await sendSMS(ride.user.phone, 
        `LuxeRide Reminder: Your scheduled ride from ${ride.pickup.address} is at ${this.formatTime(ride.scheduledFor)}. OTP: ${ride.otp}`
      );

      ride.reminderSent = true;
      await ride.save();
    }
  }

  async notifyNoDriverAvailable(ride) {
    await sendPushNotification(ride.user._id, {
      title: 'Driver Availability Issue',
      body: 'We\'re having trouble finding a driver. We\'ll keep trying or you can reschedule.',
      data: { rideId: ride._id, type: 'no_driver' }
    });

    // Send SMS with option to reschedule
    await sendSMS(ride.user.phone,
      `LuxeRide: We're searching for a driver for your ${this.formatTime(ride.scheduledFor)} ride. Reply RESCHEDULE to change time or CANCEL to cancel.`
    );
  }

  formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

module.exports = new RideScheduler();