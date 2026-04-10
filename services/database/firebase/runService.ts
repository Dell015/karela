import { db } from "./config";
import { collection, addDoc } from "firebase/firestore";

export const logRunToFirebase = async (uid: string, runData: any) => {
  try {
    await addDoc(collection(db, "users", uid, "run_history"), {
      ...runData,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error logging run:", e);
  }
};