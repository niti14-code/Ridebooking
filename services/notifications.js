// Simple notification service (integrate with Firebase, Twilio, etc.)
const notifications = {
  async sendPushNotification(userId, { title, body, data }) {
    // TODO: Integrate with Firebase Cloud Messaging
    console.log(`📱 Push to ${userId}: ${title} - ${body}`);
    
    // For now, store in user's notifications collection
    const Notification = require('../models/Notification');
    await Notification.create({
      user: userId,
      title,
      body,
      data,
      read: false,
      createdAt: new Date()
    });
  },

  async sendSMS(phoneNumber, message) {
    // TODO: Integrate with Twilio
    console.log(`📞 SMS to ${phoneNumber}: ${message}`);
  }
};

module.exports = notifications;