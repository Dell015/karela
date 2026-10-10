-- ============================================================
-- KARELA WEBSITE BACKEND, PART 2: confirmation email + remove me
-- Run in the WEBSITE's Supabase project (not the app's), after
-- supabase-site.sql. Safe to run more than once.
--
-- What it adds
--   wants_email   the "Email me a confirmation" box on the form
--   unsub_token   a random code per signup, used in the
--                 "Remove me from the list" link
--   a trigger     when someone joins with the box ticked, the
--                 database asks a Google Apps Script (in the
--                 owner's Gmail) to send the confirmation email
--                 (backend/confirmation-email.gs)
--   remove_from_waitlist(token)
--                 what the site's /unsubscribe page calls; it
--                 deletes that one row
--
-- Running this file makes a random secret and shows it at the end
-- ("copy this secret"). Put it in the Google script's settings. Then
-- tell the database where the script is (backend/README.md):
--   update private.mail_config set script_url = 'https://script.google.com/macros/s/.../exec';
-- ============================================================

-- 1. New columns ----------------------------------------------
alter table public.waitlist add column if not exists wants_email boolean not null default false;
alter table public.waitlist add column if not exists unsub_token uuid not null default gen_random_uuid();
alter table public.waitlist add column if not exists email_requested_at timestamptz;
create unique index if not exists waitlist_unsub_token_unique on public.waitlist (unsub_token);

-- Visitors may only fill in these columns. The token and the
-- email timestamp are always set by the database.
revoke insert on public.waitlist from anon;
grant insert (email, source, "timestamp", wants_email) on public.waitlist to anon;

-- 2. Where the mail script lives (not readable from the site) -
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.mail_config (
  id         int primary key check (id = 1),
  script_url text,
  secret     text not null
);
alter table private.mail_config alter column script_url drop not null;
revoke all on private.mail_config from public, anon, authenticated;

-- One secret, made once. Running the file again keeps it.
insert into private.mail_config (id, secret)
values (1, encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

-- 3. Send the confirmation after a signup ----------------------
create extension if not exists pg_net;

create or replace function private.send_waitlist_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  cfg private.mail_config;
begin
  if not new.wants_email then
    return null;
  end if;
  select * into cfg from private.mail_config where id = 1;
  if not found or cfg.script_url is null or cfg.script_url = '' then
    return null; -- script not set up yet: the signup still saves
  end if;

  -- pg_net sends this after the signup is saved, so a slow or
  -- broken script never stops someone joining.
  perform net.http_post(
    url := cfg.script_url,
    body := jsonb_build_object(
      'secret', cfg.secret,
      'email', new.email,
      'token', new.unsub_token
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  );
  update public.waitlist set email_requested_at = now() where id = new.id;
  return null;
end;
$$;

revoke all on function private.send_waitlist_confirmation() from public, anon, authenticated;

drop trigger if exists waitlist_send_confirmation on public.waitlist;
create trigger waitlist_send_confirmation
  after insert on public.waitlist
  for each row execute function private.send_waitlist_confirmation();

-- 4. "Remove me from the list" ---------------------------------
-- Deletes the one signup with this token. Returns true if a row
-- was removed, false if the link was already used or is wrong.
create or replace function public.remove_from_waitlist(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.waitlist where unsub_token = p_token;
  return found;
end;
$$;

revoke all on function public.remove_from_waitlist(uuid) from public;
grant execute on function public.remove_from_waitlist(uuid) to anon;

-- ---------- Checks (run after the file) ----------
-- 1) Should list wants_email, unsub_token, email_requested_at:
--    select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'waitlist';
-- 2) Should be false (the site can't read the mail secret):
--    select has_table_privilege('anon', 'private.mail_config', 'select');

-- 5. Show the secret (copy it into the Google script) ----------
select secret as "copy this secret" from private.mail_config where id = 1;
