import { setup, as, admin, q, one, expectErr, check, user, run } from "./lib.mjs";

export const BASE = [
  "schema.sql", "02_realtime_and_history.sql", "07_close_stats_hole.sql",
  "08_account_deletion.sql", "09_profile_pictures.sql", "10_streak_protection_and_shop.sql",
];
if (process.argv[1].endsWith("t10.mjs")) {
  const db = await setup([...BASE, "10_streak_protection_and_shop.sql"]); // twice: re-runnable
  const A = "aaaaaaaa-0000-0000-0000-000000000001";
  const B = "bbbbbbbb-0000-0000-0000-000000000002";
  await user(db, A, { gems: 1000 });
  await user(db, B, { gems: 50, streak_freeze_count: 1 });
  const st = async () => { await admin(db); const s = await one(db, "select stats from profiles where id=$1", [A]); await as(db, A); return s; };

  for (const d of [-4, -3, -2]) await run(db, A, d);
  await as(db, A);
  let r = await one(db, "select settle_streak()");
  check(r.streak === 0 && r.freezes_used === 0, "missed yesterday, no freezes -> streak 0", r);
  let shop = await one(db, "select get_shop_state()");
  check(shop.repair_available === true && shop.repair_streak === 3, "repair offered for a 3-day streak", shop.repair_streak);
  await q(db, "select buy_item('streak_repair')");
  r = await one(db, "select settle_streak()");
  check(r.streak === 3 && r.at_risk === true, "after repair: streak 3, at risk today", r);
  check((await st()).gems === 850, "repair cost 150");
  await expectErr(db, "select buy_item('streak_repair')", /isn't broken/, "repair twice refused");
  await run(db, A, 0); await as(db, A);
  r = await one(db, "select settle_streak()");
  check(r.streak === 4 && r.at_risk === false, "run today -> 4", r);

  await q(db, "select buy_item('streak_freeze')");
  await q(db, "select buy_item('streak_freeze')");
  await expectErr(db, "select buy_item('streak_freeze')", /already hold 2/, "third freeze refused");
  const s = await st();
  check(s.streak_freeze_count === 2 && s.gems === 690, "2 freezes, 690 gems", [s.streak_freeze_count, s.gems]);

  for (const d of [-5, -4, -3, -2]) await run(db, B, d);
  await as(db, B);
  r = await one(db, "select settle_streak()");
  check(r.freezes_used === 1 && r.streak === 4 && r.freezes_left === 0, "B: freeze covers yesterday, streak 4", r);
  r = await one(db, "select settle_streak()");
  check(r.freezes_used === 0 && r.streak === 4, "settle again changes nothing", r);
  await expectErr(db, "select buy_item('trail_gold')", /Not enough Gems/, "B can't afford gold trail");

  await as(db, A);
  await q(db, "select buy_item('trail_aqua')");
  shop = await one(db, "select get_shop_state()");
  check(shop.owned.includes("trail_aqua") && shop.equipped.trail === "trail_aqua", "bought + auto-equipped", shop.equipped);
  await expectErr(db, "select buy_item('trail_aqua')", /already own/, "buy owned refused");
  await expectErr(db, "select equip_item('trail','trail_gold')", /don't own/, "equip unowned refused");
  await expectErr(db, "select equip_item('frame','trail_aqua')", /don't own/, "equip into wrong slot refused");
  await q(db, "select equip_item('trail', null)");
  shop = await one(db, "select get_shop_state()");
  check(!shop.equipped.trail, "unequip back to default");
  await q(db, "select buy_item('bayanihan_boost')");
  await expectErr(db, "select buy_item('bayanihan_boost')", /already on/, "boost twice refused");
  shop = await one(db, "select get_shop_state()");
  check(!!shop.boosts.bayanihan_boost, "boost active");
  await expectErr(db, `insert into user_items values ('${A}','trail_gold')`, /permission denied|row-level/, "can't insert owned items directly");
  await expectErr(db, `select karela_spend_gems('${A}', -500)`, /permission denied/, "internal helper not callable");
  await expectErr(db, `update profiles set stats = stats || '{"gems":99999}' where id='${A}'`, /permission denied/, "can't edit own gems directly");
  await as(db, null);
  await expectErr(db, "select buy_item('streak_freeze')", /permission denied/, "anon can't buy");

  await as(db, A);
  await q(db, "select delete_my_account(false)");
  await admin(db);
  const left = await q(db, "select (select count(*) from user_items) ui, (select count(*) from purchases where user_id=$1) p, (select count(*) from streak_protections where user_id=$1) sp", [A]);
  check(Number(left[0].ui) === 0 && Number(left[0].p) === 0 && Number(left[0].sp) === 0, "account delete removes shop rows", left[0]);
}
