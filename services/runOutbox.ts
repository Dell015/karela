import { getBuffs } from "@/services/buffs";
import { db } from "@/services/database/sqlite/database";
import { supabase } from "@/services/database/supabase/config";
import { getProfile, incrementStats, setStats } from "@/services/database/supabase/profiles";
import { generateAndSaveRunSummary } from "@/services/database/supabase/runService";
import { QuestEngine } from "@/services/engines/QuestEngine";
import { GEM_EARNINGS, getTotalSectors } from "@/services/gemSystem";
import { stripPrivacyZones } from "@/services/privacyZones";
import { callRpc, RpcError } from "@/services/rpc";
import { takeBackgroundPoints } from "@/services/backgroundRun";
import { pathDistance, type TrackPoint, VEHICLE_KMH } from "@/services/runMath";
import { calculateStreak } from "@/services/statsService";
import { applyStreakMultiplier } from "@/services/streakMultiplier";
import { fetchStreakFromHistory, getEffectiveStreak, settleStreak } from "@/services/streakService";
import { recordRunTerritory } from "@/services/territory";
import { uuid } from "@/services/uuid";

/**
 * Run outbox (QA_REPORT C5 + C7).
 *
 * A run gets a UUID when it starts and lives in the SQLite table run_outbox
 * until every part of it has reached the account:
 *
 *   active    being run; the route is saved every few seconds, so a run
 *             survives the app being killed
 *   finished  ended, summary not saved yet
 *   queued    "Save and finish" tapped; waiting to sync
 *
 * Syncing is a list of steps. Each one is ticked off on the phone as it
 * succeeds, so a retry (offline, app killed) carries on where it stopped
 * and never repeats a finished step. The first step, finish_run, is keyed
 * on the run's UUID on the server, so even a repeat of it counts nothing
 * twice. With supabase/15_server_rewards.sql it also pays the run (XP,
 * Gems, calories, streak, quest progress) in the same transaction, and
 * the phone only has territory and Ani's note left. Without 15 the phone
 * does those steps itself, as before. Once every step is done the row,
 * route included, is deleted.
 *
 * Privacy: points inside a Privacy Zone are dropped before the route is
 * written, so they never reach the phone's storage. Distance and time are
 * counted from the live trail first, so a zone never costs any distance.
 */

export type RunState = "active" | "finished" | "queued";

export interface OutboxRun {
  id: string;
  userId: string;
  state: RunState;
  startedAt: number;
  finishedAt: number | null;
  meters: number;
  seconds: number;
  calories: number;
  xp: number;
  path: TrackPoint[];
}

type Row = {
  id: string;
  user_id: string;
  state: RunState;
  started_at: number;
  finished_at: number | null;
  meters: number;
  seconds: number;
  calories: number;
  xp: number;
  path_json: string;
  done: string;
  updated_at: number;
};

const fromRow = (r: Row): OutboxRun => {
  let path: TrackPoint[] = [];
  try {
    path = JSON.parse(r.path_json || "[]");
  } catch {}
  return {
    id: r.id,
    userId: r.user_id,
    state: r.state,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    meters: r.meters,
    seconds: r.seconds,
    calories: r.calories,
    xp: r.xp,
    path,
  };
};

// ---------- Recording ----------

/** Starts a run and returns its id. Any older unfinished run is dropped. */
export const startRun = (userId: string): string => {
  const id = uuid();
  const now = Date.now();
  db.runSync("DELETE FROM run_outbox WHERE user_id = ? AND state = 'active'", [userId]);
  db.runSync(
    "INSERT INTO run_outbox (id, user_id, state, started_at, updated_at) VALUES (?, ?, 'active', ?, ?)",
    [id, userId, now, now],
  );
  return id;
};

/** Saves progress while running. Distance and time come from the live trail. */
export const saveRunProgress = async (id: string, meters: number, seconds: number, path: TrackPoint[]) => {
  const safe = await stripPrivacyZones(path);
  db.runSync(
    "UPDATE run_outbox SET meters = ?, seconds = ?, path_json = ?, updated_at = ? WHERE id = ? AND state = 'active'",
    [Math.floor(meters), Math.floor(seconds), JSON.stringify(safe), Date.now(), id],
  );
};

/** Ends the run; the summary screen opens it by id. */
export const endRun = async (id: string, meters: number, seconds: number, path: TrackPoint[]) => {
  await saveRunProgress(id, meters, seconds, path);
  db.runSync("UPDATE run_outbox SET state = 'finished', finished_at = ?, updated_at = ? WHERE id = ?", [
    Date.now(),
    Date.now(),
    id,
  ]);
};

/** Smaller moves than this between fixes are GPS jitter (as on the run screen). */
const JITTER_M = 2.5;

/**
 * Ends a run that was cut off (app killed). It keeps what was saved, plus
 * any points recorded with the screen locked after that
 * (services/backgroundRun.ts), so a run that went on in the background
 * isn't cut short.
 */
export const endInterruptedRun = (id: string) => {
  const r = db.getFirstSync<Row>("SELECT * FROM run_outbox WHERE id = ? AND state = 'active'", [id]);
  if (!r) return;
  const run = fromRow(r);
  let { meters, seconds, path } = run;
  let finishedAt = r.updated_at;

  const lastSaved = path[path.length - 1];
  const extra: TrackPoint[] = [];
  let prev: TrackPoint | undefined = lastSaved;
  for (const p of takeBackgroundPoints()) {
    if (p.timestamp <= (prev?.timestamp ?? run.startedAt)) continue;
    const point = { latitude: p.latitude, longitude: p.longitude, timestamp: p.timestamp, isVehicle: p.speed * 3.6 > VEHICLE_KMH };
    if (prev && pathDistance([prev, point]) < JITTER_M && !point.isVehicle) continue;
    extra.push(point);
    prev = point;
  }
  if (extra.length) {
    meters += pathDistance(lastSaved ? [lastSaved, ...extra] : extra);
    const lastTs = extra[extra.length - 1].timestamp ?? finishedAt;
    // Time ran on from the last save to the last point (no pausing with the screen locked).
    seconds += Math.max(0, Math.round((lastTs - r.updated_at) / 1000));
    path = [...path, ...extra];
    finishedAt = Math.max(finishedAt, lastTs);
  }

  db.runSync(
    "UPDATE run_outbox SET state = 'finished', meters = ?, seconds = ?, path_json = ?, finished_at = ?, updated_at = ? WHERE id = ?",
    [Math.floor(meters), Math.floor(seconds), JSON.stringify(path), finishedAt, Date.now(), id],
  );
};

export const discardRun = (id: string) => {
  db.runSync("DELETE FROM run_outbox WHERE id = ? AND state != 'queued'", [id]);
};

export const getRun = (id: string): OutboxRun | null => {
  const r = db.getFirstSync<Row>("SELECT * FROM run_outbox WHERE id = ?", [id]);
  return r ? fromRow(r) : null;
};

/** A run that was started or ended but never saved, newest first. */
export const getUnsavedRun = (userId: string): OutboxRun | null => {
  const r = db.getFirstSync<Row>(
    "SELECT * FROM run_outbox WHERE user_id = ? AND state IN ('active', 'finished') ORDER BY started_at DESC LIMIT 1",
    [userId],
  );
  return r ? fromRow(r) : null;
};

/** "Save and finish": the run joins the queue. Calories and XP are fixed now. */
export const queueRun = (id: string, calories: number, xp: number) => {
  db.runSync(
    "UPDATE run_outbox SET state = 'queued', calories = ?, xp = ?, updated_at = ? WHERE id = ? AND state = 'finished'",
    [Math.round(calories), Math.round(xp), Date.now(), id],
  );
};

export const pendingRunCount = (userId: string): number =>
  db.getFirstSync<{ n: number }>("SELECT COUNT(*) AS n FROM run_outbox WHERE user_id = ? AND state = 'queued'", [
    userId,
  ])?.n ?? 0;

// ---------- Syncing ----------

type Step = "history" | "totals" | "streak" | "xp" | "gems" | "quests" | "territory" | "summary";

const markDone = (id: string, done: Set<Step>) =>
  db.runSync("UPDATE run_outbox SET done = ?, updated_at = ? WHERE id = ?", [
    JSON.stringify([...done]),
    Date.now(),
    id,
  ]);

/** Steps finish_run does itself: with 15 everything earned, with 14 the totals. */
const SERVER_PAID: Step[] = ["totals", "streak", "xp", "gems", "quests"];

/**
 * Saves the run under its UUID; a repeat is ignored by the server. Returns
 * the steps the server did in the same call.
 */
const saveHistory = async (run: OutboxRun): Promise<Step[]> => {
  try {
    // 15 returns { saved, xp, gems, ... }; 14 returns true / false.
    const result = await callRpc<boolean | { saved: boolean }>("finish_run", {
      p_id: run.id,
      p_meters: run.meters,
      p_seconds: run.seconds,
      p_calories: run.calories,
      p_xp: run.xp,
      p_finished_at: new Date(run.finishedAt ?? run.startedAt).toISOString(),
    });
    return typeof result === "object" && result !== null ? SERVER_PAID : ["totals"];
  } catch (e) {
    if (!(e instanceof RpcError && e.notSetUp)) throw e;
  }
  // 14_finish_run.sql not run yet: insert under the same UUID ourselves.
  const { error } = await supabase.from("run_history").insert({
    id: run.id,
    user_id: run.userId,
    distance_meters: run.meters,
    duration_seconds: run.seconds,
    calories: run.calories,
    xp_earned: run.xp,
    completed_at: new Date(run.finishedAt ?? run.startedAt).toISOString(),
  });
  if (error && error.code !== "23505") throw error; // 23505: already saved
  return [];
};

/**
 * The server refused a phone-side reward step because 15 was run after this
 * run was half synced. The server owns that step now, so it's skipped.
 */
const lockedByServer = (e: unknown) => {
  const err = e as { code?: string; message?: string } | null;
  return err?.code === "42501" || /^Only the server can change/.test(err?.message ?? "");
};

const syncOne = async (run: OutboxRun, done: Set<Step>) => {
  const uid = run.userId;
  const km = run.meters / 1000;
  const kmh = run.seconds > 0 ? (run.meters / run.seconds) * 3.6 : 0;
  const step = async (name: Step, fn: () => Promise<unknown>) => {
    if (done.has(name)) return;
    try {
      await fn();
    } catch (e) {
      if (!lockedByServer(e)) throw e;
      console.warn(`Run outbox: "${name}" is the server's now; skipped.`);
    }
    done.add(name);
    markDone(run.id, done);
  };

  await step("history", async () => {
    for (const s of await saveHistory(run)) done.add(s);
  });
  await step("totals", () =>
    incrementStats(uid, {
      total_distance_km: Number(km.toFixed(2)),
      total_calories_burned: run.calories,
    }),
  );

  // Streak before XP, so this run's day counts toward the multiplier.
  // The server counts it (runs plus Freeze, Repair and Shield days); if it
  // can't (migration 10 not run), count from run_history, then the phone.
  await step("streak", async () => {
    const fresh = await getProfile(uid);
    const last = Date.parse(fresh?.stats?.last_active_date) || 0;
    const ranAt = run.finishedAt ?? run.startedAt;
    await setStats(uid, { last_active_date: new Date(Math.max(last, ranAt)).toISOString() });
    if (!(await settleStreak())) {
      const streak = (await fetchStreakFromHistory(uid)) ?? calculateStreak();
      await setStats(uid, {
        streak,
        longest_streak: Math.max(streak, Number(fresh?.stats?.longest_streak || 0)),
      });
    }
  });

  // Same multipliers as gainXP in AuthContext: streak tier, then Guild Pioneer.
  await step("xp", async () => {
    if (run.xp <= 0) return;
    const fresh = await getProfile(uid);
    const { xp_multiplier } = await getBuffs();
    const amount = Math.round(applyStreakMultiplier(run.xp, getEffectiveStreak(fresh?.stats)) * xp_multiplier);
    if (amount > 0) await incrementStats(uid, { xp: amount });
  });

  await step("gems", async () => {
    const sectors = getTotalSectors(run.meters);
    if (sectors <= 0) return;
    const { gem_multiplier } = await getBuffs();
    await incrementStats(uid, { gems: Math.round(sectors * GEM_EARNINGS.SECTOR_BONUS * gem_multiplier) });
  });

  await step("quests", () => QuestEngine.syncRunProgress(uid, km, kmh));

  // Guild territory: km inside landmark zones, from the route on this phone.
  // It has its own UUID queue, so this step only has to add to it once.
  await step("territory", () => recordRunTerritory(run.path, new Date(run.finishedAt ?? run.startedAt)));

  // Ani's note on the run. Best effort: it never holds the run back.
  await step("summary", () =>
    generateAndSaveRunSummary(uid, { distance: run.meters, duration: run.seconds, avgSpeed: kmh, sectors: [], pace: kmh }),
  );

  db.runSync("DELETE FROM run_outbox WHERE id = ?", [run.id]);
};

export interface SyncResult {
  synced: number;
  pending: number;
}

let inFlight: Promise<SyncResult> | null = null;

/**
 * Sends every queued run for this user, oldest first. Safe to call often:
 * a call made while a sync is running waits for it, then runs again (the
 * running one may have started before this run was queued). Two syncs never
 * run at once, which could repeat a step.
 */
export const syncRunOutbox = (userId: string): Promise<SyncResult> => {
  if (inFlight) return inFlight.then(() => syncRunOutbox(userId));
  inFlight = (async () => {
    let synced = 0;
    const rows = db.getAllSync<Row>(
      "SELECT * FROM run_outbox WHERE user_id = ? AND state = 'queued' ORDER BY started_at",
      [userId],
    );
    for (const r of rows) {
      let done: Set<Step>;
      try {
        done = new Set(JSON.parse(r.done || "[]"));
      } catch {
        done = new Set();
      }
      try {
        await syncOne(fromRow(r), done);
        synced++;
      } catch (e) {
        console.warn("Run outbox: run not synced yet:", e);
      }
    }
    return { synced, pending: pendingRunCount(userId) };
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
};
