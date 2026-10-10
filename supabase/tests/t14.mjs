import { setup, as, admin, one, expectErr, check, user } from "./lib.mjs";
import { BASE } from "./t10.mjs";

const db = await setup([...BASE, "14_finish_run.sql", "14_finish_run.sql"]); // twice: re-runnable
const A = "aaaaaaaa-0000-0000-0000-000000000001";
const B = "bbbbbbbb-0000-0000-0000-000000000002";
const R1 = "11111111-1111-4111-8111-111111111111";
await user(db, A, { total_distance_km: 1, total_calories_burned: 10 });
await user(db, B);
const stats = async (id) => { await admin(db); const s = await one(db, "select stats from profiles where id=$1", [id]); return s; };
const finish = "select finish_run($1, $2, $3, $4, $5, $6)";

await as(db, A);
check((await one(db, finish, [R1, 3456.7, 1200, 240, 345, new Date().toISOString()])) === true, "new run saved");
let s = await stats(A);
check(Number(s.total_distance_km) === 4.46 && Number(s.total_calories_burned) === 250, "distance and calories added once", s);

await as(db, A);
check((await one(db, finish, [R1, 3456.7, 1200, 240, 345, new Date().toISOString()])) === false, "same id again -> false");
s = await stats(A);
check(Number(s.total_distance_km) === 4.46, "retry adds nothing", s.total_distance_km);
check((await one(db, "select count(*)::int from run_history where id=$1", [R1])) === 1, "one history row");

await as(db, B);
check((await one(db, finish, [R1, 99999, 10, 1, 1, null])) === false, "another user can't reuse the id");
s = await stats(B);
check(!Number(s.total_distance_km), "and gets nothing for it", s.total_distance_km);

await as(db, A);
const future = new Date(Date.now() + 86_400_000).toISOString();
await one(db, finish, ["22222222-2222-4222-8222-222222222222", 1000, 300, 70, 100, future]);
check((await one(db, "select completed_at <= now() from run_history where id='22222222-2222-4222-8222-222222222222'")) === true, "future time clamped to now");

await expectErr(db, finish, /impossible numbers/, "negative distance refused", ["33333333-3333-4333-8333-333333333333", -5, 10, 1, 1, null]);
await as(db, null);
await expectErr(db, finish, /permission denied/, "anon blocked", ["44444444-4444-4444-8444-444444444444", 1, 1, 1, 1, null]);
