-- ============================================================
-- KARELA SUPABASE - 11: Squads and the Collective Shield
-- Run in the Supabase SQL Editor AFTER 10_streak_protection_and_shop.sql.
--
-- aboutkarela.md "Squads (3-12 Members)". Numbers agreed 2026-10-08:
--   create a squad at Level 3+; 3-12 members; one squad per person
--   join with a 6-character invite code (a leader or co-leader accepts)
--   Squad XP = XP each member earns while in the squad (kept when they leave)
--   Collective Shield: 200 Gems, split among members, open 6 PM to midnight
--   rename once every 7 days; rejoin a squad you left after 24 hours;
--   up to 10 pending join requests per squad
--
-- Every rule is enforced here, never only in the app. The tables have RLS
-- on and no policies: the app reads and writes only through the functions.
-- Members see each other's display name, username, photo, level and streak,
-- nothing else (profiles stay private).
--
-- Safe to run more than once.
-- ============================================================

-- ---------- Tables ----------

CREATE TABLE IF NOT EXISTS public.squads (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 30),
  invite_code        text NOT NULL UNIQUE,
  created_by         uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  renamed_at         timestamptz,
  banked_xp          bigint NOT NULL DEFAULT 0,  -- XP earned by members who left
  members_can_invite boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.squad_members (
  user_id    uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,  -- one squad per person
  squad_id   uuid NOT NULL REFERENCES public.squads (id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('leader', 'co_leader', 'member')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  xp_at_join bigint NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS squad_members_squad_idx ON public.squad_members (squad_id);
CREATE UNIQUE INDEX IF NOT EXISTS squad_one_leader ON public.squad_members (squad_id) WHERE role = 'leader';

CREATE TABLE IF NOT EXISTS public.squad_join_requests (
  user_id    uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,  -- one pending request per person
  squad_id   uuid NOT NULL REFERENCES public.squads (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS squad_join_requests_squad_idx ON public.squad_join_requests (squad_id);

CREATE TABLE IF NOT EXISTS public.squad_departures (
  user_id  uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  squad_id uuid NOT NULL REFERENCES public.squads (id) ON DELETE CASCADE,
  left_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, squad_id)
);

CREATE TABLE IF NOT EXISTS public.shield_pools (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id     uuid NOT NULL REFERENCES public.squads (id) ON DELETE CASCADE,
  target_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  day          date NOT NULL,
  collected    integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  refunded     boolean NOT NULL DEFAULT false,
  UNIQUE (squad_id, target_id, day)
);

CREATE TABLE IF NOT EXISTS public.shield_contributions (
  pool_id    uuid NOT NULL REFERENCES public.shield_pools (id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  gems       integer NOT NULL CHECK (gems > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shield_contributions_pool_idx ON public.shield_contributions (pool_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['squads', 'squad_members', 'squad_join_requests', 'squad_departures',
                           'shield_pools', 'shield_contributions'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- ---------- Settings (change here, not in the app) ----------

CREATE OR REPLACE FUNCTION public.karela_squad_rules()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'min_level', 3,
    'min_members', 3,
    'max_members', 12,
    'max_pending', 10,
    'rename_days', 7,
    'rejoin_hours', 24,
    'shield_cost', 200,
    'shield_opens', '18:00'
  )
$$;

-- ---------- Helpers ----------

CREATE OR REPLACE FUNCTION public.karela_new_invite_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path TO 'public'
AS $$
DECLARE
  -- No 0/O or 1/I, so a code read aloud can't be mistyped.
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code  text;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1 .. 6 LOOP
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.squads WHERE invite_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.karela_user_total_xp(p_user uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT COALESCE((SELECT public.karela_total_xp(stats) FROM public.profiles WHERE id = p_user), 0) $$;

CREATE OR REPLACE FUNCTION public.karela_squad_xp(p_squad uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((SELECT banked_xp FROM public.squads WHERE id = p_squad), 0)
       + COALESCE((SELECT sum(GREATEST(0, public.karela_user_total_xp(m.user_id) - m.xp_at_join))
                   FROM public.squad_members m WHERE m.squad_id = p_squad), 0)
$$;

CREATE OR REPLACE FUNCTION public.karela_member(p_user uuid)
RETURNS public.squad_members
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT * FROM public.squad_members WHERE user_id = p_user $$;

CREATE OR REPLACE FUNCTION public.karela_require_user()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  RETURN auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.karela_clean_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v text := regexp_replace(btrim(COALESCE(p_name, '')), '\s+', ' ', 'g');
BEGIN
  IF char_length(v) < 3 OR char_length(v) > 30 THEN
    RAISE EXCEPTION 'Use a name from 3 to 30 characters.';
  END IF;
  RETURN v;
END;
$$;

-- When someone leaves (or their account is deleted): keep the XP they earned
-- for the squad, remember when they left, and never leave a squad leaderless.
CREATE OR REPLACE FUNCTION public.karela_on_member_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next uuid;
BEGIN
  -- Squad already gone (disbanded): nothing to keep.
  IF NOT EXISTS (SELECT 1 FROM public.squads WHERE id = OLD.squad_id) THEN
    RETURN OLD;
  END IF;

  UPDATE public.squads
  SET banked_xp = banked_xp + GREATEST(0, public.karela_user_total_xp(OLD.user_id) - OLD.xp_at_join)
  WHERE id = OLD.squad_id;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id) THEN
    INSERT INTO public.squad_departures (user_id, squad_id, left_at)
    VALUES (OLD.user_id, OLD.squad_id, now())
    ON CONFLICT (user_id, squad_id) DO UPDATE SET left_at = now();
  END IF;

  IF OLD.role = 'leader' THEN
    SELECT user_id INTO v_next FROM public.squad_members
    WHERE squad_id = OLD.squad_id
    ORDER BY (role = 'co_leader') DESC, joined_at
    LIMIT 1;
    IF v_next IS NULL THEN
      DELETE FROM public.squads WHERE id = OLD.squad_id;  -- last one out
    ELSE
      UPDATE public.squad_members SET role = 'leader' WHERE user_id = v_next;
    END IF;
  ELSIF NOT EXISTS (SELECT 1 FROM public.squad_members WHERE squad_id = OLD.squad_id) THEN
    DELETE FROM public.squads WHERE id = OLD.squad_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_squad_member_removed ON public.squad_members;
CREATE TRIGGER on_squad_member_removed
  AFTER DELETE ON public.squad_members
  FOR EACH ROW EXECUTE FUNCTION public.karela_on_member_removed();

-- Gives back the Gems of shields that didn't fill up before midnight.
CREATE OR REPLACE FUNCTION public.karela_refund_shields(p_squad uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p record;
  c record;
BEGIN
  FOR p IN
    SELECT id FROM public.shield_pools
    WHERE squad_id = p_squad AND day < public.karela_today()
      AND completed_at IS NULL AND NOT refunded
    FOR UPDATE
  LOOP
    FOR c IN SELECT user_id, sum(gems) AS gems FROM public.shield_contributions
             WHERE pool_id = p.id GROUP BY user_id LOOP
      UPDATE public.profiles
      SET stats = jsonb_set(stats, '{gems}', to_jsonb(COALESCE((stats ->> 'gems')::int, 0) + c.gems))
      WHERE id = c.user_id;
    END LOOP;
    UPDATE public.shield_pools SET refunded = true WHERE id = p.id;
  END LOOP;
END;
$$;

-- ---------- Reading ----------

CREATE OR REPLACE FUNCTION public.karela_public_member(p_user uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'user_id', p.id,
    'display_name', p.display_name,
    'username', p.username,
    'profile_picture', p.profile_picture,
    'frame', (SELECT si.value -> 'colors' FROM public.user_equipped ue
              JOIN public.shop_items si ON si.id = ue.item_id
              WHERE ue.user_id = p.id AND ue.slot = 'frame'),
    'level', COALESCE((p.stats ->> 'level')::int, 1),
    'streak', public.karela_current_streak(p.id),
    'covered_today', public.karela_day_covered(p.id, public.karela_today())
  )
  FROM public.profiles p WHERE p.id = p_user
$$;

CREATE OR REPLACE FUNCTION public.get_my_squad()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_me    public.squad_members := public.karela_member(v_uid);
  v_squad public.squads;
  v_rules jsonb := public.karela_squad_rules();
  v_today date := public.karela_today();
  v_req   record;
  v_officer boolean;
BEGIN
  IF v_me.user_id IS NULL THEN
    SELECT r.created_at, s.name, s.id INTO v_req
    FROM public.squad_join_requests r JOIN public.squads s ON s.id = r.squad_id
    WHERE r.user_id = v_uid;
    RETURN jsonb_build_object(
      'squad', NULL,
      'rules', v_rules,
      'my_level', COALESCE((SELECT (stats ->> 'level')::int FROM public.profiles WHERE id = v_uid), 1),
      'pending_request', CASE WHEN v_req.id IS NULL THEN NULL
                              ELSE jsonb_build_object('squad_id', v_req.id, 'squad_name', v_req.name, 'sent_at', v_req.created_at) END
    );
  END IF;

  PERFORM public.karela_refund_shields(v_me.squad_id);
  SELECT * INTO v_squad FROM public.squads WHERE id = v_me.squad_id;
  v_officer := v_me.role IN ('leader', 'co_leader');

  RETURN jsonb_build_object(
    'rules', v_rules,
    'my_role', v_me.role,
    'squad', jsonb_build_object(
      'id', v_squad.id,
      'name', v_squad.name,
      'created_at', v_squad.created_at,
      'renamed_at', v_squad.renamed_at,
      'members_can_invite', v_squad.members_can_invite,
      'invite_code', CASE WHEN v_officer OR v_squad.members_can_invite THEN v_squad.invite_code END,
      'xp', public.karela_squad_xp(v_squad.id)
    ),
    'members', (
      SELECT jsonb_agg(
        public.karela_public_member(m.user_id) || jsonb_build_object(
          'role', m.role,
          'joined_at', m.joined_at,
          'xp_contributed', GREATEST(0, public.karela_user_total_xp(m.user_id) - m.xp_at_join)
        )
        ORDER BY CASE m.role WHEN 'leader' THEN 0 WHEN 'co_leader' THEN 1 ELSE 2 END, m.joined_at)
      FROM public.squad_members m WHERE m.squad_id = v_squad.id
    ),
    'requests', CASE WHEN v_officer THEN COALESCE((
      SELECT jsonb_agg(public.karela_public_member(r.user_id) || jsonb_build_object('sent_at', r.created_at)
                       ORDER BY r.created_at)
      FROM public.squad_join_requests r WHERE r.squad_id = v_squad.id), '[]') ELSE '[]' END,
    'shields', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'target_id', sp.target_id,
        'collected', sp.collected,
        'completed', sp.completed_at IS NOT NULL,
        'my_gems', COALESCE((SELECT sum(gems) FROM public.shield_contributions c
                             WHERE c.pool_id = sp.id AND c.user_id = v_uid), 0),
        'helpers', (SELECT count(DISTINCT user_id) FROM public.shield_contributions c WHERE c.pool_id = sp.id)
      ))
      FROM public.shield_pools sp WHERE sp.squad_id = v_squad.id AND sp.day = v_today), '[]'),
    'shield_window_open', (now() AT TIME ZONE 'Asia/Manila')::time >= (v_rules ->> 'shield_opens')::time
  );
END;
$$;

-- What a code points to, so the app can show the squad before asking to join.
CREATE OR REPLACE FUNCTION public.preview_squad(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_squad public.squads;
BEGIN
  PERFORM public.karela_require_user();
  SELECT * INTO v_squad FROM public.squads WHERE invite_code = upper(btrim(p_code));
  IF NOT FOUND THEN RAISE EXCEPTION 'No squad has that code. Check it and try again.'; END IF;
  RETURN jsonb_build_object(
    'id', v_squad.id,
    'name', v_squad.name,
    'members', (SELECT count(*) FROM public.squad_members WHERE squad_id = v_squad.id),
    'max_members', (public.karela_squad_rules() ->> 'max_members')::int,
    'xp', public.karela_squad_xp(v_squad.id)
  );
END;
$$;

-- ---------- Membership ----------

CREATE OR REPLACE FUNCTION public.create_squad(p_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_rules jsonb := public.karela_squad_rules();
  v_level integer;
  v_id    uuid;
BEGIN
  IF (public.karela_member(v_uid)).user_id IS NOT NULL THEN
    RAISE EXCEPTION 'You''re already in a squad. Leave it first to start a new one.';
  END IF;
  SELECT COALESCE((stats ->> 'level')::int, 1) INTO v_level FROM public.profiles WHERE id = v_uid;
  IF v_level < (v_rules ->> 'min_level')::int THEN
    RAISE EXCEPTION 'You can start a squad at Level %. You''re Level % now.', v_rules ->> 'min_level', v_level;
  END IF;

  INSERT INTO public.squads (name, invite_code, created_by)
  VALUES (public.karela_clean_name(p_name), public.karela_new_invite_code(), v_uid)
  RETURNING id INTO v_id;
  INSERT INTO public.squad_members (user_id, squad_id, role, xp_at_join)
  VALUES (v_uid, v_id, 'leader', public.karela_user_total_xp(v_uid));
  DELETE FROM public.squad_join_requests WHERE user_id = v_uid;
  RETURN public.get_my_squad();
END;
$$;

CREATE OR REPLACE FUNCTION public.request_join_squad(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_rules jsonb := public.karela_squad_rules();
  v_squad public.squads;
  v_left  timestamptz;
BEGIN
  IF (public.karela_member(v_uid)).user_id IS NOT NULL THEN
    RAISE EXCEPTION 'You''re already in a squad. Leave it first to join another.';
  END IF;
  SELECT * INTO v_squad FROM public.squads WHERE invite_code = upper(btrim(p_code));
  IF NOT FOUND THEN RAISE EXCEPTION 'No squad has that code. Check it and try again.'; END IF;

  SELECT left_at INTO v_left FROM public.squad_departures WHERE user_id = v_uid AND squad_id = v_squad.id;
  IF v_left IS NOT NULL AND v_left > now() - make_interval(hours => (v_rules ->> 'rejoin_hours')::int) THEN
    RAISE EXCEPTION 'You left this squad recently. You can ask to rejoin % hours after leaving.', v_rules ->> 'rejoin_hours';
  END IF;
  IF (SELECT count(*) FROM public.squad_members WHERE squad_id = v_squad.id) >= (v_rules ->> 'max_members')::int THEN
    RAISE EXCEPTION 'This squad is full.';
  END IF;
  IF (SELECT count(*) FROM public.squad_join_requests WHERE squad_id = v_squad.id AND user_id <> v_uid)
     >= (v_rules ->> 'max_pending')::int THEN
    RAISE EXCEPTION 'This squad has too many requests waiting. Try again later.';
  END IF;

  INSERT INTO public.squad_join_requests (user_id, squad_id) VALUES (v_uid, v_squad.id)
  ON CONFLICT (user_id) DO UPDATE SET squad_id = EXCLUDED.squad_id, created_at = now();
  RETURN public.get_my_squad();
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_join_request()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.squad_join_requests WHERE user_id = public.karela_require_user();
  RETURN public.get_my_squad();
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_join_request(p_user uuid, p_accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_me    public.squad_members := public.karela_member(v_uid);
  v_rules jsonb := public.karela_squad_rules();
BEGIN
  IF v_me.user_id IS NULL OR v_me.role NOT IN ('leader', 'co_leader') THEN
    RAISE EXCEPTION 'Only the leader or a co-leader can answer join requests.';
  END IF;
  -- Lock the squad so two officers accepting at once can't overfill it.
  PERFORM 1 FROM public.squads WHERE id = v_me.squad_id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.squad_join_requests WHERE user_id = p_user AND squad_id = v_me.squad_id) THEN
    RAISE EXCEPTION 'That request was already answered or cancelled.';
  END IF;
  DELETE FROM public.squad_join_requests WHERE user_id = p_user;

  IF p_accept THEN
    IF (public.karela_member(p_user)).user_id IS NOT NULL THEN
      RAISE EXCEPTION 'They joined another squad in the meantime.';
    END IF;
    IF (SELECT count(*) FROM public.squad_members WHERE squad_id = v_me.squad_id) >= (v_rules ->> 'max_members')::int THEN
      RAISE EXCEPTION 'Your squad is full.';
    END IF;
    INSERT INTO public.squad_members (user_id, squad_id, role, xp_at_join)
    VALUES (p_user, v_me.squad_id, 'member', public.karela_user_total_xp(p_user));
  END IF;
  RETURN public.get_my_squad();
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_squad()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := public.karela_require_user();
  v_me  public.squad_members := public.karela_member(v_uid);
BEGIN
  IF v_me.user_id IS NULL THEN RAISE EXCEPTION 'You''re not in a squad.'; END IF;
  IF v_me.role = 'leader'
     AND EXISTS (SELECT 1 FROM public.squad_members WHERE squad_id = v_me.squad_id AND user_id <> v_uid) THEN
    RAISE EXCEPTION 'Hand leadership to someone else first, or disband the squad.';
  END IF;
  DELETE FROM public.squad_members WHERE user_id = v_uid;  -- trigger keeps XP, deletes an empty squad
  RETURN public.get_my_squad();
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_squad_member(p_user uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid    uuid := public.karela_require_user();
  v_me     public.squad_members := public.karela_member(v_uid);
  v_target public.squad_members := public.karela_member(p_user);
BEGIN
  IF v_target.user_id IS NULL OR v_me.user_id IS NULL OR v_target.squad_id <> v_me.squad_id THEN
    RAISE EXCEPTION 'They''re not in your squad.';
  END IF;
  IF p_user = v_uid THEN RAISE EXCEPTION 'To leave, use Leave squad.'; END IF;
  IF NOT (v_me.role = 'leader' OR (v_me.role = 'co_leader' AND v_target.role = 'member')) THEN
    RAISE EXCEPTION 'You can''t remove this member.';
  END IF;
  DELETE FROM public.squad_members WHERE user_id = p_user;
  RETURN public.get_my_squad();
END;
$$;

-- Leader only. 'co_leader' or 'member' promotes or demotes; 'leader' hands over.
CREATE OR REPLACE FUNCTION public.set_squad_role(p_user uuid, p_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid    uuid := public.karela_require_user();
  v_me     public.squad_members := public.karela_member(v_uid);
  v_target public.squad_members := public.karela_member(p_user);
BEGIN
  IF v_me.user_id IS NULL OR v_me.role <> 'leader' THEN
    RAISE EXCEPTION 'Only the leader can change roles.';
  END IF;
  IF v_target.user_id IS NULL OR v_target.squad_id <> v_me.squad_id OR p_user = v_uid THEN
    RAISE EXCEPTION 'Pick someone else in your squad.';
  END IF;
  IF p_role = 'leader' THEN
    UPDATE public.squad_members SET role = 'co_leader' WHERE user_id = v_uid;
    UPDATE public.squad_members SET role = 'leader' WHERE user_id = p_user;
  ELSIF p_role IN ('co_leader', 'member') THEN
    UPDATE public.squad_members SET role = p_role WHERE user_id = p_user;
  ELSE
    RAISE EXCEPTION 'Unknown role.';
  END IF;
  RETURN public.get_my_squad();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_squad(p_name text, p_members_can_invite boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_me    public.squad_members := public.karela_member(v_uid);
  v_squad public.squads;
  v_days  integer := (public.karela_squad_rules() ->> 'rename_days')::int;
  v_name  text;
BEGIN
  IF v_me.user_id IS NULL OR v_me.role <> 'leader' THEN
    RAISE EXCEPTION 'Only the leader can change squad settings.';
  END IF;
  SELECT * INTO v_squad FROM public.squads WHERE id = v_me.squad_id FOR UPDATE;

  IF p_name IS NOT NULL THEN
    v_name := public.karela_clean_name(p_name);
    IF v_name <> v_squad.name THEN
      IF v_squad.renamed_at IS NOT NULL AND v_squad.renamed_at > now() - make_interval(days => v_days) THEN
        RAISE EXCEPTION 'You can rename the squad once every % days. Next chance: %.',
          v_days, to_char((v_squad.renamed_at + make_interval(days => v_days)) AT TIME ZONE 'Asia/Manila', 'Mon DD');
      END IF;
      UPDATE public.squads SET name = v_name, renamed_at = now() WHERE id = v_squad.id;
    END IF;
  END IF;
  IF p_members_can_invite IS NOT NULL THEN
    UPDATE public.squads SET members_can_invite = p_members_can_invite WHERE id = v_squad.id;
  END IF;
  RETURN public.get_my_squad();
END;
$$;

-- A new code, for when the old one was shared too widely.
CREATE OR REPLACE FUNCTION public.new_squad_code()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me public.squad_members := public.karela_member(public.karela_require_user());
BEGIN
  IF v_me.user_id IS NULL OR v_me.role NOT IN ('leader', 'co_leader') THEN
    RAISE EXCEPTION 'Only the leader or a co-leader can make a new code.';
  END IF;
  UPDATE public.squads SET invite_code = public.karela_new_invite_code() WHERE id = v_me.squad_id;
  RETURN public.get_my_squad();
END;
$$;

CREATE OR REPLACE FUNCTION public.disband_squad()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me public.squad_members := public.karela_member(public.karela_require_user());
BEGIN
  IF v_me.user_id IS NULL OR v_me.role <> 'leader' THEN
    RAISE EXCEPTION 'Only the leader can disband the squad.';
  END IF;
  PERFORM public.karela_refund_shields(v_me.squad_id);
  -- Today's unfinished shields: give the Gems back before the pools go.
  UPDATE public.shield_pools SET day = public.karela_today() - 1
  WHERE squad_id = v_me.squad_id AND completed_at IS NULL AND NOT refunded;
  PERFORM public.karela_refund_shields(v_me.squad_id);
  DELETE FROM public.squads WHERE id = v_me.squad_id;
  RETURN public.get_my_squad();
END;
$$;

-- ---------- The Collective Shield ----------

CREATE OR REPLACE FUNCTION public.contribute_shield(p_target uuid, p_gems integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid    uuid := public.karela_require_user();
  v_me     public.squad_members := public.karela_member(v_uid);
  v_target public.squad_members := public.karela_member(p_target);
  v_rules  jsonb := public.karela_squad_rules();
  v_cost   integer := (v_rules ->> 'shield_cost')::int;
  v_today  date := public.karela_today();
  v_pool   public.shield_pools;
  v_give   integer;
BEGIN
  IF v_me.user_id IS NULL OR v_target.user_id IS NULL OR v_me.squad_id <> v_target.squad_id THEN
    RAISE EXCEPTION 'You can only shield someone in your squad.';
  END IF;
  IF p_target = v_uid THEN
    RAISE EXCEPTION 'Your squad shields you. Your own Gems can buy a Streak Freeze instead.';
  END IF;
  IF (now() AT TIME ZONE 'Asia/Manila')::time < (v_rules ->> 'shield_opens')::time THEN
    RAISE EXCEPTION 'Shields open at 6 PM, when a streak is really at risk.';
  END IF;
  IF public.karela_day_covered(p_target, v_today) THEN
    RAISE EXCEPTION 'Their streak is safe for today.';
  END IF;
  IF public.karela_current_streak(p_target) = 0 THEN
    RAISE EXCEPTION 'They don''t have a streak to save yet.';
  END IF;
  IF p_gems IS NULL OR p_gems < 1 THEN RAISE EXCEPTION 'Give at least 1 Gem.'; END IF;

  INSERT INTO public.shield_pools (squad_id, target_id, day)
  VALUES (v_me.squad_id, p_target, v_today)
  ON CONFLICT (squad_id, target_id, day) DO NOTHING;
  SELECT * INTO v_pool FROM public.shield_pools
  WHERE squad_id = v_me.squad_id AND target_id = p_target AND day = v_today FOR UPDATE;

  v_give := LEAST(p_gems, v_cost - v_pool.collected);
  IF v_give <= 0 THEN RAISE EXCEPTION 'Their shield is already full.'; END IF;

  PERFORM public.karela_spend_gems(v_uid, v_give);
  INSERT INTO public.shield_contributions (pool_id, user_id, gems) VALUES (v_pool.id, v_uid, v_give);
  UPDATE public.shield_pools SET collected = collected + v_give WHERE id = v_pool.id;

  IF v_pool.collected + v_give >= v_cost THEN
    UPDATE public.shield_pools SET completed_at = now() WHERE id = v_pool.id;
    INSERT INTO public.streak_protections (user_id, day, source)
    VALUES (p_target, v_today, 'shield')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN public.get_my_squad();
END;
$$;

-- ---------- Permissions ----------

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.get_my_squad()', 'public.preview_squad(text)', 'public.create_squad(text)',
    'public.request_join_squad(text)', 'public.cancel_join_request()',
    'public.respond_join_request(uuid, boolean)', 'public.leave_squad()',
    'public.remove_squad_member(uuid)', 'public.set_squad_role(uuid, text)',
    'public.update_squad(text, boolean)', 'public.new_squad_code()', 'public.disband_squad()',
    'public.contribute_shield(uuid, integer)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY[
    'public.karela_new_invite_code()', 'public.karela_user_total_xp(uuid)', 'public.karela_squad_xp(uuid)',
    'public.karela_member(uuid)', 'public.karela_on_member_removed()', 'public.karela_refund_shields(uuid)',
    'public.karela_public_member(uuid)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;

-- ============================================================
-- CHECK in the app: reach Level 3 on a test account, Guilds > Squad >
-- Start a squad. Share the code with a second test account, ask to join,
-- accept the request on the first. Both should see each other.
-- ============================================================
