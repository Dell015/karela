import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { Linking } from "react-native";

import { supabase } from "@/services/database/supabase/config";
import { updateProfile } from "@/services/database/supabase/profiles";

/**
 * Profile pictures: pick or take a photo, crop it square, upload it to the
 * "avatars" bucket (supabase/09_profile_pictures.sql) and save the URL in
 * profiles.profile_picture.
 *
 * Kept small for prepaid data: a square crop at JPEG quality 0.5, and
 * anything still over MAX_BYTES is refused before upload.
 */

const BUCKET = "avatars";
const MAX_BYTES = 1_500_000;

export type PhotoSource = "camera" | "library";

/** Thrown when the user needs to allow access in the phone settings. */
export class PermissionBlockedError extends Error {
  constructor(what: string) {
    super(`Karela can't open your ${what}. Allow it for Karela in your phone settings.`);
  }
}

export const openPhoneSettings = () => Linking.openSettings();

const pick = async (source: PhotoSource) => {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
    exif: false, // no GPS or camera details leave the phone
  };

  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new PermissionBlockedError("camera");
    return ImagePicker.launchCameraAsync(options);
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new PermissionBlockedError("photos");
  return ImagePicker.launchImageLibraryAsync(options);
};

/** Removes every file in the user's avatar folder except `keep`. */
const removeOldPhotos = async (uid: string, keep?: string) => {
  const { data, error } = await supabase.storage.from(BUCKET).list(uid, { limit: 100 });
  if (error || !data) return;
  const old = data.map((f) => `${uid}/${f.name}`).filter((p) => p !== keep);
  if (old.length > 0) await supabase.storage.from(BUCKET).remove(old);
};

/**
 * Lets the user pick a photo and makes it their profile picture.
 * Returns the new URL, or null if they backed out.
 */
export const changeProfilePhoto = async (
  uid: string,
  source: PhotoSource,
): Promise<string | null> => {
  const result = await pick(source);
  const asset = result.canceled ? null : result.assets?.[0];
  if (!asset) return null;
  if (!asset.base64) throw new Error("Couldn't read that photo. Try another one.");

  const bytes = decode(asset.base64);
  if (bytes.byteLength > MAX_BYTES) {
    throw new Error("That photo is too large. Crop it smaller or pick another one.");
  }

  // A new file name each time, so phones that cached the old picture show the new one.
  const path = `${uid}/avatar-${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (uploadError) {
    const m = uploadError.message.toLowerCase();
    if (m.includes("bucket not found")) {
      throw new Error("Profile photos aren't switched on for this server yet. Your photo wasn't saved.");
    }
    throw new Error("Your photo wasn't uploaded. Check your connection and try again.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  try {
    await updateProfile(uid, { profile_picture: data.publicUrl });
  } catch {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error("Your photo wasn't saved to your profile. Check your connection and try again.");
  }

  await removeOldPhotos(uid, path).catch(() => {});
  return data.publicUrl;
};

export const removeProfilePhoto = async (uid: string) => {
  try {
    await updateProfile(uid, { profile_picture: null });
  } catch {
    throw new Error("Your photo wasn't removed. Check your connection and try again.");
  }
  await removeOldPhotos(uid).catch(() => {});
};

/**
 * For account deletion: removes every profile photo. Throws if the photos
 * exist but can't be removed. A missing bucket means there are none.
 */
export const deleteAllProfilePhotos = async (uid: string) => {
  const { data, error } = await supabase.storage.from(BUCKET).list(uid, { limit: 100 });
  if (error) {
    if (error.message.toLowerCase().includes("not found")) return;
    throw error;
  }
  if (data && data.length > 0) {
    const { error: rmError } = await supabase.storage
      .from(BUCKET)
      .remove(data.map((f) => `${uid}/${f.name}`));
    if (rmError) throw rmError;
  }
};
