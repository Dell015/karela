import { supabase } from "./config";

/**
 * Registers a user in Supabase Auth.
 * Initial profile data (display_name, username, stats, settings) is passed
 * as user_metadata; the `handle_new_user` SQL trigger creates the profiles row.
 * Supabase sends a confirmation email automatically (if enabled in Auth settings).
 */
export const registerUser = async (
  email: string,
  password: string,
  userData: {
    displayName: string;
    username: string;
    stats: Record<string, any>;
    settings: Record<string, any>;
  }
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: userData.displayName,
        username: userData.username,
        stats: userData.stats,
        settings: userData.settings,
      },
    },
  });

  if (error) throw error;
  return data.user?.id;
};

/**
 * Signs in with email/password.
 * If email confirmation is enabled and the user hasn't confirmed,
 * Supabase returns an "Email not confirmed" error.
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resendVerification = async (email: string) => {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw error;
};
