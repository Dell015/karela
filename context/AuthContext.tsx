// context/AuthContext.tsx
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/database/firebase/config";

// 1. UPDATED: Expanded Interface for a Thesis-Grade Fitness Engine
interface UserProfile {
  uid: string;
  email: string;
  displayName: string; 
  username?: string;   
  isVerified: boolean;
  stats: {
    // Bio Data
    age: number;
    weight: number;
    height: number;
    bmi: number;
    
    // Progression
    level: number;
    xp: number;
    fitness_score: number;
    
    // Consistency & History
    streak: number;
    longest_streak: number;
    last_active_date: string;
    
    // Performance Totals (Future-proofing the Progress Screen)
    total_distance_km: number;
    total_calories_burned: number;
    total_missions_completed: number;
    avg_pace_mins_km: number;
    
    // Goals
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
            setProfile(docSnap.data() as UserProfile);
          } else {
            // 2. UPDATED FALLBACK: Standardize new profile structure
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "New Strider",
              username: "Strider_" + firebaseUser.uid.slice(0, 4),
              isVerified: false,
              stats: {
                age: 20, // Default placeholders
                weight: 70,
                height: 170,
                bmi: 24.2,
                level: 1,
                xp: 0,  
                fitness_score: 1.0,
                streak: 0,
                longest_streak: 0,
                last_active_date: new Date().toISOString(),
                total_distance_km: 0,
                total_calories_burned: 0,
                total_missions_completed: 0,
                avg_pace_mins_km: 0,
                target_weight: 70,
              },
              settings: {
                units: "metric",
                notifications: true,
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