-- ============================================================
-- KARELA WEBSITE BACKEND, PART 3: rate limits
-- Run in the WEBSITE's Supabase project (not the app's), after
-- 02_confirmation_email.sql. Safe to run more than once.
--
-- Stops a script from flooding the waitlist or the survey, and
-- protects the owner's Gmail from being used to email strangers.
--
--   per connection  20 signups and 20 survey answers per 10 minutes
--                   (not lower: a class on campus Wi-Fi, or people
--                   on the same mobile network, can share an address)
--   everyone        500 of each per hour in total, so a script using
--                   many addresses still hits a ceiling
--   emails          90 confirmation emails per 24 hours (Gmail's free
--                   limit is about 100). Past that, signups still
--                   save, they just don't get a confirmation.
--
-- Change the numbers in private.rate_limits below.
-- ============================================================

create schema if not exists private;

-- The numbers ------------------------------------------------
create or replace function private.rate_limits()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'window_minutes', 10,
    'per_ip', 20,
    'global_per_hour', 500,
    'emails_per_day', 90
  )
$$;

-- What has happened recently (kept for a day) ----------------
create table if not exists private.rate_events (
  kind text not null,          -- 'waitlist' or 'survey'
  ip   text not null,
  at   timestamptz not null default now()
);
create index if not exists rate_events_kind_ip_at on private.rate_events (kind, ip, at);
create index if not exists rate_events_kind_at on private.rate_events (kind, at);
revoke all on private.rate_events from public, anon, authenticated;

-- The visitor's address, from the request headers. Cloudflare (in
-- front of Supabase) sets cf-connecting-ip, which a visitor can't fake.
create or replace function private.client_ip()
returns text
language plpgsql
stable
as $$
declare
  h jsonb;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    h := null;
  end;
  return coalesce(
    nullif(h ->> 'cf-connecting-ip', ''),
    nullif(h ->> 'x-real-ip', ''),
    nullif(trim(split_part(h ->> 'x-forwarded-for', ',', 1)), ''),
    'unknown'
  );
end;
$$;

-- Raises "Too many tries" when a limit is reached, otherwise records
-- the attempt. A rejected or failed insert records nothing.
create or replace function private.rate_check(p_kind text)
returns void
language plpgsql
security definer
set search_path = private, public
as $$
declare
  r       jsonb := private.rate_limits();
  v_ip    text := private.client_ip();
  v_win   interval := make_interval(mins => (r ->> 'window_minutes')::int);
begin
  delete from private.rate_events where at < now() - interval '1 day';

  if (select count(*) from private.rate_events
      where kind = p_kind and ip = v_ip and at > now() - v_win) >= (r ->> 'per_ip')::int then
    raise exception 'Too many tries from here. Wait a few minutes and try again.' using errcode = 'P0001';
  end if;
  if (select count(*) from private.rate_events
      where kind = p_kind and at > now() - interval '1 hour') >= (r ->> 'global_per_hour')::int then
    raise exception 'Too many tries right now. Wait a few minutes and try again.' using errcode = 'P0001';
  end if;

  insert into private.rate_events (kind, ip) values (p_kind, v_ip);
end;
$$;
revoke all on function private.rate_check(text) from public, anon, authenticated;

create or replace function private.rate_check_waitlist()
returns trigger language plpgsql security definer set search_path = private, public
as $$ begin perform private.rate_check('waitlist'); return new; end; $$;
create or replace function private.rate_check_survey()
returns trigger language plpgsql security definer set search_path = private, public
as $$ begin perform private.rate_check('survey'); return new; end; $$;
revoke all on function private.rate_check_waitlist() from public, anon, authenticated;
revoke all on function private.rate_check_survey() from public, anon, authenticated;

drop trigger if exists waitlist_rate_limit on public.waitlist;
create trigger waitlist_rate_limit before insert on public.waitlist
  for each row execute function private.rate_check_waitlist();
drop trigger if exists survey_rate_limit on public.survey_responses;
create trigger survey_rate_limit before insert on public.survey_responses
  for each row execute function private.rate_check_survey();

-- Email cap: same as 02, plus "no more than N emails a day".
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
  if (select count(*) from public.waitlist
      where email_requested_at > now() - interval '24 hours')
     >= (private.rate_limits() ->> 'emails_per_day')::int then
    return null; -- daily email cap reached: the signup still saves
  end if;

  perform net.http_post(
    url := cfg.script_url,
    body := jsonb_build_object('secret', cfg.secret, 'email', new.email, 'token', new.unsub_token),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  );
  update public.waitlist set email_requested_at = now() where id = new.id;
  return null;
end;
$$;
revoke all on function private.send_waitlist_confirmation() from public, anon, authenticated;
