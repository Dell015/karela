import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/database/firebase/config";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string; 
  username?: string;   
  isVerified: boolean;
  profilePicture?: string;
  stats: {
    age: number;
    weight: number;
    height: number;
    bmi: number;
    level: number;
    xp: number;
    fitness_score: number;
    ghostWins: number; 
    streak: number;
    longest_streak: number;
    last_active_date: string;
    total_distance_km: number;
    total_calories_burned: number;
    total_missions_completed: number;
    avg_pace_mins_km: number;
    target_weight: number;
  };
  settings: {
    units: 'metric' | 'imperial';
    notifications: boolean;
  };
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  reloadProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  reloadProfile: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadProfile = async () => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "New Strider",
              username: "Strider_" + firebaseUser.uid.slice(0, 4),
              isVerified: false,
              stats: {
                age: 20, weight: 70, height: 170, bmi: 24.2,
                level: 1, xp: 0, fitness_score: 1.0, ghostWins: 0,
                streak: 0, longest_streak: 0, last_active_date: new Date().toISOString(),
                total_distance_km: 0, total_calories_burned: 0, total_missions_completed: 0,
                avg_pace_mins_km: 0, target_weight: 70,
              },
              settings: { units: "metric", notifications: true },
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
    <AuthContext.Provider value={{ user, profile, loading, reloadProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);