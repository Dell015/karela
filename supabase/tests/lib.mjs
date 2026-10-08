/**
 * Test helpers: a throwaway Postgres (PGlite, runs inside Node) with the
 * parts of Supabase our SQL needs (supabase-stub.sql), then the real
 * migration files.
 */
import { PGlite } from "@electric-sql/pglite";
import fs from "fs";

// The migrations live one folder up.
const ROOT = new URL("../", import.meta.url);

export async function setup(files) {
  const db = new PGlite();
  await db.exec(fs.readFileSync(new URL("./supabase-stub.sql", import.meta.url), "utf8"));
  // Supabase grants table access to these roles by default; RLS then limits rows.
  await db.exec("alter default privileges in schema public grant all on tables to anon, authenticated; alter default privileges in schema public grant execute on functions to anon, authenticated;");
  for (const f of files) {
    try {
      await db.exec(fs.readFileSync(new URL(f, ROOT), "utf8"));
      console.log("ran", f);
    } catch (e) {
      console.log("FAILED", f, e.message);
      throw e;
    }
  }
  return db;
}

export const as = async (db, uid) => {
  await db.exec("reset role");
  await db.exec(`set request.jwt.claim.sub = '${uid ?? ""}'`);
  await db.exec(uid ? "set role authenticated" : "set role anon");
};
export const admin = (db) => db.exec("reset role");

export async function q(db, sql, params) {
  return (await db.query(sql, params)).rows;
}
export async function one(db, sql, params) {
  const rows = await q(db, sql, params);
  return rows[0] ? Object.values(rows[0])[0] : undefined;
}

export async function expectErr(db, sql, re, label, params) {
  try {
    await db.query(sql, params);
    console.log("FAIL (no error):", label);
    process.exitCode = 1;
  } catch (e) {
    const ok = re.test(e.message);
    console.log(ok ? "ok  " : "FAIL", label, "->", e.message);
    if (!ok) process.exitCode = 1;
  }
}

export function check(cond, label, extra) {
  console.log(cond ? "ok  " : "FAIL", label, extra === undefined ? "" : JSON.stringify(extra));
  if (!cond) process.exitCode = 1;
}

/** Creates a login (and its profile via the trigger), optionally patching stats. */
export async function user(db, id, stats = {}, name) {
  await db.exec("reset role");
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
    id,
    id.slice(0, 4) + "@t.ph",
    JSON.stringify({ display_name: name ?? "User " + id.slice(0, 4), username: "u_" + id.slice(0, 6) }),
  ]);
  if (Object.keys(stats).length)
    await db.query(`update public.profiles set stats = stats || $2::jsonb where id = $1`, [id, JSON.stringify(stats)]);
}

/** A finished run on a Manila day: 0 = today, -1 = yesterday. */
export async function run(db, uid, dayOffset, meters = 3000) {
  await db.exec("reset role");
  await db.query(
    `insert into public.run_history (user_id, distance_meters, duration_seconds, calories, xp_earned, completed_at)
     values ($1, $2, 1200, 100, 300, ((public.karela_today() + $3::int)::timestamp + interval '8 hours') at time zone 'Asia/Manila')`,
    [uid, meters, dayOffset],
  );
}
