import { setup, as, admin, q, one, expectErr, check, user, run } from "./lib.mjs";
import { BASE11 } from "./t11.mjs";

export const BASE12 = [...BASE11, "12_guilds.sql"];

/** Makes a squad of `ids` (first is leader) and returns its invite code. */
export async function makeSquad(db, ids, name) {
  await as(db, ids[0]);
  const s = await one(db, "select create_squad($1)", [name]);
  for (const id of ids.slice(1)) {
    await as(db, id);
    await one(db, "select request_join_squad($1)", [s.squad.invite_code]);
    await as(db, ids[0]);
    await one(db, "select respond_join_request($1, true)", [id]);
  }
  return s.squad.id;
}
export const ids = (p, n) => Array.from({ length: n }, (_, i) => `${p}${p}${p}${p}${p}${p}${p}${p}-0000-0000-0000-00000000000${i}`);

if (process.argv[1].endsWith("t12.mjs")) {
  const db = await setup([...BASE12, "12_guilds.sql"]);
  const A = ids("a", 3), B = ids("b", 3), C = ids("c", 2);
  for (const id of [...A, ...B, ...C]) await user(db, id, { level: 3, xp: 0, gems: 100 }, "P" + id.slice(0, 2));
  const SA = await makeSquad(db, A, "Alpha Squad");
  const SB = await makeSquad(db, B, "Bravo Squad");
  const SC = await makeSquad(db, C, "Charlie Squad");

  await as(db, A[0]);
  await expectErr(db, "select found_guild('Tuguegarao Striders','lime')", /5000 Squad XP/, "needs 5,000 Squad XP");
  await as(db, A[1]);
  await expectErr(db, "select found_guild('X Guild','lime')", /Only your squad leader/, "only squad leader founds");
  await admin(db);
  for (const id of A) await db.query(`update profiles set stats = stats || '{"level":5,"xp":0}' where id=$1`, [id]); // +2000 each = 6000
  await as(db, A[0]);
  let g = await one(db, "select found_guild('Tuguegarao Striders','teal')");
  check(g.guild.name === "Tuguegarao Striders" && g.my_role === "leader" && g.guild.color === "teal", "guild founded", g.guild);
  await as(db, B[0]);
  await expectErr(db, "select found_guild('tuguegarao striders','lime')", /5000|already has that name/, "duplicate name refused");

  // C has only 2 members
  await as(db, C[0]);
  await expectErr(db, "select apply_to_guild($1)", /at least 3 members/, "small squad can't apply", [g.guild.id]);
  await as(db, B[1]);
  await expectErr(db, "select apply_to_guild($1)", /Only your squad leader/, "member can't apply", [g.guild.id]);
  await as(db, B[0]);
  const list = await one(db, "select list_guilds(null)");
  check(list.length === 1 && Number(list[0].members) === 3, "listed with 3 members", list[0]);
  let gb = await one(db, "select apply_to_guild($1)", [g.guild.id]);
  check(gb.application?.guild_name === "Tuguegarao Striders", "Bravo applied");
  await as(db, A[1]);
  await expectErr(db, "select respond_guild_application($1, true)", /Only the guild leader/, "plain member can't accept", [SB]);
  await as(db, A[0]);
  g = await one(db, "select get_my_guild()");
  check(g.applications.length === 1, "leader sees application");
  g = await one(db, "select respond_guild_application($1, true)", [SB]);
  check(g.squads.length === 2 && g.members.length === 6, "Bravo accepted: 2 squads, 6 members");

  // roles
  g = await one(db, "select set_guild_role($1, 'co_leader')", [B[1]]);
  check(g.members.find((m) => m.user_id === B[1]).role === "co_leader", "B1 is guild co-leader");
  await as(db, B[1]);
  await expectErr(db, "select remove_guild_squad($1)", /guild leader's squad/, "can't remove leader's squad", [SA]);
  await expectErr(db, "select set_guild_role($1, 'member')", /Only the guild leader/, "co-leader can't change roles", [A[1]]);
  await as(db, A[0]);
  await expectErr(db, "select leave_guild()", /Hand guild leadership/, "guild leader can't just leave");

  // leader's account deleted -> co-leader takes over
  await one(db, "select set_squad_role($1, 'leader')", [A[1]]);
  await one(db, "select delete_my_account(false)");
  await as(db, B[0]);
  g = await one(db, "select get_my_guild()");
  check(g.guild.leader_id === B[1], "co-leader became guild leader after leader left", g.guild.leader_id);

  // Iron Streak: everyone 7+ days -> 500 gems split once (5 members -> 100 each)
  const members = g.members.map((m) => m.user_id);
  for (const id of members) for (let d = -7; d <= -1; d++) await run(db, id, d, 100);
  await as(db, B[0]);
  g = await one(db, "select get_my_guild()");
  check(!!g.badges.iron_streak, "Iron Streak earned");
  await one(db, "select get_my_guild()");
  await admin(db);
  const gems = await one(db, "select (stats->>'gems')::int from profiles where id=$1", [B[0]]);
  check(gems === 200, "paid 100 once", gems);

  // Century Walkers via km since founding
  await run(db, B[2], 0, 1000000); // 1,000 km logged after founding
  await as(db, B[0]);
  g = await one(db, "select get_my_guild()");
  check(!!g.badges.century_walkers && g.buffs.gem_multiplier === 1.05, "Century Walkers + 5% gems", g.guild.km_since_founding);

  // Bravo's squad leader takes Bravo out while a Bravo member (B1) leads the
  // guild: allowed, and leadership passes to the leader of the oldest squad.
  await as(db, B[0]);
  g = await one(db, "select leave_guild()");
  check(g.guild === null, "Bravo left");
  await as(db, A[1]);
  g = await one(db, "select get_my_guild()");
  check(g.squads.length === 1 && g.my_role === "leader", "leadership passed to Alpha's leader A1", g.my_role);
  // last squad disbands -> guild closes
  await one(db, "select set_squad_role($1, 'member')", [A[2]]);
  await as(db, A[2]);
  await one(db, "select leave_squad()");
  await as(db, A[1]);
  await one(db, "select leave_squad()");
  await admin(db);
  check(Number(await one(db, "select count(*) from guilds")) === 0, "guild closes when its last squad goes");

  await as(db, C[0]);
  await expectErr(db, "select * from guilds", /permission denied/, "no direct reads of guilds");
  await as(db, null);
  await expectErr(db, "select list_guilds(null)", /permission denied/, "anon blocked");
}
