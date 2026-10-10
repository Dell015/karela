import fs from "fs";
import { setup, as, admin, q, one, expectErr, check, user, run } from "./lib.mjs";
import { BASE12 } from "./t12.mjs";

// submit_civic_report needs PostGIS, which PGlite doesn't have: load 15
// without that block (marked [postgis] in the file). Twice: re-runnable.
const db = await setup([...BASE12, "13_territory.sql", "14_finish_run.sql"]);
const sql15 = fs.readFileSync(new URL("../15_server_rewards.sql", import.meta.url), "utf8")
  .replace(/-- \[postgis\][\s\S]*?-- \[\/postgis\]/, "");
await db.exec(sql15);
await db.exec(sql15);
console.log("ran 15_server_rewards.sql (without the PostGIS block) twice");
const A = "aaaaaaaa-0000-0000-0000-000000000001";
const B = "bbbbbbbb-0000-0000-0000-000000000002";
const C = "cccccccc-0000-0000-0000-000000000003";
await user(db, A, { weight: 60, xp: 900, level: 1, gems: 0 });
await user(db, B, { level: 1, gems: 0 });
await user(db, C, { level: 2, xp: 0, gems: 0 });
const stats = async (id) => { await admin(db); return one(db, "select stats from profiles where id=$1", [id]); };
const finish = "select finish_run($1, $2, $3)";
const rid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const addQuest = async (uid, fields) => {
  await as(db, uid);
  const f = { title: "q", description: "", frequency: "daily", type: "distance", target_value: 1, xp_reward: 100, ...fields };
  const cols = Object.keys(f);
  return one(db, `insert into missions (user_id, ${cols.join(",")}) values ($1, ${cols.map((_, i) => "$" + (i + 2)).join(",")}) returning id`,
    [uid, ...Object.values(f)]);
};

// ---- Runs ----
await as(db, A);
let r = await one(db, finish, [rid(1), 2345.6, 900]);
check(r.saved === true && r.xp === 234 && r.gems === 20 && r.calories === 141 && r.streak === 1, "run paid by the server", r);
let s = await stats(A);
check(Number(s.level) === 2 && Number(s.xp) === 134 && Number(s.gems) === 20, "900 + 234 XP -> level 2, 134 XP", { level: s.level, xp: s.xp, gems: s.gems });
check(Number(s.total_distance_km) === 2.35 && Number(s.total_calories_burned) === 141, "totals added", s.total_distance_km);

await as(db, A);
r = await one(db, finish, [rid(1), 2345.6, 900]);
s = await stats(A);
check(r.saved === false && Number(s.xp) === 134 && Number(s.gems) === 20, "same run again pays nothing", r);

await as(db, A);
r = await one(db, finish, [rid(2), 10000, 60]);
check(r.meters === 583, "10 km in a minute counts only 35 km/h worth", r.meters);

for (const d of [-4, -3, -2, -1]) await run(db, B, d);
await as(db, B);
r = await one(db, finish, [rid(3), 1000, 400]);
check(r.streak === 5 && r.xp === 120, "5-day streak: 100 XP x 1.2", r);

// ---- Quests: what the app can and can't do ----
const big = await addQuest(C, { xp_reward: 99999, target_value: 0.01 });
await admin(db);
let m = (await q(db, "select * from missions where id=$1", [big]))[0];
check(m.xp_reward === 143 && Number(m.target_value) === 0.5 && Number(m.current_value) === 0, "new quest: XP capped (level 2), target floored", { xp: m.xp_reward, t: m.target_value });

const sneaky = await addQuest(C, { current_value: 50, status: "claimed" });
await admin(db);
m = (await q(db, "select * from missions where id=$1", [sneaky]))[0];
check(Number(m.current_value) === 0 && m.status === "active", "can't insert progress or a claimed quest");

await as(db, C);
await expectErr(db, "update missions set current_value = 99 where id=$1", /permission denied/, "app can't set progress", [big]);
await expectErr(db, "update missions set status = 'claimed' where id=$1", /only be expired/, "app can't mark claimed", [big]);
await q(db, "update missions set status = 'expired' where id=$1", [sneaky]);
await admin(db);
check((await one(db, "select status from missions where id=$1", [sneaky])) === "expired", "app can expire a quest");

for (let i = 0; i < 4; i++) await addQuest(C, {});
await expectErr(db, "insert into missions (user_id, title, frequency) values ($1, 'x', 'daily')", /enough daily quests/, "7th daily quest refused", [C]);

// ---- Quests: claiming ----
await as(db, C);
await expectErr(db, "select claim_mission($1)", /Finish the quest goal/, "unfinished quest can't be claimed", [big]);
const weekly = await addQuest(C, { frequency: "weekly", xp_reward: 300, target_value: 1 });
await as(db, C);
await one(db, finish, [rid(4), 1200, 500]);
await admin(db);
check(Number(await one(db, "select current_value from missions where id=$1", [big])) === 1.2, "run moved quest progress");
await as(db, C);
r = await one(db, "select claim_mission($1)", [weekly]);
check(r.xp === 300 && r.gems === 5, "weekly quest: 300 XP, 5 Gems", r);
await expectErr(db, "select claim_mission($1)", /already claimed/, "second claim refused", [weekly]);
s = await stats(C);
check(Number(s.total_missions_completed) === 1, "missions completed +1", s.total_missions_completed);

// ---- First week (H3) ----
await as(db, B);
await expectErr(db, "insert into missions (user_id, title, onboarding_day) values ($1, 'x', 2)", /isn't next/, "can't skip to day 2", [B]);
await admin(db);
await db.query("delete from missions where user_id=$1", [B]);
const day1 = await addQuest(B, { onboarding_day: 1, xp_reward: 5000, target_value: 0.01 });
await admin(db);
m = (await q(db, "select * from missions where id=$1", [day1]))[0];
check(m.xp_reward === 100 && Number(m.target_value) === 0.5, "day 1 quest set by the server", { xp: m.xp_reward, t: m.target_value });
await as(db, B);
await one(db, finish, [rid(5), 600, 300]);
const gemsBefore = Number((await stats(B)).gems);
await as(db, B);
r = await one(db, "select claim_mission($1)", [day1]);
s = await stats(B);
check(r.onboarding_day === 1 && r.gems === 20 && Number(s.onboarding_day_completed) === 1 && Number(s.gems) === gemsBefore + 20,
  "day 1 claimed: +20 Gems, onboarding moves to day 2", r);

// ---- Civic reward (submit_civic_report itself needs PostGIS; not in these tests) ----
const civic = await addQuest(A, { type: "civic", target_value: 1, xp_reward: 50 });
const gA = Number((await stats(A)).gems);
await as(db, A);
await admin(db); // keep A's login, call the internal function as the server
r = await one(db, "select karela_civic_reward($1, false)", [A]);
check(r.xp === 50 && r.gems === 5, "report sent: 50 XP, 5 Gems", r);
r = await one(db, "select karela_civic_reward($1, true)", [A]);
check(r.xp === 200 && r.gems === 20, "report verifies a node: 200 XP, 20 Gems", r);
check(Number(await one(db, "select current_value from missions where id=$1", [civic])) === 2 && Number((await stats(A)).gems) === gA + 25,
  "civic quest progress and Gems added");

// ---- The lock ----
await as(db, A);
await q(db, "select set_stats($1, $2)", [A, JSON.stringify({ weight: 61, ai_notes: "hi" })]);
check(Number((await stats(A)).weight) === 61, "body details can still be set");
await as(db, A);
await expectErr(db, "select set_stats($1, $2)", /Only the server can change xp/, "XP can't be set", [A, JSON.stringify({ weight: 61, xp: 999 })]);
await expectErr(db, "select increment_stats($1, $2)", /permission denied/, "increment_stats closed", [A, JSON.stringify({ gems: 1000 })]);
await expectErr(db, "select karela_award($1, 1000, 1000)", /permission denied/, "award not callable", [A]);

// ---- Reset ----
await as(db, A);
await q(db, "select reset_my_progress()");
s = await stats(A);
check(Number(s.level) === 1 && Number(s.xp) === 0 && Number(s.total_distance_km) === 0 && Number(s.gems) > 0, "reset: level and distance cleared, Gems kept", s);
await admin(db);
check((await one(db, "select count(*)::int from run_history where user_id=$1", [A])) === 0, "reset: run history cleared");

await as(db, null);
await expectErr(db, "select claim_mission($1)", /permission denied/, "anon blocked", [big]);
