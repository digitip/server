const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
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

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
