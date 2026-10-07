-- ============================================================
-- KARELA SUPABASE - 09: Profile pictures
-- Run in the Supabase SQL Editor AFTER 08_account_deletion.sql.
--
-- A separate "avatars" bucket, so profile photos never mix with civic
-- report photos. Each user can only write inside their own folder:
--   avatars/<user id>/avatar-<timestamp>.jpg
-- (services/profilePhoto.ts). The URL is saved in profiles.profile_picture,
-- which 07 already lets a user update.
--
-- Public read, like civic-photos, so the app can show the image from a
-- plain URL and cache it. File names are random enough that nobody can
-- guess them, but anyone who has a URL can open it.
--
-- Safe to run more than once.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 2097152,   -- 2 MB, the app sends far less
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- CHECK: in the app, Profile > tap your picture > Choose from gallery.
-- The photo should show on Profile, Home and Settings, and one file should
-- appear under Storage > avatars > <your user id>. Choosing another photo
-- replaces it (still one file).
-- ============================================================
