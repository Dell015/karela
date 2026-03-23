import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration from your screenshot
const firebaseConfig = {
  apiKey: "AIzaSyDm3NkBTP3bu7syf0JFMdWt1ix9g0HgPI4",
  authDomain: "karela-628fe.firebaseapp.com",
  projectId: "karela-628fe",
  storageBucket: "karela-628fe.firebasestorage.app",
  messagingSenderId: "200356847193",
  appId: "1:200356847193:web:8553cf54bbc0bbde08db48",
  measurementId: "G-CLEGK7PJWJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services so your Signup and Dashboard can use them
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;