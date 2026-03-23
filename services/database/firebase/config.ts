import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  getReactNativePersistence // Try importing from the main folder
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDm3NkBTP3bu7syF0JFMdWt1iX9g0HgPI4",
  authDomain: "karela-628fe.firebaseapp.com",
  projectId: "karela-628fe",
  storageBucket: "karela-628fe.firebasestorage.app",
  messagingSenderId: "200356847193",
  appId: "1:200356847193:web:8553cf54bbc0bbde08db48",
  measurementId: "G-CLEGK7PJWJ"
};

const app = initializeApp(firebaseConfig);

// 2. Initialize Auth using the specific React Native persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export default app;