-- Migration 002: authentication / user profiles
-- Idempotent: every statement here is safe to run multiple times,
-- including on a database that already has some of this in place.
-- Run once in the Supabase SQL editor (and re-run any time as a
-- self-check -- it will not create duplicates or touch existing data).

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  department text,
  organization text,
  -- Defaults to the least-privileged role. See the bootstrap note at
  -- the bottom of this file for how to create your first admin.
  role text not null default 'viewer' check (role in ('admin', 'responder', 'viewer')),
  profile_image text,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

-- Defense-in-depth: this app's normal read/write path is the FastAPI
-- backend using the Supabase service-role key, which bypasses RLS
-- entirely. These policies only matter if something ever queries this
-- table directly with a user's own (anon-key) session.
alter table user_profiles enable row level security;

drop policy if exists "Users can view their own profile" on user_profiles;
create policy "Users can view their own profile"
  on user_profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on user_profiles;
create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Auto-create a user_profiles row the moment someone signs up via
-- Supabase Auth, so the backend never has to (and never races to)
-- create it manually. `on conflict do nothing` makes this safe even if
-- something else (e.g. the backend's self-heal path) already created
-- the row in the same instant.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- Backfill: covers every account created BEFORE this trigger existed
-- (this is what "403 No profile found" for an already-authenticated
-- user means -- their auth.users row predates the trigger above).
-- `where not exists` makes this idempotent: running it 1 time or 100
-- times produces the same result, and it never creates duplicates.
-- The backend also self-heals this automatically on next login (see
-- app/services/auth.py), so this backfill is a belt-and-suspenders
-- fix, not the only thing standing between you and this bug.
-- ─────────────────────────────────────────────────────────────────────
insert into public.user_profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  'viewer'
from auth.users u
where not exists (
  select 1 from public.user_profiles p where p.id = u.id
);

-- ─────────────────────────────────────────────────────────────────────
-- Bootstrap note (not a workaround -- every role-based system needs a
-- way to designate its first admin, since nobody starts as one):
-- sign up in the app once, then run:
--
--   update user_profiles set role = 'admin' where email = 'you@example.com';
--
-- From then on, admins promote everyone else via the app itself
-- (PATCH /profile/users/{id}/role) -- no more manual SQL needed, ever.
-- ─────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────
-- Schema validation view: allows the backend to audit triggers and policies
-- ─────────────────────────────────────────────────────────────────────
create or replace view public.schema_info as
select 
  'policy' as type, 
  schemaname, 
  tablename, 
  policyname as name
from pg_policies
union all
select 
  'trigger' as type, 
  event_object_schema as schemaname, 
  event_object_table as tablename, 
  trigger_name as name
from information_schema.triggers;

