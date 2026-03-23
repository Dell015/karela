import { auth, db } from "./config";
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification // <-- Add this import
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export const registerUser = async (email: string, password: string, userData: any) => {
  // 1. Create the user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. NEW: Send the Verification Email immediately
  await sendEmailVerification(user);

  // 3. Create the Profile in Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: email,
    displayName: userData.fullName,
    isVerified: false, // Track this for your UI
    stats: {
      weight: userData.bio.weight,
      height: userData.bio.height,
      age: userData.bio.age,
      bmi: userData.bio.bmi,
      xp: 0,
      level: 1,
      fitness_score: 1.0,
    },
    createdAt: new Date().toISOString(),
  });

  return user.uid;
};