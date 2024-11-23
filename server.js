const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');  // To handle HMAC signature verification
const cors = require('cors');
const app = express();

app.use(cors());  // To allow frontend to communicate with the backend
app.use(bodyParser.json());

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
    const { totalAmount, billAmount, tipAmount, workerId } = req.body;

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

// Payment status route to handle payment confirmation from frontend
app.post('/payment-status', (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, workerId, billAmount, tipAmount } = req.body;

    const secret = 'vJ2iYhcEmJfrDOGad0FIfZYT'; // Razorpay secret key
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(razorpay_order_id + "|" + razorpay_payment_id).digest('hex');

    if (razorpay_signature === expectedSignature) {
        console.log('Payment verification successful');

        // Logic for splitting the payment (hotel and worker)
        const hotelUpi = 'hotelupi@bank'; // Replace with actual hotel UPI
        const workerUpi = `worker-${workerId}@bank`; // Worker UPI

        razorpay.payouts.create({
            account_number: hotelUpi,
            amount: billAmount * 100, // Hotel amount in paise
            currency: 'INR'
        })
        .then(() => {
            razorpay.payouts.create({
                account_number: workerUpi,
                amount: tipAmount * 100, // Worker tip in paise
                currency: 'INR'
            })
            .then(() => {
                res.json({ success: true, message: 'Payment split and payout completed' });
            })
            .catch(error => {
                console.error('Error processing worker payout:', error);
                res.json({ success: false, message: 'Failed to process worker payout' });
            });
        })
        .catch(error => {
            console.error('Error processing hotel payout:', error);
            res.json({ success: false, message: 'Failed to process hotel payout' });
        });
    } else {
        console.error('Invalid signature');
        res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
