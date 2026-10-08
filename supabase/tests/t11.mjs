import { setup, as, admin, q, one, expectErr, check, user, run } from "./lib.mjs";
import { BASE } from "./t10.mjs";

export const BASE11 = [...BASE, "11_squads.sql"];
if (process.argv[1].endsWith("t11.mjs")) {
  const db = await setup([...BASE11, "11_squads.sql"]);
  const L = "11111111-0000-0000-0000-000000000001"; // leader
  const M = "22222222-0000-0000-0000-000000000002"; // member
  const N = "33333333-0000-0000-0000-000000000003"; // newbie, level 1
  const X = "44444444-0000-0000-0000-000000000004"; // outsider
  await user(db, L, { level: 3, xp: 100, gems: 500 }, "Leader");
  await user(db, M, { level: 2, xp: 0, gems: 300 }, "Member");
  await user(db, N, { level: 1, gems: 0 }, "Newbie");
  await user(db, X, { level: 5, gems: 1000 }, "Outsider");

  await as(db, N);
  await expectErr(db, "select create_squad('Too Early')", /Level 3/, "level 1 can't create");
  await as(db, L);
  await expectErr(db, "select create_squad('ab')", /3 to 30/, "name too short");
  let s = await one(db, "select create_squad('  Carig   Runners ')");
  check(s.squad.name === "Carig Runners" && s.my_role === "leader" && /^[A-HJ-NP-Z2-9]{6}$/.test(s.squad.invite_code), "created, name cleaned, code ok", s.squad);
  const code = s.squad.invite_code;
  await expectErr(db, "select create_squad('Second')", /already in a squad/, "one squad per person");

  await as(db, M);
  const pv = await one(db, "select preview_squad($1)", [code.toLowerCase()]);
  check(pv.name === "Carig Runners" && Number(pv.members) === 1, "preview by code (case-insensitive)", pv);
  s = await one(db, "select request_join_squad($1)", [code]);
  check(s.pending_request?.squad_name === "Carig Runners", "request pending", s.pending_request);
  await expectErr(db, "select respond_join_request($1, true)", /Only the leader/, "non-member can't accept", [M]);
  await as(db, L);
  s = await one(db, "select get_my_squad()");
  check(s.requests.length === 1 && s.requests[0].display_name === "Member" && s.requests[0].email === undefined, "leader sees request, no email", s.requests[0]);
  s = await one(db, "select respond_join_request($1, true)", [M]);
  check(s.members.length === 2, "member accepted");
  await as(db, M);
  s = await one(db, "select get_my_squad()");
  check(s.my_role === "member" && s.squad.invite_code === code, "member sees code (members may invite)");
  await expectErr(db, "select update_squad('New Name', null)", /Only the leader/, "member can't rename");
  await expectErr(db, "select remove_squad_member($1)", /can't remove/, "member can't remove leader", [L]);

  await as(db, L);
  s = await one(db, "select update_squad(null, false)");
  await as(db, M);
  s = await one(db, "select get_my_squad()");
  check(s.squad.invite_code === null, "code hidden when members can't invite");
  await as(db, L);
  await one(db, "select update_squad('Carig Striders', null)");
  await expectErr(db, "select update_squad('Third Name', null)", /once every 7 days/, "rename cooldown");

  // Squad XP: M earns 1,500 XP after joining
  await admin(db);
  await db.query(`update profiles set stats = stats || '{"level":3,"xp":500}' where id=$1`, [M]);
  await as(db, L);
  s = await one(db, "select get_my_squad()");
  check(Number(s.squad.xp) === 1500, "squad XP counts XP earned while in squad", s.squad.xp);

  // roles
  s = await one(db, "select set_squad_role($1, 'co_leader')", [M]);
  check(s.members.find((m) => m.user_id === M).role === "co_leader", "promoted to co-leader");
  await expectErr(db, "select leave_squad()", /Hand leadership/, "leader can't just leave");

  // N joins through co-leader M
  await as(db, N);
  await one(db, "select request_join_squad($1)", [code]);
  await as(db, M);
  s = await one(db, "select respond_join_request($1, true)", [N]);
  check(s.members.length === 3, "co-leader accepted newbie");
  s = await one(db, "select new_squad_code()");
  check(s.squad.invite_code !== code, "co-leader made a new code");
  const code2 = s.squad.invite_code;

  // Shield (open the window for the test)
  await admin(db);
  await db.exec(`create or replace function public.karela_squad_rules() returns jsonb language sql immutable as $$ select jsonb_build_object('min_level',3,'min_members',3,'max_members',12,'max_pending',10,'rename_days',7,'rejoin_hours',24,'shield_cost',200,'shield_opens','00:00') $$`);
  for (const d of [-3, -2, -1]) await run(db, N, d); // N has a 3-day streak, nothing today
  await as(db, L);
  await expectErr(db, "select contribute_shield($1, 50)", /safe for today|streak to save/, "M has no streak", [M]);
  await expectErr(db, "select contribute_shield($1, 50)", /Your squad shields you/, "can't shield yourself", [L]);
  s = await one(db, "select contribute_shield($1, 120)", [N]);
  check(s.shields[0].collected === 120 && s.shields[0].completed === false, "L gave 120", s.shields[0]);
  await as(db, M);
  s = await one(db, "select contribute_shield($1, 500)", [N]);
  check(s.shields[0].collected === 200 && s.shields[0].completed === true && Number(s.shields[0].helpers) === 2, "M topped up only 80, shield complete", s.shields[0]);
  await admin(db);
  const gemsM = await one(db, "select (stats->>'gems')::int from profiles where id=$1", [M]);
  check(gemsM === 220, "M paid only 80", gemsM);
  const prot = await one(db, "select source from streak_protections where user_id=$1 and day=karela_today()", [N]);
  check(prot === "shield", "N's today is protected by a shield");
  await as(db, M);
  await expectErr(db, "select contribute_shield($1, 10)", /safe for today/, "no top-up after complete", [N]);

  // Refund of an unfinished shield from yesterday
  await admin(db);
  const S = await one(db, "select squad_id from squad_members where user_id=$1", [L]);
  const pool = await one(db, "insert into shield_pools (squad_id, target_id, day, collected) values ($1,$2,karela_today()-1,30) returning id", [S, M]);
  await db.query("insert into shield_contributions (pool_id, user_id, gems) values ($1,$2,30)", [pool, L]);
  const before = await one(db, "select (stats->>'gems')::int from profiles where id=$1", [L]);
  await as(db, L);
  await one(db, "select get_my_squad()");
  await one(db, "select get_my_squad()");
  await admin(db);
  const after = await one(db, "select (stats->>'gems')::int from profiles where id=$1", [L]);
  check(after - before === 30, "unfinished shield refunded once", [before, after]);

  // remove + rejoin cooldown
  await as(db, M);
  await one(db, "select remove_squad_member($1)", [N]);
  await as(db, N);
  await expectErr(db, "select request_join_squad($1)", /left this squad recently/, "rejoin cooldown", [code2]);
  // banked XP survives leaving: N earned nothing, M leaves later
  await as(db, L);
  await one(db, "select set_squad_role($1, 'leader')", [M]);
  s = await one(db, "select leave_squad()");
  check(s.squad === null, "old leader left after handing over");
  await as(db, M);
  s = await one(db, "select get_my_squad()");
  check(s.my_role === "leader" && s.members.length === 1 && Number(s.squad.xp) === 1500, "M leads alone, XP kept", s.squad.xp);

  // account deletion of a sole leader removes the squad
  await one(db, "select delete_my_account(false)");
  await admin(db);
  check(Number(await one(db, "select count(*) from squads")) === 0, "deleting the last member removes the squad");

  // disband with an open shield refunds
  await as(db, X);
  s = await one(db, "select create_squad('Downtown')");
  const c3 = s.squad.invite_code;
  await as(db, L);
  await one(db, "select request_join_squad($1)", [c3]);
  await as(db, X);
  await one(db, "select respond_join_request($1, true)", [L]);
  for (const d of [-2, -1]) await run(db, L, d);
  await as(db, X);
  await one(db, "select contribute_shield($1, 50)", [L]);
  s = await one(db, "select disband_squad()");
  check(s.squad === null, "disbanded");
  await admin(db);
  check((await one(db, "select (stats->>'gems')::int from profiles where id=$1", [X])) === 1000, "disband refunded open shield");
  check(Number(await one(db, "select count(*) from squad_members")) === 0, "no members left");

  // privacy: direct table reads blocked
  await as(db, X);
  await expectErr(db, "select * from squads", /permission denied/, "no direct reads of squads");
  await expectErr(db, "select * from squad_members", /permission denied/, "no direct reads of members");
  await as(db, null);
  await expectErr(db, "select get_my_squad()", /permission denied/, "anon blocked");
}
