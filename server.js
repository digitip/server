const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'YOUR_FIREBASE_DATABASE_URL'
});

// Replace 'YOUR_FIREBASE_DATABASE_URL' with your Firebase database URL

// Dummy endpoint to simulate a payment process
app.post('/payment', (req, res) => {
    const { hotelName, upiId, billAmount, tipAmount, workerId } = req.body;

    // Here you can add logic to save payment details to Firestore or send notifications

    console.log(`Payment details: Hotel=${hotelName}, UPI=${upiId}, Bill Amount=${billAmount}, Tip Amount=${tipAmount}, Worker ID=${workerId}`);
    res.send({ message: 'Payment processed successfully!' });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
