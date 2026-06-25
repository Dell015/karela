import { setStats, updateProfile } from "./profiles";

// Maps the app's camelCase top-level field names → DB columns.
const COLUMN_MAP: Record<string, string> = {
  displayName: "display_name",
  username: "username",
  profilePicture: "profile_picture",
  isVerified: "is_verified",
};

/**
 * Updates a user's profile. Accepts the legacy Firestore-style payload where
 * nested stat fields use dot-notation (e.g. "stats.ai_notes"). Splits the
 * payload into top-level column updates and stats JSONB updates.
 */
export const updateUserProfileData = async (
  uid: string,
  updates: Record<string, any>
) => {
  const columnUpdates: Record<string, any> = {};
  const statUpdates: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (key.startsWith("stats.")) {
      statUpdates[key.slice("stats.".length)] = value;
    } else if (COLUMN_MAP[key]) {
      columnUpdates[COLUMN_MAP[key]] = value;
    } else {
      // assume it's already a valid column name
      columnUpdates[key] = value;
    }
  }

  if (Object.keys(columnUpdates).length > 0) {
    await updateProfile(uid, columnUpdates);
  }
  if (Object.keys(statUpdates).length > 0) {
    await setStats(uid, statUpdates);
  }
};
