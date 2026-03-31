import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

/**
 * Registers a user in Firebase Auth and creates a Firestore profile.
 * @param userData - The structured object built in the Signup screen.
 */
export const registerUser = async (email: string, password: string, userData: any) => {
  // 1. Create the user in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Send the verification email immediately
  await sendEmailVerification(user);

  // 3. Save the profile to Firestore
  // We spread (...userData) so that 'displayName', 'stats', and 'settings'
  // are saved exactly as you defined them in the Signup.tsx file.
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    isVerified: false, // Default to false until they click the email link
    ...userData, 
  });

  return user.uid;
};