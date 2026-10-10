// Tests website-v2/backend/supabase-site.sql + 02_confirmation_email.sql
// (the WEBSITE's Supabase project, not the app's). pg_net isn't in PGlite,
// so net.http_post is replaced by a stub that records each call.
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
  grant usage on schema net to anon;
`);
await db.exec(read("supabase-site.sql"));
const part2 = read("02_confirmation_email.sql").replace("create extension if not exists pg_net;", "")
  .replace("extensions.gen_random_bytes(24)", "decode(md5(random()::text), 'hex')"); // no pgcrypto in PGlite
await db.exec(part2);
await db.exec(part2); // re-runnable
console.log("ran supabase-site.sql + 02_confirmation_email.sql (twice)");

const add = (email, wants) => q(db, `insert into public.waitlist (email, source, "timestamp", wants_email) values ($1, 'karela-website', now(), $2)`, [email, wants]);
const calls = async () => { await admin(db); return q(db, "select * from net.calls"); };

// Before the script is configured: signups still save, no call.
await as(db, null);
await add("first@example.com", true);
check((await calls()).length === 0, "no mail config yet: signup saves, nothing sent");

await admin(db);
const made = await one(db, "select secret from private.mail_config where id = 1");
check(typeof made === "string" && made.length >= 32, "the file made a secret", made && made.length);
await db.query(`update private.mail_config set script_url = 'https://script.example/exec', secret = 's3cret'`);

await as(db, null);
await add("Second@Example.com", true);
let c = await calls();
check(c.length === 1 && c[0].url === "https://script.example/exec" && c[0].body.secret === "s3cret" && c[0].body.email === "Second@Example.com", "ticked: script called with secret and email", c[0]?.body?.email);
const token = c[0].body.token;
await admin(db);
check(!!(await one(db, "select email_requested_at from waitlist where email = 'Second@Example.com'")), "email_requested_at set");

await as(db, null);
await add("third@example.com", false);
check((await calls()).length === 1, "unticked: no email");

await as(db, null);
await expectErr(db, "insert into public.waitlist (email, unsub_token) values ('x@example.com', gen_random_uuid())", /permission denied/, "visitors can't choose their own token");
await expectErr(db, "select * from private.mail_config", /permission denied/, "visitors can't read the mail secret");
await expectErr(db, "select * from public.waitlist", /permission denied/, "visitors still can't read the list");
await expectErr(db, "insert into public.waitlist (email, wants_email) values ('second@example.com', true)", /duplicate key|unique/, "same email twice refused");
check((await calls()).length === 1, "duplicate sends nothing");

await as(db, null);
check((await one(db, "select remove_from_waitlist($1)", [token])) === true, "remove link deletes the row");
check((await one(db, "select remove_from_waitlist($1)", [token])) === false, "second click: already gone");
check((await one(db, "select remove_from_waitlist($1)", ["00000000-0000-4000-8000-000000000000"])) === false, "wrong code removes nothing");
await admin(db);
check((await one(db, "select count(*)::int from waitlist")) === 2, "the other two signups are untouched");
