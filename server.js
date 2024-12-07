const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Endpoint to process payment
app.post('/process-payment', async (req, res) => {
    const { hotelName, hotelUPI, workerId, tipAmount, billAmount } = req.body;

    if (!hotelName || !hotelUPI || !workerId || !tipAmount || !billAmount) {
        return res.status(400).send({ error: 'Invalid input data provided' });
    }

    try {
        const db = admin.firestore();
        await db.collection('payments').add({
            hotelName: hotelName,
            billAmount: billAmount,
            tipAmount: tipAmount,
            workerId: workerId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).send({ message: 'Payment processed successfully' });
    } catch (error) {
        console.error('Error saving payment data:', error);
        res.status(500).send({ error: 'Error processing payment' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
