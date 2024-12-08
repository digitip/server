const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
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
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.post('/savePayment', async (req, res) => {
  try {
    // Extract the necessary fields from the request body
    const { billAmount, tipAmount, workerID, hotelName } = req.body;

    // Validate that all necessary fields are present
    if (!billAmount || !tipAmount || !workerID || !hotelName) {
      return res.status(400).send({ error: 'Missing required fields' });
    }

    // Log the incoming request for debugging
    console.log('Received request body:', req.body);

    // Save payment details in Firestore
    await db.collection('payments').add({
      billAmount,
      tipAmount,
      workerID,
      hotelName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Respond with a success message
    res.status(200).send({ message: 'Payment saved successfully' });
  } catch (error) {
    // Log the detailed error for debugging
    console.error('Error during payment save:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
