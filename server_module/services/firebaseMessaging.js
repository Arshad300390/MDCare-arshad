// services/firebaseMessaging.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Send a high-priority data-only FCM message to a single device
 * @param {string} token - FCM token of the target device
 * @param {object} dataPayload - Key-value pairs (must all be strings)
 */
async function sendFCMMessage(token, dataPayload) {
  // Ensure all data values are strings (required by FCM)
  const stringifiedData = {};
  Object.keys(dataPayload).forEach(key => {
    stringifiedData[key] = String(dataPayload[key]);
  });

  const message = {
    token,
    data: stringifiedData,
    android: {
      priority: 'high',
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ FCM sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending FCM:', error);
    throw error;
  }
}

module.exports = { sendFCMMessage };
