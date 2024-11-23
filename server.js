const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');  // To handle HMAC signature verification
const cors = require('cors');
const app = express();

app.use(cors());  // To allow frontend to communicate with the backend
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

// Create Razorpay order with routes (payment splitting)
app.post('/create-order', async (req, res) => {
    const { totalAmount, billAmount, tipAmount, workerId } = req.body;

    try {
        // Define the route to split payment
        const route = {
            recipients: [
                {
                    account: '9483278461@ptsbi',  // Hotel UPI ID (Receiver)
                    amount: billAmount * 100,  // Hotel portion in paise
                    notes: { purpose: 'Hotel payment' }
                },
                {
                    account: '9481389731@axl',  // Worker UPI ID (Receiver)
                    amount: tipAmount * 100,  // Worker portion in paise
                    notes: { purpose: 'Tip payment' }
                }
            ]
        };

        // Create the payment route
        const routeResponse = await razorpay.routes.create(route);

        // Create a Razorpay order
        const order = await razorpay.orders.create({
            amount: totalAmount * 100, // Total amount to be paid by the customer (in paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
            notes: routeResponse // Attach route info to order
        });

        // Send the order ID back to the client
        res.json({
            success: true,
            order_id: order.id,
            route_id: routeResponse.id  // Sending route ID for tracking
        });

    } catch (error) {
        console.error("Error creating Razorpay order", error);
        res.json({ success: false, message: error.message });
    }
});

// Webhook to handle Razorpay payment notifications
app.post('/webhook', (req, res) => {
    const secret = 'vJ2iYhcEmJfrDOGad0FIfZYT'; // Replace with your Razorpay secret key
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha256', secret)
                                    .update(body)
                                    .digest('hex');

    if (signature === expectedSignature) {
        console.log('Webhook verified:', req.body);

        // Payment status update logic
        const { payment } = req.body.payload;

        if (payment.entity.status === 'captured') {
            console.log('Payment captured successfully!');

            // Payment has been successfully captured and the amounts have been transferred to the hotel and worker
            res.status(200).send('OK');
        } else {
            console.log('Payment failed');
            res.status(400).send('Payment failed');
        }

    } else {
        console.error('Invalid webhook signature');
        res.status(400).send('Invalid signature');
        return;
    }
});

// Payment status route to handle payment confirmation from frontend
app.post('/payment-status', (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, workerId, billAmount, tipAmount } = req.body;

    const secret = 'vJ2iYhcEmJfrDOGad0FIfZYT'; // Razorpay secret key
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(razorpay_order_id + "|" + razorpay_payment_id).digest('hex');

    if (razorpay_signature === expectedSignature) {
        console.log('Payment verification successful');
        res.json({ success: true, message: 'Payment split and payout completed' });
    } else {
        console.error('Invalid signature');
        res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
