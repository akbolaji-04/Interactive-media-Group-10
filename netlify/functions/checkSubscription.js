// Returns whether a user is still in free trial or subscribed
  const admin = require('firebase-admin');
  admin.initializeApp();
  const db = admin.firestore();

  exports.handler = async (event) => {
    const { uid } = JSON.parse(event.body);
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      return { statusCode: 404, body: JSON.stringify({ active: false }) };
    }
    const data = doc.data();
    const trialStart = data.trialStart.toDate();
    const subscribed = data.subscribed;
    const daysElapsed = (Date.now() - trialStart) / 864e5;
    const active = subscribed || daysElapsed <= 3;
    return { statusCode: 200, body: JSON.stringify({ active }) };
  };