// Tests website-v2/backend/03_rate_limits.sql (the WEBSITE's Supabase
// project). Limits are shrunk for the test: 3 per address, 5 in total,
// 2 emails a day.
import fs from "fs";
import { PGlite } from "@electric-sql/pglite";
import { as, admin, q, one, expectErr, check } from "./lib.mjs";

const read = (f) => fs.readFileSync(new URL("../../website-v2/backend/" + f, import.meta.url), "utf8");
const db = new PGlite();
await db.exec(fs.readFileSync(new URL("./supabase-stub.sql", import.meta.url), "utf8"));
await db.exec(`
  create schema if not exists net;
  create table net.calls (url text, body jsonb);
  create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}',
    headers jsonb default '{}', timeout_milliseconds int default 5000) returns bigint
  language sql as $$ insert into net.calls values (url, body); select 1::bigint $$;
`);
await db.exec(read("supabase-site.sql"));
await db.exec(read("02_confirmation_email.sql").replace("create extension if not exists pg_net;", "")
  .replace("extensions.gen_random_bytes(24)", "decode(md5(random()::text), 'hex')"));
await db.exec(read("03_rate_limits.sql"));
await db.exec(read("03_rate_limits.sql")); // re-runnable
await db.exec(`create or replace function private.rate_limits() returns jsonb language sql immutable as $$
  select '{"window_minutes":10,"per_ip":3,"global_per_hour":5,"emails_per_day":2}'::jsonb $$;
  update private.mail_config set script_url = 'https://script.example/exec';`);
console.log("ran site SQL 1-3 (3 twice), limits shrunk for the test");

const from = async (ip) => { await as(db, null); await db.query("select set_config('request.headers', $1, false)", [JSON.stringify({ "cf-connecting-ip": ip, "x-forwarded-for": "6.6.6.6" })]); };
let n = 0;
const join = (wants = true) => q(db, "insert into public.waitlist (email, wants_email) values ($1, $2)", [`p${++n}@example.com`, wants]);
const emails = async () => { await admin(db); return one(db, "select count(*)::int from net.calls"); };

await from("1.1.1.1");
await join(); await join(); await join();
check(true, "3 signups from one address go through");
await expectErr(db, "insert into public.waitlist (email) values ('p100@example.com')", /Too many tries from here/, "4th from the same address is refused");
check((await emails()) === 2, "only 2 emails sent: the daily email cap", await emails());
await admin(db);
check((await one(db, "select count(*)::int from waitlist")) === 3, "the 3rd signup still saved without an email");

await from("2.2.2.2");
await expectErr(db, "insert into public.waitlist (email) values ('not an email')", /check constraint/, "a bad email fails...");
await join(false); await join(false);
check(true, "...and doesn't use up the limit: 2 more from a second address");
await from("3.3.3.3");
await expectErr(db, "insert into public.waitlist (email) values ('p101@example.com')", /Too many tries right now/, "6th signup in an hour, any address: refused");

await from("4.4.4.4");
await q(db, "insert into public.survey_responses (answers) values ('{\"a\":1}')");
check(true, "the survey has its own limit, so it still works");
await from("4.4.4.4");
await q(db, "select 1"); // keep the same address, with a spoofed X-Forwarded-For
await q(db, "insert into public.survey_responses (answers) values ('{\"a\":2}')");
await q(db, "insert into public.survey_responses (answers) values ('{\"a\":3}')");
await expectErr(db, "insert into public.survey_responses (answers) values ('{\"a\":4}')", /Too many tries from here/, "faking X-Forwarded-For doesn't help: the Cloudflare address counts");

await as(db, null);
await expectErr(db, "select * from private.rate_events", /permission denied/, "visitors can't see or clear the counters");
