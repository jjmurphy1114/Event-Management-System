import * as admin from "firebase-admin";
import * as serviceAccount from "./zm-parties-service-account-key.json";  // Replace with your actual service account file

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: "https://zm-parties-2-default-rtdb.firebaseio.com/",
});

export const adminAuth = admin.auth();
export const adminDatabase = admin.database();
