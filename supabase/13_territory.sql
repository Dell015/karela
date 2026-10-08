-- ============================================================
-- KARELA SUPABASE - 13: Landmark territory
-- Run in the Supabase SQL Editor AFTER 12_guilds.sql.
--
-- aboutkarela.md "Territory Quest Specification":
--   zone          250 m around a landmark
--   scoring       total distance by guild members inside the zone, per month
--                 (resets on the 1st, Philippine time)
--   ownership     last month's winning guild holds the landmark this month
--   tie-break     more members, then earliest first entry
--   challenge     a guild that logs 150% of the holder's distance in the
--                 last 7 days takes the landmark mid-month
--   forfeiture    no holder activity in the zone for 14 days -> unclaimed
--   Territory Defense Boost (Shop, 150 Gems): guild distance counts 1.2x
--   for 24 hours
--
-- Added rule (not in the spec): an unclaimed landmark can be claimed
-- mid-month by the guild with the most distance there in the last 7 days,
-- if that is at least 1 km. Without it a new landmark would sit empty for
-- up to a month.
--
-- Privacy: the route never leaves the phone. After a run the phone works
-- out how far the runner went inside each zone and sends only
-- (landmark, km), the same "zone entry" check-in aboutkarela.md allows.
--
-- LANDMARKS: none are added here, because exact coordinates must come from
-- the team. Add them in the SQL Editor, for example:
--   INSERT INTO public.landmarks (name, latitude, longitude)
--   VALUES ('Example Plaza', 17.6000, 121.7000);
--
-- Safe to run more than once.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.landmarks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  latitude   double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude  double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  radius_m   integer NOT NULL DEFAULT 250 CHECK (radius_m BETWEEN 50 AND 1000),
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.territory_visits (
  id          uuid PRIMARY KEY,  -- made on the phone, so a retried upload never counts twice
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  guild_id    uuid NOT NULL REFERENCES public.guilds (id) ON DELETE CASCADE,
  landmark_id uuid NOT NULL REFERENCES public.landmarks (id) ON DELETE CASCADE,
  km          numeric NOT NULL CHECK (km > 0 AND km <= 30),
  boosted     boolean NOT NULL DEFAULT false,
  logged_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS territory_visits_landmark_idx ON public.territory_visits (landmark_id, logged_at);
CREATE INDEX IF NOT EXISTS territory_visits_guild_idx ON public.territory_visits (guild_id, logged_at);

CREATE TABLE IF NOT EXISTS public.guild_boosts (
  guild_id   uuid PRIMARY KEY REFERENCES public.guilds (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  bought_by  uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users read landmarks" ON public.landmarks;
CREATE POLICY "Signed-in users read landmarks"
  ON public.landmarks FOR SELECT TO authenticated USING (active);
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.landmarks FROM anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['territory_visits', 'guild_boosts'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.karela_territory_rules()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'challenge_ratio', 1.5,
    'challenge_days', 7,
    'forfeit_days', 14,
    'min_claim_km', 1,
    'max_km_per_visit', 30,
    'boost_multiplier', 1.2
  )
$$;

-- The Shop item. buy_item() (10_...) calls karela_apply_guild_boost for it.
INSERT INTO public.shop_items (id, category, kind, slot, name, description, price, rarity, value, sort) VALUES
  ('territory_boost', 'boost', 'guild_boost', NULL, 'Territory Boost',
   'Your whole guild''s distance in landmark zones counts 1.2x for 24 hours.',
   150, 'common', '{"hours": 24, "territory_multiplier": 1.2}', 40)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category, kind = EXCLUDED.kind, name = EXCLUDED.name,
  description = EXCLUDED.description, price = EXCLUDED.price, value = EXCLUDED.value, sort = EXCLUDED.sort;

CREATE OR REPLACE FUNCTION public.karela_apply_guild_boost(p_user uuid, p_item public.shop_items)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_guild uuid := public.karela_guild_of(p_user);
  v_gems  integer;
BEGIN
  IF v_guild IS NULL THEN RAISE EXCEPTION 'Join a guild to use a Territory Boost.'; END IF;
  IF EXISTS (SELECT 1 FROM public.guild_boosts WHERE guild_id = v_guild AND expires_at > now()) THEN
    RAISE EXCEPTION 'Your guild''s Territory Boost is already on.';
  END IF;
  v_gems := public.karela_spend_gems(p_user, p_item.price);
  INSERT INTO public.guild_boosts (guild_id, expires_at, bought_by)
  VALUES (v_guild, now() + make_interval(hours => COALESCE((p_item.value ->> 'hours')::int, 24)), p_user)
  ON CONFLICT (guild_id) DO UPDATE SET expires_at = EXCLUDED.expires_at, bought_by = EXCLUDED.bought_by;
  RETURN v_gems;
END;
$$;

-- ---------- Logging distance from the phone ----------

/**
 * p_entries: [{ "id": uuid, "landmark_id": uuid, "km": number, "at": timestamptz }]
 * Returns how many new entries were counted. Not in a guild: counts nothing.
 */
CREATE OR REPLACE FUNCTION public.log_territory(p_entries jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid     uuid := public.karela_require_user();
  v_guild   uuid := public.karela_guild_of(v_uid);
  v_rules   jsonb := public.karela_territory_rules();
  v_boosted boolean;
  v_count   integer := 0;
  v_rows    integer;
  e         jsonb;
  v_at      timestamptz;
BEGIN
  IF v_guild IS NULL OR p_entries IS NULL OR jsonb_typeof(p_entries) <> 'array' THEN RETURN 0; END IF;
  IF jsonb_array_length(p_entries) > 50 THEN RAISE EXCEPTION 'Too many entries at once.'; END IF;
  v_boosted := EXISTS (SELECT 1 FROM public.guild_boosts WHERE guild_id = v_guild AND expires_at > now());

  FOR e IN SELECT * FROM jsonb_array_elements(p_entries) LOOP
    CONTINUE WHEN NOT EXISTS (SELECT 1 FROM public.landmarks WHERE id = (e ->> 'landmark_id')::uuid AND active);
    CONTINUE WHEN COALESCE((e ->> 'km')::numeric, 0) <= 0;
    -- A run uploaded late (offline) counts on its own day, but no more than a week back.
    v_at := LEAST(now(), GREATEST(now() - interval '7 days', COALESCE((e ->> 'at')::timestamptz, now())));
    INSERT INTO public.territory_visits (id, user_id, guild_id, landmark_id, km, boosted, logged_at)
    VALUES ((e ->> 'id')::uuid, v_uid, v_guild, (e ->> 'landmark_id')::uuid,
            LEAST((e ->> 'km')::numeric, (v_rules ->> 'max_km_per_visit')::numeric), v_boosted, v_at)
    ON CONFLICT (id) DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_count := v_count + v_rows;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ---------- Scoring ----------

CREATE OR REPLACE FUNCTION public.karela_zone_km(p_landmark uuid, p_guild uuid, p_from timestamptz, p_to timestamptz)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(sum(km * CASE WHEN boosted THEN (public.karela_territory_rules() ->> 'boost_multiplier')::numeric ELSE 1 END), 0)
  FROM public.territory_visits
  WHERE landmark_id = p_landmark AND guild_id = p_guild AND logged_at >= p_from AND logged_at < p_to
$$;

-- Guild ranking for a landmark over a period, best first (with tie-breaks).
CREATE OR REPLACE FUNCTION public.karela_zone_ranking(p_landmark uuid, p_from timestamptz, p_to timestamptz)
RETURNS TABLE (guild_id uuid, km numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT v.guild_id, public.karela_zone_km(p_landmark, v.guild_id, p_from, p_to) AS km
  FROM public.territory_visits v
  JOIN public.guilds g ON g.id = v.guild_id
  WHERE v.landmark_id = p_landmark AND v.logged_at >= p_from AND v.logged_at < p_to
  GROUP BY v.guild_id
  ORDER BY km DESC,
           (SELECT count(*) FROM public.karela_guild_members(v.guild_id)) DESC,
           min(v.logged_at) ASC
$$;

-- Who holds a landmark right now, and why.
CREATE OR REPLACE FUNCTION public.karela_zone_holder(p_landmark uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rules  jsonb := public.karela_territory_rules();
  v_month  timestamptz := date_trunc('month', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila';
  v_prev   timestamptz := (date_trunc('month', now() AT TIME ZONE 'Asia/Manila') - interval '1 month') AT TIME ZONE 'Asia/Manila';
  v_week   timestamptz := now() - make_interval(days => (v_rules ->> 'challenge_days')::int);
  v_holder uuid;
  v_reason text := 'last_month';
  v_last   timestamptz;
  v_hold7  numeric := 0;
  v_top    record;
  -- Windows that end "now" run a minute past it, so a visit logged this
  -- instant is always inside.
  v_end    timestamptz := now() + interval '1 minute';
BEGIN
  SELECT r.guild_id INTO v_holder FROM public.karela_zone_ranking(p_landmark, v_prev, v_month) r LIMIT 1;

  IF v_holder IS NOT NULL THEN
    SELECT max(logged_at) INTO v_last FROM public.territory_visits
    WHERE landmark_id = p_landmark AND guild_id = v_holder;
    IF v_last < now() - make_interval(days => (v_rules ->> 'forfeit_days')::int) THEN
      v_holder := NULL;  -- forfeited
    ELSE
      v_hold7 := public.karela_zone_km(p_landmark, v_holder, v_week, v_end);
    END IF;
  END IF;

  -- Challenge (or first claim of an unclaimed landmark) on the last 7 days.
  SELECT r.guild_id, r.km INTO v_top FROM public.karela_zone_ranking(p_landmark, v_week, v_end) r
  WHERE r.guild_id IS DISTINCT FROM v_holder LIMIT 1;
  IF v_top.guild_id IS NOT NULL
     AND v_top.km >= (v_rules ->> 'min_claim_km')::numeric
     AND v_top.km >= v_hold7 * (v_rules ->> 'challenge_ratio')::numeric
     AND (v_holder IS NULL OR v_top.km > 0) THEN
    v_reason := CASE WHEN v_holder IS NULL THEN 'claimed' ELSE 'challenged' END;
    v_holder := v_top.guild_id;
  END IF;

  IF v_holder IS NULL THEN
    RETURN jsonb_build_object('guild_id', NULL, 'reason', 'unclaimed');
  END IF;
  RETURN (SELECT jsonb_build_object('guild_id', g.id, 'name', g.name, 'color', g.color, 'reason', v_reason)
          FROM public.guilds g WHERE g.id = v_holder);
END;
$$;

-- Pioneer badge (12_guilds.sql): the guild holds a landmark.
CREATE OR REPLACE FUNCTION public.karela_guild_has_claimed(p_guild uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.landmarks l
                 WHERE l.active AND (public.karela_zone_holder(l.id) ->> 'guild_id')::uuid = p_guild)
$$;

CREATE OR REPLACE FUNCTION public.get_territories()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_guild uuid := public.karela_guild_of(v_uid);
  v_rules jsonb := public.karela_territory_rules();
  v_month timestamptz := date_trunc('month', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila';
  v_week  timestamptz := now() - make_interval(days => (v_rules ->> 'challenge_days')::int);
  v_end   timestamptz := now() + interval '1 minute';
BEGIN
  RETURN jsonb_build_object(
    'rules', v_rules,
    'my_guild_id', v_guild,
    'boost_until', (SELECT expires_at FROM public.guild_boosts WHERE guild_id = v_guild AND expires_at > now()),
    'landmarks', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', l.id, 'name', l.name, 'latitude', l.latitude, 'longitude', l.longitude, 'radius_m', l.radius_m,
        'holder', public.karela_zone_holder(l.id),
        'month_top', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('guild_id', r.guild_id, 'name', g.name, 'color', g.color, 'km', round(r.km, 2)))
          FROM (SELECT * FROM public.karela_zone_ranking(l.id, v_month, v_end) LIMIT 3) r
          JOIN public.guilds g ON g.id = r.guild_id), '[]'),
        'my_guild_month_km', CASE WHEN v_guild IS NULL THEN 0 ELSE round(public.karela_zone_km(l.id, v_guild, v_month, v_end), 2) END,
        'my_guild_week_km', CASE WHEN v_guild IS NULL THEN 0 ELSE round(public.karela_zone_km(l.id, v_guild, v_week, v_end), 2) END
      ) ORDER BY l.name)
      FROM public.landmarks l WHERE l.active), '[]')
  );
END;
$$;

-- ---------- What the app applies on this phone ----------

-- One small call at app start: equipped cosmetics, the user's own boosts and
-- the guild's badge buffs. The app multiplies rewards with these.
CREATE OR REPLACE FUNCTION public.get_my_buffs()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_guild uuid := public.karela_guild_of(v_uid);
  v_rules jsonb := public.karela_guild_rules();
BEGIN
  RETURN jsonb_build_object(
    'trail', (SELECT si.value -> 'colors' FROM public.user_equipped ue JOIN public.shop_items si ON si.id = ue.item_id
              WHERE ue.user_id = v_uid AND ue.slot = 'trail'),
    'frame', (SELECT si.value -> 'colors' FROM public.user_equipped ue JOIN public.shop_items si ON si.id = ue.item_id
              WHERE ue.user_id = v_uid AND ue.slot = 'frame'),
    'civic_xp_multiplier', COALESCE((
      SELECT max((si.value ->> 'civic_xp_multiplier')::numeric)
      FROM public.active_boosts b JOIN public.shop_items si ON si.id = b.item_id
      WHERE b.user_id = v_uid AND b.expires_at > now()), 1),
    'civic_boost_until', (SELECT max(expires_at) FROM public.active_boosts
                          WHERE user_id = v_uid AND item_id = 'bayanihan_boost' AND expires_at > now()),
    'guild_id', v_guild,
    'xp_multiplier', CASE WHEN v_guild IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.guild_badges WHERE guild_id = v_guild AND badge = 'pioneer'
          AND earned_at > now() - make_interval(days => (v_rules ->> 'pioneer_days')::int)) THEN 1.02 ELSE 1 END,
    'gem_multiplier', CASE WHEN v_guild IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.guild_badges WHERE guild_id = v_guild AND badge = 'century_walkers') THEN 1.05 ELSE 1 END,
    'guild_map_theme', v_guild IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.guild_badges WHERE guild_id = v_guild AND badge = 'bayanihan_heart')
  );
END;
$$;

-- ---------- Permissions ----------

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY['public.log_territory(jsonb)', 'public.get_territories()', 'public.get_my_buffs()'] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY[
    'public.karela_apply_guild_boost(uuid, public.shop_items)',
    'public.karela_zone_km(uuid, uuid, timestamptz, timestamptz)',
    'public.karela_zone_ranking(uuid, timestamptz, timestamptz)',
    'public.karela_zone_holder(uuid)', 'public.karela_guild_has_claimed(uuid)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;
