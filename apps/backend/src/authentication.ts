// import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
//
// const auth = getAuth();

// signInWithEmailAndPassword(auth, email, password)
//   .then((userCredential) => {
//     // Signed in
//     const user = userCredential.user;
//     // ...
//   })
//   .catch((error) => {
//     console.error(`Error occurred during log in! Code: ${error.code} | Message: ${error.message}`);
//   });
//
// signOut(auth).then(() => {
// // Sign-out successful.
// }).catch((error) => {
//     console.error(`Error occurred during log out! Code: ${error.code} | Message: ${error.message}`);
// });
//
// setPersistence(auth, browserLocalPersistence).catch((error) => {
//   console.error("Failed to set persistence:", error);
// });