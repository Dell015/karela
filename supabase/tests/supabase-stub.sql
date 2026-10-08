-- Stand-ins for the parts of Supabase the migrations use, so they can run
-- in PGlite: roles, auth.users + auth.uid(), storage, the realtime
-- publication, and the civic tables (the real ones need PostGIS).
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select case when auth.uid() is null then 'anon' else 'authenticated' end $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
create publication supabase_realtime;
-- civic stubs (03 needs PostGIS, which PGlite lacks)
create table public.civic_nodes (id uuid primary key default gen_random_uuid(), category text, status text default 'pending', created_by uuid references auth.users(id), verified_at timestamptz, first_reported timestamptz default now());
create table public.civic_reports (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, node_id uuid references public.civic_nodes(id), category text, photo_url text, created_at timestamptz default now());
grant usage on schema public to anon, authenticated;
grant select on public.civic_nodes, public.civic_reports to authenticated;
grant usage on schema auth to anon, authenticated;
