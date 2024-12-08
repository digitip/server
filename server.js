const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
const port = 3001; // You can change this if needed

app.use(bodyParser.json());
app.use(cors({
    origin: 'https://digitip-payment.onrender.com' // Change this to the origin you want to allow
}));


// Initialize Firebase Admin SDK (REPLACE with your service account key path)
const serviceAccount = require('./serviceAccountKey.json'); // <-- VERY IMPORTANT
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "digitip-c9a79.asia-south1.firebasedatabase.app" 
});

const db = admin.firestore();
const paymentsCollection = db.collection('payments');


app.post('/api/payments', async (req, res) => {
  try {
    const paymentData = req.body;

    // Basic input validation (add more robust validation as needed)
    if (!paymentData.billAmount || !paymentData.tipAmount || !paymentData.workerID) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Add timestamp before inserting
    paymentData.timestamp = admin.firestore.FieldValue.serverTimestamp();

    const docRef = await paymentsCollection.add(paymentData);
    res.status(201).json({ message: 'Payment recorded', paymentId: docRef.id });
  } catch (error) {
    console.error('Error saving payment:', error);
    res.status(500).json({ error: 'Failed to save payment' });
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
