const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');  // Add this line
const admin = require('firebase-admin');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Use cors middleware and specify the frontend domain
app.use(cors({
  origin: 'https://digitip-payment.onrender.com', // Update this to your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

const serviceAccount = require(path.join(__dirname, 'service.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.post('/savePayment', async (req, res) => {
  try {
    const { billAmount, tipAmount, workerID, hotelName } = req.body;

    // Save payment details in Firestore
    await db.collection('payments').add({
      billAmount,
      tipAmount,
      workerID,
      hotelName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

   res.status(200).send({ success: true });
  } catch (error) {
    console.error(error); // Logs the error for debugging
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
