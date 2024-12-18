const path = require('path');
const { app } = require('../config/firebase');


// Send notification to a single device
exports.sendToDevice = async (fcmToken, title, body, data = {}) => {
  try {
    if (!fcmToken) {
      console.log('No FCM token provided');
      return null;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // For Flutter apps
      },
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'welcome_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await app.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

// Send notification to multiple devices
exports.sendToMultipleDevices = async (fcmTokens, title, body, data = {}) => {
  try {
    // Filter out null/undefined tokens
    const validTokens = fcmTokens.filter(token => token);
    
    if (validTokens.length === 0) {
      console.log('No valid FCM tokens provided');
      return null;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // For Flutter apps
      },
      tokens: validTokens,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'welcome_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await app.messaging().sendMulticast(message);
    console.log('Successfully sent messages:', response);
    return response;
  } catch (error) {
    console.error('Error sending messages:', error);
    return null;
  }
};
