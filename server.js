const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(bodyParser.json());

// Payment Endpoint
app.post('/payment', async (req, res) => {
  const { hotelName, billAmount, tipAmount, workerId } = req.body;

  // Validate incoming request
  if (!hotelName || !billAmount || !tipAmount || !workerId) {
    return res.status(400).send({ error: 'Invalid data provided. Please provide all required fields.' });
  }

  try {
    const db = admin.firestore();

    // Save payment details to Firestore
    await db.collection('payments').add({
      hotelName,
      billAmount: parseFloat(billAmount),
      tipAmount: parseFloat(tipAmount),
      workerId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify owner about bill payment
    const ownerNotification = {
      notification: {
        title: 'Bill Payment Received',
        body: `₹${billAmount} has been credited to your hotel account.`,
      },
      topic: `owner-${hotelName}`,
    };

    // Notify worker about tip received
    const workerNotification = {
      notification: {
        title: 'Tip Received',
        body: `₹${tipAmount} has been credited to your account.`,
      },
      topic: `worker-${workerId}`,
    };

    // Send Notifications
    await admin.messaging().sendAll([ownerNotification, workerNotification]);

    res.status(200).send({ message: 'Payment processed successfully.' });
  } catch (error) {
    console.error('Error processing payment:', error.message);
    res.status(500).send({ error: 'Error processing payment. Please try again later.' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
