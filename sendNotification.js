const admin = require('firebase-admin');

// Load Firebase Admin credentials (replace with your Firebase admin SDK JSON file path)
const serviceAccount = require('./path-to-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Function to send notifications to a topic
function sendNotificationToTopic(topic, title, body) {
    const message = {
        notification: {
            title: title,
            body: body,
        },
        topic: topic,
    };

    admin.messaging().send(message)
        .then((response) => {
            console.log(`Notification sent to ${topic}:`, response);
        })
        .catch((error) => {
            console.error(`Error sending notification to ${topic}:`, error);
        });
}

// Example: Send notification to an owner
sendNotificationToTopic('owner-HotelAdugemane', 'Payment Received', '₹500 received from a customer.');

// Example: Send notification to a worker
sendNotificationToTopic('worker-worker123', 'Tip Received', '₹100 tip received.');
