const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 3001; // Using an environment variable for flexibility

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'https://digitip-payment.onrender.com' // Allow requests from this origin
}));

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // Ensure the path is correct

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://digitip-c9a79.asia-south1.firebasedatabase.app" // Use proper URL format
});

const db = admin.firestore();
const paymentsCollection = db.collection('payments');

// Payment endpoint
app.post('/api/payments', async (req, res) => {
    try {
        const paymentData = req.body;

        // Basic input validation
        if (!paymentData.billAmount || !paymentData.tipAmount || !paymentData.workerID) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Add a timestamp before inserting
        paymentData.timestamp = admin.firestore.FieldValue.serverTimestamp();

        // Save payment data to Firestore
        const docRef = await paymentsCollection.add(paymentData);
        res.status(201).json({ message: 'Payment recorded', paymentId: docRef.id });

    } catch (error) {
        console.error('Error saving payment:', error); // Log the exact error
        res.status(500).json({ error: 'Failed to save payment' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
