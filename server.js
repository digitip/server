const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // For handling CORS
const admin = require('firebase-admin');

// Path to your service account key
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// POST endpoint to handle payment processing
app.post('/payment', async (req, res) => {
  const { hotelName, billAmount, tipAmount, workerId } = req.body;

  if (!hotelName || !billAmount || !tipAmount || !workerId) {
    return res.status(400).send({ error: 'Invalid data provided' });
  }

  try {
    const db = admin.firestore();
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
