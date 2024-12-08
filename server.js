const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 3001; // Use an environment variable for flexibility

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'https://digitip-payment.onrender.com' // Allow requests only from the specified frontend origin
}));

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // Ensure this path is correct

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://digitip-c9a79.asia-south1.firebasedatabase.app" // Use proper URL format
});

const db = admin.firestore();
const paymentsCollection = db.collection('payments');

// Endpoint to handle payment processing
app.post('/api/payments', async (req, res) => {
    try {
        const paymentData = req.body;
        console.log('Received payment data:', paymentData); // Log the incoming data

        // Basic input validation
        if (!paymentData.billAmount || !paymentData.tipAmount || !paymentData.workerID) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Add a timestamp before inserting
        paymentData.timestamp = admin.firestore.FieldValue.serverTimestamp();

        // Save payment data to Firestore
        const docRef = await paymentsCollection.add(paymentData);
        console.log('Payment recorded:', docRef.id);
        res.status(201).json({ message: 'Payment recorded', paymentId: docRef.id });

    } catch (error) {
        console.error('Error saving payment:', error); // Log the exact error for debugging
        res.status(500).json({ error: 'Failed to save payment' });
    }
});

// Fallback route for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
