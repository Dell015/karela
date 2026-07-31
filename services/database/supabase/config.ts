import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Fail with an actionable message instead of passing `|| ""` into createClient.
// An empty url makes supabase-js throw a bare "supabaseUrl is required." from
// inside the library at module-load time, which crashes the whole app (this
// module is imported by AuthContext, which wraps every screen) and gives no
// hint about which variable is missing or where to set it.
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && "EXPO_PUBLIC_SUPABASE_URL",
    !supabaseAnonKey && "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  ]
    .filter(Boolean)
    .join(", ");

  throw new Error(
    `Supabase is not configured — missing ${missing}. ` +
      `Add it to the .env file in the project root (see .env.example for the format), ` +
      `then restart the dev server with "npx expo start --clear". ` +
      `EXPO_PUBLIC_* variables are inlined at build time, so a plain reload will not pick them up.`
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Required for React Native
    },
  }
);
