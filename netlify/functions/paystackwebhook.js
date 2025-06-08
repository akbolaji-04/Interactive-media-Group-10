// Handles Paystack webhooks to mark users as subscribed
  const admin = require('firebase-admin');
  admin.initializeApp();
  const db = admin.firestore();

  exports.handler = async (event) => {
    const payload = JSON.parse(event.body);
    if (payload.event === 'charge.success') {
      const uid = payload.data.metadata.uid;
      await db.collection('users').doc(uid).set({ subscribed: true }, { merge: true });
    }
    return { statusCode: 200 };
  };