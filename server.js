const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
app.use(bodyParser.json());

const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.post('/savePayment', async (req, res) => {
  try {
    const { billAmount, tipAmount, workerID, hotelName } = req.body;

    // Save payment details in Firestore
    await db.collection('payments').add({
      billAmount,
      tipAmount,
      workerID,
      hotelName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.send({ success: true });
  } catch (error) {
    console.error('Error saving payment details:', error);
    res.status(500).send({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
