// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

// Import service account key JSON from file
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK with the service account credentials
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// Create an Express application
const app = express();

// Middleware to handle CORS and JSON parsing
app.use(cors({
  origin: 'https://digitip-payment.onrender.com', // Adjust this to your frontend's domain
}));
app.use(bodyParser.json());

// POST endpoint to handle payment processing
app.post('/payment', async (req, res) => {
  const { hotelName, billAmount, tipAmount, workerId } = req.body;

  // Validate input
  if (!hotelName || !billAmount || !tipAmount || !workerId) {
    return res.status(400).send({ error: 'Invalid data provided' });
  }

  try {
    const db = admin.firestore();
    // Add payment data to Firestore
    await db.collection('payments').add({
      hotelName,
      billAmount: parseFloat(billAmount),
      tipAmount: parseFloat(tipAmount),
      workerId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).send({ message: 'Payment processed successfully' });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).send({ error: 'Error processing payment', details: err.message });
  }
});

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
