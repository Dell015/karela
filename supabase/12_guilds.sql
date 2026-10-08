-- ============================================================
-- KARELA SUPABASE - 12: Guilds
-- Run in the Supabase SQL Editor AFTER 11_squads.sql.
--
-- aboutkarela.md "Guilds". Numbers agreed 2026-10-08:
--   a squad with 5,000 Squad XP (and at least 3 members) founds a guild
--   other squads apply; the guild leader or a co-leader accepts
--   up to 10 squads per guild; rename once every 7 days
--
-- Roles follow the squad pattern: one guild leader, co-leaders, members
-- (everyone in the guild's squads). If the leader leaves, the oldest
-- co-leader takes over, then the leader of the oldest squad.
--
-- Badges are the spec's "Guild Badges & Permanent Buffs". They are checked
-- whenever the guild is opened in the app:
--   Pioneer          first landmark claim       +2% XP for members, 30 days
--   Century Walkers  1,000 km since founding    +5% Gems, permanent
--   Vanguard Guild   10 Vanguard members        (Vanguards aren't built yet)
--   Bayanihan Heart  50 verified civic reports  guild map theme
--   Iron Streak      every member on a 7+ day   500 Gems split among members
--                    streak at the same time    (once)
--
-- Safe to run more than once.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guilds (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 30),
  color       text NOT NULL DEFAULT 'lime'
              CHECK (color IN ('lime', 'teal', 'aqua', 'sky', 'orange', 'coral', 'gold')),
  leader_id   uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  renamed_at  timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS guilds_name_unique ON public.guilds (lower(name));

ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS guild_id uuid REFERENCES public.guilds (id) ON DELETE SET NULL;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS guild_joined_at timestamptz;
CREATE INDEX IF NOT EXISTS squads_guild_idx ON public.squads (guild_id);

CREATE TABLE IF NOT EXISTS public.guild_officers (
  user_id  uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  guild_id uuid NOT NULL REFERENCES public.guilds (id) ON DELETE CASCADE,
  since    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guild_applications (
  squad_id   uuid PRIMARY KEY REFERENCES public.squads (id) ON DELETE CASCADE,  -- one at a time
  guild_id   uuid NOT NULL REFERENCES public.guilds (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guild_badges (
  guild_id  uuid NOT NULL REFERENCES public.guilds (id) ON DELETE CASCADE,
  badge     text NOT NULL CHECK (badge IN ('pioneer', 'century_walkers', 'vanguard_guild', 'bayanihan_heart', 'iron_streak')),
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, badge)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['guilds', 'guild_officers', 'guild_applications', 'guild_badges'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.karela_guild_rules()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'found_xp', 5000,
    'min_squad_members', 3,
    'max_squads', 10,
    'rename_days', 7,
    'century_km', 1000,
    'bayanihan_reports', 50,
    'iron_streak_days', 7,
    'iron_streak_gems', 500,
    'pioneer_days', 30
  )
$$;

-- ---------- Helpers ----------

CREATE OR REPLACE FUNCTION public.karela_guild_of(p_user uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.guild_id FROM public.squad_members m JOIN public.squads s ON s.id = m.squad_id
  WHERE m.user_id = p_user
$$;

CREATE OR REPLACE FUNCTION public.karela_guild_role(p_user uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN g.leader_id = p_user THEN 'leader'
    WHEN EXISTS (SELECT 1 FROM public.guild_officers o WHERE o.user_id = p_user AND o.guild_id = g.id) THEN 'co_leader'
    ELSE 'member'
  END
  FROM public.guilds g WHERE g.id = public.karela_guild_of(p_user)
$$;

-- Keeps a guild valid after people or squads leave: officers must still be
-- in it, the leader must still be in it, and a guild with no squads closes.
CREATE OR REPLACE FUNCTION public.karela_fix_guild(p_guild uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_leader uuid;
  v_next   uuid;
BEGIN
  IF p_guild IS NULL OR NOT EXISTS (SELECT 1 FROM public.guilds WHERE id = p_guild) THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.squads WHERE guild_id = p_guild) THEN
    DELETE FROM public.guilds WHERE id = p_guild;
    RETURN;
  END IF;

  DELETE FROM public.guild_officers o
  WHERE o.guild_id = p_guild AND public.karela_guild_of(o.user_id) IS DISTINCT FROM p_guild;

  SELECT leader_id INTO v_leader FROM public.guilds WHERE id = p_guild;
  IF v_leader IS NULL OR public.karela_guild_of(v_leader) IS DISTINCT FROM p_guild THEN
    SELECT user_id INTO v_next FROM public.guild_officers WHERE guild_id = p_guild ORDER BY since LIMIT 1;
    IF v_next IS NULL THEN
      SELECT m.user_id INTO v_next
      FROM public.squads s JOIN public.squad_members m ON m.squad_id = s.id AND m.role = 'leader'
      WHERE s.guild_id = p_guild ORDER BY s.guild_joined_at LIMIT 1;
    END IF;
    UPDATE public.guilds SET leader_id = v_next WHERE id = p_guild;
    DELETE FROM public.guild_officers WHERE user_id = v_next;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.karela_on_squad_guild_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.karela_fix_guild(OLD.guild_id);
    RETURN OLD;
  END IF;
  IF OLD.guild_id IS DISTINCT FROM NEW.guild_id THEN
    PERFORM public.karela_fix_guild(OLD.guild_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_squad_guild_change ON public.squads;
CREATE TRIGGER on_squad_guild_change
  AFTER UPDATE OF guild_id OR DELETE ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.karela_on_squad_guild_change();

CREATE OR REPLACE FUNCTION public.karela_on_member_left_guild()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.karela_fix_guild((SELECT guild_id FROM public.squads WHERE id = OLD.squad_id));
  RETURN OLD;
END;
$$;

-- Runs after on_squad_member_removed (trigger names fire in alphabetical order).
DROP TRIGGER IF EXISTS on_squad_member_removed_zz_guild ON public.squad_members;
CREATE TRIGGER on_squad_member_removed_zz_guild
  AFTER DELETE ON public.squad_members
  FOR EACH ROW EXECUTE FUNCTION public.karela_on_member_left_guild();

CREATE OR REPLACE FUNCTION public.karela_guild_members(p_guild uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.user_id FROM public.squad_members m JOIN public.squads s ON s.id = m.squad_id
  WHERE s.guild_id = p_guild
$$;

CREATE OR REPLACE FUNCTION public.karela_guild_xp(p_guild uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT COALESCE(sum(public.karela_squad_xp(id)), 0)::bigint FROM public.squads WHERE guild_id = p_guild $$;

CREATE OR REPLACE FUNCTION public.karela_guild_km_since_founding(p_guild uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(round(sum(r.distance_meters) / 1000.0, 1), 0)
  FROM public.run_history r
  WHERE r.user_id IN (SELECT public.karela_guild_members(p_guild))
    AND r.completed_at >= (SELECT created_at FROM public.guilds WHERE id = p_guild)
$$;

CREATE OR REPLACE FUNCTION public.karela_guild_verified_reports(p_guild uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*)::int
  FROM public.civic_reports cr JOIN public.civic_nodes n ON n.id = cr.node_id
  WHERE cr.user_id IN (SELECT public.karela_guild_members(p_guild))
    AND cr.created_at >= (SELECT created_at FROM public.guilds WHERE id = p_guild)
    AND n.status = 'verified'
$$;

-- Replaced by 13_territory.sql once landmarks exist.
CREATE OR REPLACE FUNCTION public.karela_guild_has_claimed(p_guild uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$ SELECT false $$;

-- Awards any badge the guild has reached. Iron Streak pays out once.
CREATE OR REPLACE FUNCTION public.karela_check_guild_badges(p_guild uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rules   jsonb := public.karela_guild_rules();
  v_members uuid[];
  v_share   integer;
BEGIN
  IF public.karela_guild_has_claimed(p_guild) THEN
    INSERT INTO public.guild_badges (guild_id, badge) VALUES (p_guild, 'pioneer') ON CONFLICT DO NOTHING;
  END IF;
  IF public.karela_guild_km_since_founding(p_guild) >= (v_rules ->> 'century_km')::numeric THEN
    INSERT INTO public.guild_badges (guild_id, badge) VALUES (p_guild, 'century_walkers') ON CONFLICT DO NOTHING;
  END IF;
  IF public.karela_guild_verified_reports(p_guild) >= (v_rules ->> 'bayanihan_reports')::int THEN
    INSERT INTO public.guild_badges (guild_id, badge) VALUES (p_guild, 'bayanihan_heart') ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.guild_badges WHERE guild_id = p_guild AND badge = 'iron_streak') THEN
    SELECT array_agg(u) INTO v_members FROM public.karela_guild_members(p_guild) u;
    IF array_length(v_members, 1) >= 2 AND NOT EXISTS (
      SELECT 1 FROM unnest(v_members) u
      WHERE public.karela_current_streak(u) < (v_rules ->> 'iron_streak_days')::int
    ) THEN
      INSERT INTO public.guild_badges (guild_id, badge) VALUES (p_guild, 'iron_streak') ON CONFLICT DO NOTHING;
      v_share := (v_rules ->> 'iron_streak_gems')::int / array_length(v_members, 1);
      UPDATE public.profiles
      SET stats = jsonb_set(stats, '{gems}', to_jsonb(COALESCE((stats ->> 'gems')::int, 0) + v_share))
      WHERE id = ANY (v_members);
    END IF;
  END IF;
END;
$$;

-- ---------- Reading ----------

CREATE OR REPLACE FUNCTION public.list_guilds(p_search text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_squad uuid := (public.karela_member(v_uid)).squad_id;
  v_max   integer := (public.karela_guild_rules() ->> 'max_squads')::int;
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(x ORDER BY (x ->> 'xp')::bigint DESC)
    FROM (
      SELECT jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'color', g.color,
        'squads', (SELECT count(*) FROM public.squads s WHERE s.guild_id = g.id),
        'members', (SELECT count(*) FROM public.karela_guild_members(g.id)),
        'max_squads', v_max,
        'xp', public.karela_guild_xp(g.id),
        'badges', COALESCE((SELECT jsonb_agg(badge) FROM public.guild_badges b WHERE b.guild_id = g.id), '[]'),
        'applied', EXISTS (SELECT 1 FROM public.guild_applications a WHERE a.squad_id = v_squad AND a.guild_id = g.id)
      ) AS x
      FROM public.guilds g
      WHERE p_search IS NULL OR g.name ILIKE '%' || p_search || '%'
      LIMIT 50
    ) t
  ), '[]');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_guild()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid     uuid := public.karela_require_user();
  v_me      public.squad_members := public.karela_member(v_uid);
  v_guild   public.guilds;
  v_rules   jsonb := public.karela_guild_rules();
  v_role    text;
  v_week    timestamptz := date_trunc('week', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila';
  v_app     record;
BEGIN
  IF v_me.user_id IS NULL THEN
    RETURN jsonb_build_object('guild', NULL, 'rules', v_rules, 'in_squad', false);
  END IF;

  SELECT * INTO v_guild FROM public.guilds WHERE id = (SELECT guild_id FROM public.squads WHERE id = v_me.squad_id);
  IF NOT FOUND THEN
    SELECT g.id, g.name, a.created_at INTO v_app
    FROM public.guild_applications a JOIN public.guilds g ON g.id = a.guild_id
    WHERE a.squad_id = v_me.squad_id;
    RETURN jsonb_build_object(
      'guild', NULL,
      'rules', v_rules,
      'in_squad', true,
      'squad_role', v_me.role,
      'squad_xp', public.karela_squad_xp(v_me.squad_id),
      'squad_members', (SELECT count(*) FROM public.squad_members WHERE squad_id = v_me.squad_id),
      'application', CASE WHEN v_app.id IS NULL THEN NULL
                          ELSE jsonb_build_object('guild_id', v_app.id, 'guild_name', v_app.name, 'sent_at', v_app.created_at) END
    );
  END IF;

  PERFORM public.karela_check_guild_badges(v_guild.id);
  v_role := public.karela_guild_role(v_uid);

  RETURN jsonb_build_object(
    'rules', v_rules,
    'in_squad', true,
    'squad_role', v_me.role,
    'my_squad_id', v_me.squad_id,
    'my_role', v_role,
    'guild', jsonb_build_object(
      'id', v_guild.id,
      'name', v_guild.name,
      'color', v_guild.color,
      'created_at', v_guild.created_at,
      'renamed_at', v_guild.renamed_at,
      'leader_id', v_guild.leader_id,
      'xp', public.karela_guild_xp(v_guild.id),
      'km_since_founding', public.karela_guild_km_since_founding(v_guild.id),
      'verified_reports', public.karela_guild_verified_reports(v_guild.id)
    ),
    'squads', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name,
        'members', (SELECT count(*) FROM public.squad_members m WHERE m.squad_id = s.id),
        'xp', public.karela_squad_xp(s.id),
        'joined_at', s.guild_joined_at
      ) ORDER BY s.guild_joined_at)
      FROM public.squads s WHERE s.guild_id = v_guild.id
    ),
    'members', (
      SELECT jsonb_agg(public.karela_public_member(m.user_id) || jsonb_build_object(
        'squad_id', s.id, 'squad_name', s.name,
        'role', public.karela_guild_role(m.user_id)
      ) ORDER BY CASE public.karela_guild_role(m.user_id) WHEN 'leader' THEN 0 WHEN 'co_leader' THEN 1 ELSE 2 END,
                 s.guild_joined_at, m.joined_at)
      FROM public.squads s JOIN public.squad_members m ON m.squad_id = s.id
      WHERE s.guild_id = v_guild.id
    ),
    'applications', CASE WHEN v_role IN ('leader', 'co_leader') THEN COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'squad_id', s.id, 'name', s.name,
        'members', (SELECT count(*) FROM public.squad_members m WHERE m.squad_id = s.id),
        'xp', public.karela_squad_xp(s.id),
        'sent_at', a.created_at
      ) ORDER BY a.created_at)
      FROM public.guild_applications a JOIN public.squads s ON s.id = a.squad_id
      WHERE a.guild_id = v_guild.id), '[]') ELSE '[]' END,
    'week', jsonb_build_object(
      'km', (SELECT COALESCE(round(sum(r.distance_meters) / 1000.0, 1), 0) FROM public.run_history r
             WHERE r.user_id IN (SELECT public.karela_guild_members(v_guild.id)) AND r.completed_at >= v_week),
      'reports', (SELECT count(*) FROM public.civic_reports cr
                  WHERE cr.user_id IN (SELECT public.karela_guild_members(v_guild.id)) AND cr.created_at >= v_week),
      'active_members', (SELECT count(DISTINCT r.user_id) FROM public.run_history r
                         WHERE r.user_id IN (SELECT public.karela_guild_members(v_guild.id)) AND r.completed_at >= v_week)
    ),
    'badges', COALESCE((SELECT jsonb_object_agg(badge, earned_at) FROM public.guild_badges WHERE guild_id = v_guild.id), '{}'),
    'buffs', jsonb_build_object(
      'xp_multiplier', CASE WHEN EXISTS (
          SELECT 1 FROM public.guild_badges WHERE guild_id = v_guild.id AND badge = 'pioneer'
            AND earned_at > now() - make_interval(days => (v_rules ->> 'pioneer_days')::int)) THEN 1.02 ELSE 1 END,
      'gem_multiplier', CASE WHEN EXISTS (
          SELECT 1 FROM public.guild_badges WHERE guild_id = v_guild.id AND badge = 'century_walkers') THEN 1.05 ELSE 1 END,
      'map_theme', EXISTS (SELECT 1 FROM public.guild_badges WHERE guild_id = v_guild.id AND badge = 'bayanihan_heart')
    )
  );
END;
$$;

-- ---------- Founding and joining ----------

CREATE OR REPLACE FUNCTION public.karela_require_squad_leader(p_user uuid)
RETURNS public.squad_members
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me public.squad_members := public.karela_member(p_user);
BEGIN
  IF v_me.user_id IS NULL THEN RAISE EXCEPTION 'Join or start a squad first. Guilds are made of squads.'; END IF;
  IF v_me.role <> 'leader' THEN RAISE EXCEPTION 'Only your squad leader can do this.'; END IF;
  RETURN v_me;
END;
$$;

CREATE OR REPLACE FUNCTION public.found_guild(p_name text, p_color text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_me    public.squad_members := public.karela_require_squad_leader(v_uid);
  v_rules jsonb := public.karela_guild_rules();
  v_xp    bigint := public.karela_squad_xp(v_me.squad_id);
  v_name  text := public.karela_clean_name(p_name);
  v_id    uuid;
BEGIN
  IF (SELECT guild_id FROM public.squads WHERE id = v_me.squad_id) IS NOT NULL THEN
    RAISE EXCEPTION 'Your squad is already in a guild.';
  END IF;
  IF (SELECT count(*) FROM public.squad_members WHERE squad_id = v_me.squad_id) < (v_rules ->> 'min_squad_members')::int THEN
    RAISE EXCEPTION 'Your squad needs at least % members to found a guild.', v_rules ->> 'min_squad_members';
  END IF;
  IF v_xp < (v_rules ->> 'found_xp')::bigint THEN
    RAISE EXCEPTION 'Your squad needs % Squad XP to found a guild. It has % now.', v_rules ->> 'found_xp', v_xp;
  END IF;
  IF EXISTS (SELECT 1 FROM public.guilds WHERE lower(name) = lower(v_name)) THEN
    RAISE EXCEPTION 'A guild already has that name. Pick another.';
  END IF;

  INSERT INTO public.guilds (name, color, leader_id)
  VALUES (v_name, COALESCE(p_color, 'lime'), v_uid) RETURNING id INTO v_id;
  UPDATE public.squads SET guild_id = v_id, guild_joined_at = now() WHERE id = v_me.squad_id;
  DELETE FROM public.guild_applications WHERE squad_id = v_me.squad_id;
  RETURN public.get_my_guild();
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_to_guild(p_guild uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_me    public.squad_members := public.karela_require_squad_leader(v_uid);
  v_rules jsonb := public.karela_guild_rules();
BEGIN
  IF (SELECT guild_id FROM public.squads WHERE id = v_me.squad_id) IS NOT NULL THEN
    RAISE EXCEPTION 'Your squad is already in a guild.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.guilds WHERE id = p_guild) THEN
    RAISE EXCEPTION 'That guild doesn''t exist anymore.';
  END IF;
  IF (SELECT count(*) FROM public.squad_members WHERE squad_id = v_me.squad_id) < (v_rules ->> 'min_squad_members')::int THEN
    RAISE EXCEPTION 'Your squad needs at least % members to join a guild.', v_rules ->> 'min_squad_members';
  END IF;
  IF (SELECT count(*) FROM public.squads WHERE guild_id = p_guild) >= (v_rules ->> 'max_squads')::int THEN
    RAISE EXCEPTION 'That guild is full.';
  END IF;
  INSERT INTO public.guild_applications (squad_id, guild_id) VALUES (v_me.squad_id, p_guild)
  ON CONFLICT (squad_id) DO UPDATE SET guild_id = EXCLUDED.guild_id, created_at = now();
  RETURN public.get_my_guild();
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_guild_application()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me public.squad_members := public.karela_require_squad_leader(public.karela_require_user());
BEGIN
  DELETE FROM public.guild_applications WHERE squad_id = v_me.squad_id;
  RETURN public.get_my_guild();
END;
$$;

CREATE OR REPLACE FUNCTION public.karela_require_guild_officer(p_user uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_guild uuid := public.karela_guild_of(p_user);
BEGIN
  IF v_guild IS NULL THEN RAISE EXCEPTION 'You''re not in a guild.'; END IF;
  IF public.karela_guild_role(p_user) NOT IN ('leader', 'co_leader') THEN
    RAISE EXCEPTION 'Only the guild leader or a co-leader can do this.';
  END IF;
  RETURN v_guild;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_guild_application(p_squad uuid, p_accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_guild uuid := public.karela_require_guild_officer(public.karela_require_user());
BEGIN
  PERFORM 1 FROM public.guilds WHERE id = v_guild FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.guild_applications WHERE squad_id = p_squad AND guild_id = v_guild) THEN
    RAISE EXCEPTION 'That application was already answered or withdrawn.';
  END IF;
  DELETE FROM public.guild_applications WHERE squad_id = p_squad;
  IF p_accept THEN
    IF (SELECT guild_id FROM public.squads WHERE id = p_squad) IS NOT NULL THEN
      RAISE EXCEPTION 'That squad joined another guild in the meantime.';
    END IF;
    IF (SELECT count(*) FROM public.squads WHERE guild_id = v_guild) >= (public.karela_guild_rules() ->> 'max_squads')::int THEN
      RAISE EXCEPTION 'Your guild is full.';
    END IF;
    UPDATE public.squads SET guild_id = v_guild, guild_joined_at = now() WHERE id = p_squad;
  END IF;
  RETURN public.get_my_guild();
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_guild()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_me    public.squad_members := public.karela_require_squad_leader(v_uid);
  v_guild uuid := (SELECT guild_id FROM public.squads WHERE id = v_me.squad_id);
BEGIN
  IF v_guild IS NULL THEN RAISE EXCEPTION 'Your squad isn''t in a guild.'; END IF;
  IF (SELECT leader_id FROM public.guilds WHERE id = v_guild) = v_uid
     AND EXISTS (SELECT 1 FROM public.squads WHERE guild_id = v_guild AND id <> v_me.squad_id) THEN
    RAISE EXCEPTION 'Hand guild leadership to someone in another squad first.';
  END IF;
  UPDATE public.squads SET guild_id = NULL, guild_joined_at = NULL WHERE id = v_me.squad_id;
  RETURN public.get_my_guild();
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_guild_squad(p_squad uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_guild uuid := public.karela_require_guild_officer(v_uid);
BEGIN
  IF (SELECT guild_id FROM public.squads WHERE id = p_squad) IS DISTINCT FROM v_guild THEN
    RAISE EXCEPTION 'That squad isn''t in your guild.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.squad_members m JOIN public.guilds g ON g.leader_id = m.user_id
             WHERE m.squad_id = p_squad AND g.id = v_guild) THEN
    RAISE EXCEPTION 'You can''t remove the guild leader''s squad.';
  END IF;
  IF p_squad = (public.karela_member(v_uid)).squad_id THEN
    RAISE EXCEPTION 'To take your own squad out, use Leave guild.';
  END IF;
  UPDATE public.squads SET guild_id = NULL, guild_joined_at = NULL WHERE id = p_squad;
  RETURN public.get_my_guild();
END;
$$;

-- Guild leader only. 'co_leader' / 'member' promote or demote; 'leader' hands over.
CREATE OR REPLACE FUNCTION public.set_guild_role(p_user uuid, p_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_guild uuid := public.karela_guild_of(v_uid);
BEGIN
  IF v_guild IS NULL OR public.karela_guild_role(v_uid) <> 'leader' THEN
    RAISE EXCEPTION 'Only the guild leader can change guild roles.';
  END IF;
  IF p_user = v_uid OR public.karela_guild_of(p_user) IS DISTINCT FROM v_guild THEN
    RAISE EXCEPTION 'Pick someone else in your guild.';
  END IF;
  IF p_role = 'leader' THEN
    DELETE FROM public.guild_officers WHERE user_id = p_user;
    UPDATE public.guilds SET leader_id = p_user WHERE id = v_guild;
    INSERT INTO public.guild_officers (user_id, guild_id) VALUES (v_uid, v_guild) ON CONFLICT DO NOTHING;
  ELSIF p_role = 'co_leader' THEN
    INSERT INTO public.guild_officers (user_id, guild_id) VALUES (p_user, v_guild) ON CONFLICT DO NOTHING;
  ELSIF p_role = 'member' THEN
    DELETE FROM public.guild_officers WHERE user_id = p_user;
  ELSE
    RAISE EXCEPTION 'Unknown role.';
  END IF;
  RETURN public.get_my_guild();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_guild(p_name text, p_color text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_guild public.guilds;
  v_days  integer := (public.karela_guild_rules() ->> 'rename_days')::int;
  v_name  text;
BEGIN
  SELECT * INTO v_guild FROM public.guilds WHERE id = public.karela_guild_of(v_uid) FOR UPDATE;
  IF NOT FOUND OR v_guild.leader_id <> v_uid THEN
    RAISE EXCEPTION 'Only the guild leader can change guild settings.';
  END IF;
  IF p_name IS NOT NULL THEN
    v_name := public.karela_clean_name(p_name);
    IF v_name <> v_guild.name THEN
      IF v_guild.renamed_at IS NOT NULL AND v_guild.renamed_at > now() - make_interval(days => v_days) THEN
        RAISE EXCEPTION 'You can rename the guild once every % days.', v_days;
      END IF;
      IF EXISTS (SELECT 1 FROM public.guilds WHERE lower(name) = lower(v_name) AND id <> v_guild.id) THEN
        RAISE EXCEPTION 'A guild already has that name. Pick another.';
      END IF;
      UPDATE public.guilds SET name = v_name, renamed_at = now() WHERE id = v_guild.id;
    END IF;
  END IF;
  IF p_color IS NOT NULL THEN
    UPDATE public.guilds SET color = p_color WHERE id = v_guild.id;
  END IF;
  RETURN public.get_my_guild();
END;
$$;

-- ---------- Permissions ----------

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.list_guilds(text)', 'public.get_my_guild()', 'public.found_guild(text, text)',
    'public.apply_to_guild(uuid)', 'public.cancel_guild_application()',
    'public.respond_guild_application(uuid, boolean)', 'public.leave_guild()',
    'public.remove_guild_squad(uuid)', 'public.set_guild_role(uuid, text)', 'public.update_guild(text, text)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY[
    'public.karela_guild_of(uuid)', 'public.karela_guild_role(uuid)', 'public.karela_fix_guild(uuid)',
    'public.karela_on_squad_guild_change()', 'public.karela_on_member_left_guild()',
    'public.karela_guild_members(uuid)', 'public.karela_guild_xp(uuid)',
    'public.karela_guild_km_since_founding(uuid)', 'public.karela_guild_verified_reports(uuid)',
    'public.karela_check_guild_badges(uuid)', 'public.karela_require_squad_leader(uuid)',
    'public.karela_require_guild_officer(uuid)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;
