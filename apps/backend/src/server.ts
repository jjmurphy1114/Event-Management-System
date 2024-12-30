import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import serviceAccountJSON from 'backend/lib/zm-parties-service-account-key.json';

// Initialize Firebase Admin SDK (once)
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccountJSON.project_id,
      clientEmail: serviceAccountJSON.client_email,
      privateKey: serviceAccountJSON.private_key,
    }),
    databaseURL: 'https://zm-parties-2-default-rtdb.firebaseio.com/',
  });
}

const app = express();
const PORT = 5000;

// Middleware to handle CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Route to delete user by ID
app.delete('/api/delete-user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(userId);

    // Remove user from the Realtime Database
    await admin.database().ref(`users/${userId}`).remove();

    res.status(200).send('User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Error deleting user');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
