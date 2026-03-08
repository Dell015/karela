// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initDatabase } from '@/services/database/database'; // Adjust path if needed

export default function RootLayout() {

  
  useEffect(() => {
    // Run this immediately on app launch
    try {
      initDatabase();
      console.log("Database initialized successfully");
    } catch (err) {
      console.error("Database failed to initialize", err);
    }
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}