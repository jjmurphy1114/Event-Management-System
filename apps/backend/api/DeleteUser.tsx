import * as admin from 'firebase-admin';
import { getDatabase } from "firebase-admin/database";
import express from 'express';

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://zm-parties-2-default-rtdb.firebaseio.com/',
  });
}

const app = express();
const database = getDatabase();

// API route to delete user
app.delete('/api/delete-user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(userId);

    // Remove user from the Realtime Database
    await database.ref(`users/${userId}`).remove();

    res.status(200).send('User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Error deleting user');
  }
});

export default app;
