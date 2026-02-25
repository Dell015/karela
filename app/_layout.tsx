import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // This hides headers for ALL screens in this stack
      }}
    />
  );
}