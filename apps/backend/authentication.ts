import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";

const auth = getAuth();

signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
  });

signOut(auth).then(() => {
// Sign-out successful.
}).catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    
});

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to set persistence:", error);
});