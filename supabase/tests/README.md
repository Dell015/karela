# SQL tests

Runs the migrations from `schema.sql` to `13_territory.sql` on a throwaway
Postgres inside Node (PGlite), then plays out the Shop, streak, squad, guild
and territory rules as different users. Nothing touches your real Supabase
project.

```bash
cd supabase/tests
npm install      # once; installs only PGlite, into this folder
npm test
```

Every line should start with `ok`. A `FAIL` line names the rule that broke.

Not covered here: `03_` to `06_` (they need PostGIS, which PGlite doesn't
have; `supabase-stub.sql` stands in for the civic tables).
