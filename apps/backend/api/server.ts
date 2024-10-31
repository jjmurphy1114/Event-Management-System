import express, { Request, Response } from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://zm-parties-2-default-rtdb.firebaseio.com/"
});

// Delete user route
app.delete("/api/delete-user/:id", async (req: Request, res: Response) => {
  const userId = req.params.id;

  try {
    await admin.auth().deleteUser(userId);
    res.status(200).send({ message: "User successfully deleted." });
  } catch (error) {
    res.status(500).send({ error: `Error deleting user: ${error.message}` });
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
