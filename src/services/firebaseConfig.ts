import {initializeApp} from "firebase/app";
import {getDatabase} from "firebase/database";
import {getAnalytics} from "firebase/analytics";
import {getFunctions, connectFunctionsEmulator} from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBRkCiaHTsUbEbOB5lnpcVQv0OMabhbzoU",
  authDomain: "event-management-system-f7160.firebaseapp.com",
  projectId: "event-management-system-f7160",
  storageBucket: "event-management-system-f7160.firebasestorage.app",
  messagingSenderId: "30715869607",
  appId: "1:30715869607:web:fb3741f07c1e1613d79e82",
  measurementId: "G-W0QB77YNWE"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);

if(process.env.NODE_ENV === "development") {
  connectFunctionsEmulator(getFunctions(app), "localhost", 5001);
}

export {app, database, analytics}