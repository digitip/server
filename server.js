const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto'); // To handle HMAC signature verification
const cors = require('cors');
const admin = require('firebase-admin'); // Firebase Admin SDK
const app = express();

// Initialize Firebase Admin SDK
const serviceAccount = require('./path-to-your-service-account-file.json'); // Replace with your service account path
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-database-name.firebaseio.com" // Replace with your Firestore database URL
});
const db = admin.firestore();

app.use(cors()); // To allow frontend to communicate with the backend
app.use(bodyParser.json());

// Set up Razorpay instance with your test API key and secret
const razorpay = new Razorpay({
    key_id: 'rzp_test_0ybxoSsP3gjRad', // Replace with your Razorpay test key
    key_secret: 'vJ2iYhcEmJfrDOGad0FIfZYT' // Replace with your Razorpay test secret key
});

// Root route to check if the server is up and running
app.get('/', (req, res) => {
    res.send('Digitip Backend is Running');
});

// Create Razorpay order
app.post('/create-order', async (req, res) => {
    const { totalAmount } = req.body;

    try {
        // Create an order with Razorpay
        const order = await razorpay.orders.create({
            amount: totalAmount * 100, // Convert to paise (Razorpay uses paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        });

        // Send the order ID back to the client
        res.json({
            success: true,
            order_id: order.id
        });
    } catch (error) {
        console.error("Error creating Razorpay order", error);
        res.json({ success: false, message: error.message });
    }
});

// Payment status route with dynamic Firestore queries
app.post('/payment-status', async (req, res) => {
    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        hotel_name, // Passed from the QR code
        workerId, // Entered by the user
        billAmount,
        tipAmount
    } = req.body;

    try {
        // Verify Razorpay signature
        const secret = 'vJ2iYhcEmJfrDOGad0FIfZYT'; // Replace with your Razorpay secret key
        const hmac = crypto.createHmac('sha256', secret);
        const expectedSignature = hmac.update(razorpay_order_id + "|" + razorpay_payment_id).digest('hex');

        if (razorpay_signature !== expectedSignature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        console.log('Payment verification successful');

        // Fetch hotel UPI from Firestore
        const hotelDoc = await db.collection('ownerInfo').doc(hotelName).get();
        if (!hotelDoc.exists) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }
        const upiId = hotelDoc.data().upi_id;

        // Fetch worker UPI from Firestore
        const workerDoc = await db.collection('workers').doc(hotelName).get();
        if (!workerDoc.exists) {
            return res.status(404).json({ success: false, message: 'Worker not found' });
        }
        const workerUpi = workerDoc.data().upi_id;

        // Debugging logs
        console.log(`Hotel UPI: ${upiId}, Worker UPI: ${workerUpi}`);

        // Process payouts (requires Razorpay Payouts API access)
        await razorpay.payouts.create({
            account_number: upiId,
            amount: billAmount * 100, // Convert to paise
            currency: 'INR'
        });
        await razorpay.payouts.create({
            account_number: workerUpi,
            amount: tipAmount * 100, // Convert to paise
            currency: 'INR'
        });

        res.json({ success: true, message: 'Payment split and payouts completed' });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.json({ success: false, message: error.message });
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
