// context/AuthContext.tsx
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/database/firebase/config"; // Adjusted path check

// 1. Updated Interface to match your Firestore "stats" nesting
interface UserProfile {
  uid: string;
  email: string;
  displayName: string; // The Real Name (e.g., Randel)
  username?: string;    // The Handle (e.g., Randel_015)
  isVerified: boolean;
  stats: {
    level: number;
    xp: number;
    streak?: number;
    fitness_score?: number;
    total_meters?: number;
  };
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            // 2. Fetch the existing profile
            setProfile(docSnap.data() as UserProfile);
          } else {
            // 3. Fallback for new users (Matching your registration structure)
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "New Strider",
              username: "Strider_" + firebaseUser.uid.slice(0, 4), // Generic handle
              isVerified: false,
              stats: {
                level: 1,
                xp: 0,
                streak: 0,
                fitness_score: 1.0,
              },
              createdAt: new Date().toISOString(),
            };
            setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);