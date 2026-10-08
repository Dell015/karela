import { setup, as, admin, one, expectErr, check, user } from "./lib.mjs";
import { BASE12, makeSquad, ids } from "./t12.mjs";

const db = await setup([...BASE12, "13_territory.sql", "13_territory.sql"]);
const A = ids("a", 3), B = ids("b", 3), Z = "99999999-0000-0000-0000-000000000009";
for (const id of [...A, ...B]) await user(db, id, { level: 3, xp: 0, gems: 400 });
await user(db, Z, { level: 1, gems: 0 });
await makeSquad(db, A, "Alpha Squad");
await makeSquad(db, B, "Bravo Squad");
await admin(db);
for (const id of [...A, ...B]) await db.query(`update profiles set stats = stats || '{"level":5}' where id=$1`, [id]);
await as(db, A[0]);
const GA = (await one(db, "select found_guild('Alpha Guild','lime')")).guild.id;
await as(db, B[0]);
const GB = (await one(db, "select found_guild('Bravo Guild','sky')")).guild.id;

await admin(db);
const L1 = await one(db, "insert into landmarks (name, latitude, longitude) values ('Plaza', 17.6, 121.7) returning id");
const L2 = await one(db, "insert into landmarks (name, latitude, longitude) values ('Bridge', 17.65, 121.75) returning id");
const uuid = () => crypto.randomUUID();

// non-guild user logs nothing
await as(db, Z);
check((await one(db, "select log_territory($1)", [JSON.stringify([{ id: uuid(), landmark_id: L1, km: 2 }])])) === 0, "not in a guild: nothing counted");

// Alpha won last month at L1
await admin(db);
await db.query(`insert into territory_visits (id, user_id, guild_id, landmark_id, km, logged_at)
  values ($1,$2,$3,$4,5, (date_trunc('month', now() at time zone 'Asia/Manila') - interval '10 days') at time zone 'Asia/Manila')`, [uuid(), A[0], GA, L1]);
// and was active 3 days ago
const id1 = uuid();
await as(db, A[1]);
let n = await one(db, "select log_territory($1)", [JSON.stringify([{ id: id1, landmark_id: L1, km: 1, at: new Date(Date.now() - 3 * 864e5).toISOString() }])]);
check(n === 1, "logged 1 km");
n = await one(db, "select log_territory($1)", [JSON.stringify([{ id: id1, landmark_id: L1, km: 1 }])]);
check(n === 0, "same id again is not counted twice");
n = await one(db, "select log_territory($1)", [JSON.stringify([{ id: uuid(), landmark_id: uuid(), km: 1 }, { id: uuid(), landmark_id: L1, km: -3 }])]);
check(n === 0, "unknown landmark and negative km ignored");
await admin(db);
let t = null;

await as(db, A[0]);
t = await one(db, "select get_territories()");
let p = t.landmarks.find((l) => l.id === L1);
check(p.holder.guild_id === GA && p.holder.reason === "last_month", "Alpha holds the Plaza from last month", p.holder);
check(t.landmarks.find((l) => l.id === L2).holder.reason === "unclaimed", "Bridge unclaimed");

// Bravo challenges: needs >= 1.5 x Alpha's 7-day km (1 km) -> 1.4 not enough, then 1.6 is
await as(db, B[0]);
await one(db, "select log_territory($1)", [JSON.stringify([{ id: uuid(), landmark_id: L1, km: 1.4 }])]);
p = (await one(db, "select get_territories()")).landmarks.find((l) => l.id === L1);
check(p.holder.guild_id === GA, "1.4 km doesn't beat 1.5 x 1 km");
await one(db, "select log_territory($1)", [JSON.stringify([{ id: uuid(), landmark_id: L1, km: 0.2 }])]);
p = (await one(db, "select get_territories()")).landmarks.find((l) => l.id === L1);
check(p.holder.guild_id === GB && p.holder.reason === "challenged", "1.6 km takes it", p.holder);

// Territory Boost (Shop): Alpha buys, its next km counts 1.2x
await as(db, A[2]);
await one(db, "select buy_item('territory_boost')");
await expectErr(db, "select buy_item('territory_boost')", /already on/, "guild boost twice refused");
await as(db, A[1]);
await expectErr(db, "select buy_item('territory_boost')", /already on/, "another member can't stack it");
await one(db, "select log_territory($1)", [JSON.stringify([{ id: uuid(), landmark_id: L1, km: 2 }])]);
p = (await one(db, "select get_territories()")).landmarks.find((l) => l.id === L1);
check(Number(p.my_guild_week_km) === 3.4, "boosted: 1 + 2 x 1.2 = 3.4", p.my_guild_week_km);
check(p.holder.guild_id === GA, "Alpha back on top this week (3.4 >= 1.5 x 1.6)", p.holder);
await as(db, Z);
await expectErr(db, "select buy_item('territory_boost')", /Join a guild/, "no guild, no territory boost");

// Pioneer badge
await as(db, A[0]);
const g = await one(db, "select get_my_guild()");
check(!!g.badges.pioneer && g.buffs.xp_multiplier === 1.02, "Pioneer earned, +2% XP");

// get_my_buffs
await admin(db);
await db.query(`update profiles set stats = stats || '{"gems":2000}' where id=$1`, [A[0]]);
await as(db, A[0]);
await one(db, "select buy_item('trail_karela')");
await one(db, "select buy_item('frame_gold')");
await one(db, "select buy_item('bayanihan_boost')");
let bf = await one(db, "select get_my_buffs()");
check(bf.trail.length === 3 && bf.frame[0] === "#FFD60A" && Number(bf.civic_xp_multiplier) === 1.25 && Number(bf.xp_multiplier) === 1.02 && bf.guild_id === GA, "buffs: trail, frame, civic 1.25, pioneer 1.02", bf);
await as(db, Z);
bf = await one(db, "select get_my_buffs()");
check(bf.trail === null && Number(bf.civic_xp_multiplier) === 1 && Number(bf.xp_multiplier) === 1 && bf.guild_id === null, "no buffs for a new user", bf);

// Forfeiture: Alpha's only activity 20 days ago -> unclaimed at L2
await admin(db);
await db.query(`delete from territory_visits`);
await db.query(`insert into territory_visits (id, user_id, guild_id, landmark_id, km, logged_at)
  values ($1,$2,$3,$4,5, now() - interval '20 days')`, [uuid(), A[0], GA, L2]);
// Last month, and more than 14 days ago whatever today's date is.
await db.query(`update territory_visits set logged_at = (date_trunc('month', now() at time zone 'Asia/Manila') - interval '15 days') at time zone 'Asia/Manila'`);
const lastDay = await one(db, "select max(logged_at) < now() - interval '14 days' from territory_visits");
await as(db, A[0]);
p = (await one(db, "select get_territories()")).landmarks.find((l) => l.id === L2);
check(lastDay === true && p.holder.reason === "unclaimed", "last month's winner, quiet 14+ days -> unclaimed", p.holder);

await as(db, Z);
await expectErr(db, "select * from territory_visits", /permission denied/, "no direct reads of visits");
check(Array.isArray((await one(db, "select get_territories()")).landmarks), "anyone signed in can see landmarks");
await expectErr(db, "insert into landmarks (name, latitude, longitude) values ('x',1,1)", /permission denied/, "only admins add landmarks");
await as(db, null);
await expectErr(db, "select get_territories()", /permission denied/, "anon blocked");
