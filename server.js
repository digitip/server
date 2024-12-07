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

// Endpoint to handle payment processing
app.post('/process-payment', (req, res) => {
    const { hotelName, hotelUPI, workerId, tipAmount, billAmount } = req.body;

    if (!hotelName || !hotelUPI || !workerId || !tipAmount || !billAmount) {
        return res.status(400).send({ error: 'Invalid data provided' });
    }

    // Log payment details for verification
    console.log(`Processing payment for Hotel: ${hotelName}`);
    console.log(`Bill Amount: ₹${billAmount}, Tip Amount: ₹${tipAmount}, Worker ID: ${workerId}`);

    // Save payment data to Firestore
    const db = admin.firestore();
    const paymentRef = db.collection('payments').doc();
    paymentRef.set({
        hotelName: hotelName,
        billAmount: billAmount,
        tipAmount: tipAmount,
        workerId: workerId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        res.send({ message: 'Payment processed successfully' });
    })
    .catch((error) => {
        console.error('Error saving payment data:', error);
        res.status(500).send({ error: 'Error processing payment' });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
