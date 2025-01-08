import {initializeApp} from "firebase/app";
import {getDatabase} from "firebase/database";
import {getAnalytics} from "firebase/analytics";
import {getFunctions, connectFunctionsEmulator} from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyC5b_gVBSgn-WQqvniO1VU1Cze5ANsj-kc",
  authDomain: "zm-parties-2.firebaseapp.com",
  databaseURL: "https://zm-parties-2-default-rtdb.firebaseio.com",
  projectId: "zm-parties-2",
  storageBucket: "zm-parties-2.firebasestorage.app",
  messagingSenderId: "115188668937",
  appId: "1:115188668937:web:32c25b823d96726fe876d8",
  measurementId: "G-P5R0BYBFNV"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);

if(process.env.NODE_ENV === "development") {
  connectFunctionsEmulator(getFunctions(app), "localhost", 5001);
}

export {app, database, analytics}