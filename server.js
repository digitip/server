const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors'); // For handling CORS

// Initialize Firebase Admin SDK using environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors({
  origin: 'https://digitip-payment.onrender.com', // Allow all origins (adjust for security as needed)
}));
app.use(bodyParser.json());

// POST endpoint to handle payment processing
app.post('/payment', async (req, res) => {
  const { hotelName, billAmount, tipAmount, workerId } = req.body;

  // Check for valid input
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
