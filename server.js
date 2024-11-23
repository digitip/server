const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');  // To handle HMAC signature verification
const cors = require('cors');
const app = express();

app.use(cors());  // To allow frontend to communicate with the backend
app.use(bodyParser.json());

const razorpay = new Razorpay({
    key_id: 'rzp_live_6oBi8IT9vcXsF0', // Replace with your Razorpay key
    key_secret: 'YmnNxMFjKAvinvmdpJ5jh6W2' // Replace with your Razorpay secret key
});

// Create Razorpay order
app.post('/create-order', async (req, res) => {
    const { totalAmount, billAmount, tipAmount, workerId } = req.body;

    try {
        // Create an order with Razorpay
        const order = await razorpay.orders.create({
            amount: totalAmount * 100, // Convert to paise
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

// Webhook to handle Razorpay payment notifications
app.post('/webhook', (req, res) => {
    const secret = 'YmnNxMFjKAvinvmdpJ5jh6W2'; // Replace with your Razorpay secret key
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha256', secret)
                                    .update(body)
                                    .digest('hex');

    if (signature === expectedSignature) {
        console.log('Webhook verified:', req.body);

        // Logic for payment splitting
        const { billAmount, tipAmount, workerId } = req.body.payload.payment.entity.notes;
        const hotelUpi = 'hotelupi@bank'; // Replace with actual hotel UPI ID
        const workerUpi = `worker-${workerId}@bank`; // Worker UPI ID

        // Example: Log the information for debugging
        console.log(`Splitting payment: Hotel UPI: ${hotelUpi}, Worker UPI: ${workerUpi}`);

        // Razorpay Payouts API (this is just an example and requires Payouts API access)
        // You can skip this part if you're unable to use Payouts API and handle it manually

        razorpay.payouts.create({
            account_number: hotelUpi,  // Hotel UPI
            amount: billAmount * 100,  // Amount for hotel in paise
            currency: 'INR',
            notes: { workerId }
        }).then((payoutResponse) => {
            console.log('Hotel payout response:', payoutResponse);
        }).catch((error) => {
            console.error('Error while processing payout to hotel:', error);
        });

        razorpay.payouts.create({
            account_number: workerUpi,  // Worker UPI
            amount: tipAmount * 100,    // Amount for worker in paise
            currency: 'INR',
            notes: { workerId }
        }).then((payoutResponse) => {
            console.log('Worker payout response:', payoutResponse);
        }).catch((error) => {
            console.error('Error while processing payout to worker:', error);
        });

    } else {
        console.error('Invalid webhook signature');
        res.status(400).send('Invalid signature');
        return;
    }

    res.status(200).send('OK');
});

// Start server
const port = process.env.PORT || 3000; // Make sure to use the correct port
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
