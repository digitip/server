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

// Endpoint to simulate payment
app.post('/payment', (req, res) => {
  const { hotelName, hotelUPI, workerId, tipAmount, billAmount } = req.body;

  if (!hotelName || !hotelUPI || !workerId || !tipAmount || !billAmount) {
    return res.status(400).send({ error: 'Invalid data provided' });
  }

  // Simulate processing payment
  console.log(`Processing payment for Hotel: ${hotelName}`);
  console.log(`Bill Amount: ₹${billAmount}, Tip Amount: ₹${tipAmount}, Worker ID: ${workerId}`);

  // Notify owner
  const ownerNotification = {
    notification: {
      title: 'Bill Payment Received',
      body: `₹${billAmount} has been credited to your hotel account.`,
    },
    topic: `owner-${hotelName}`,
  };

  // Notify worker
  const workerNotification = {
    notification: {
      title: 'Tip Received',
      body: `₹${tipAmount} has been credited to your account.`,
    },
    topic: `worker-${workerId}`,
  };

  // Send notifications
  admin.messaging()
    .sendMulticast([ownerNotification, workerNotification])
    .then((response) => {
      console.log('Notifications sent:', response);
      res.send({ message: 'Payment processed successfully' });
    })
    .catch((error) => {
      console.error('Error sending notifications:', error);
      res.status(500).send({ error: 'Error sending notifications' });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
