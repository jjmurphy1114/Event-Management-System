import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5b_gVBSgn-WQqvniO1VU1Cze5ANsj-kc",
  authDomain: "zm-parties-2.firebaseapp.com",
  projectId: "zm-parties-2",
  storageBucket: "zm-parties-2.appspot.com",
  messagingSenderId: "115188668937",
  appId: "1:115188668937:web:32c25b823d96726fe876d8",
  measurementId: "G-P5R0BYBFNV",
  databaseURL: "https://zm-parties-2-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);
