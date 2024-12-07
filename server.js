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
    res.send({ message: 'Payment processed successfully' });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).send({ error: 'Error processing payment' });
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
