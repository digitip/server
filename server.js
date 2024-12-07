const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin SDK using environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

// Set up CORS to allow specific origins
app.use(cors({
  origin: 'https://digitip-payment.onrender.com', // Adjust for more secure handling of allowed origins
}));
app.use(bodyParser.json());

// POST endpoint to handle payment processing
app.post('/payment', async (req, res) => {
  const { hotelName, billAmount, tipAmount, workerId } = req.body;

  // Validate inputs
  if (!hotelName || !billAmount || !tipAmount || !workerId) {
    return res.status(400).send({ error: 'All fields (hotelName, billAmount, tipAmount, workerId) are required' });
  }

  // Check if billAmount and tipAmount are valid numbers
  if (isNaN(billAmount) || isNaN(tipAmount) || billAmount < 0 || tipAmount < 0) {
    return res.status(400).send({ error: 'Bill amount and tip amount must be valid non-negative numbers' });
  }

  // Check if workerId is a valid number
  if (isNaN(workerId) || workerId <= 0) {
    return res.status(400).send({ error: 'Worker ID must be a positive number' });
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

    // Send success response
    res.status(201).send({ message: 'Payment processed successfully' });
  } catch (err) {
    console.error('Error processing payment:', err);
    // Send error response with detailed message
    res.status(500).send({ error: 'Error processing payment', details: err.message });
  }
});

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
