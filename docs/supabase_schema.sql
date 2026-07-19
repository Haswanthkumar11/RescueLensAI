-- Run this in the Supabase SQL editor before starting the backend.

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete set null,
  image_url text not null,
  incident_type text not null,
  severity text not null,
  priority text not null,
  score integer not null check (score between 0 and 100),
  summary text not null,
  response_team text not null,
  confidence numeric not null check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  -- Chronological pipeline events for this incident (upload -> ... -> saved).
  -- See docs/migrations/001_add_incident_timeline.sql for existing databases.
  timeline jsonb not null default '[]'::jsonb,
  -- Per-signal point contributions behind `score`, e.g. {"fire": 25, "trapped": 30}.
  contributing_factors jsonb not null default '{}'::jsonb
);

create table if not exists detections (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete cascade,
  people integer default 0,
  children boolean default false,
  elderly boolean default false,
  injured boolean default false,
  trapped boolean default false,
  fire boolean default false,
  flood boolean default false,
  smoke boolean default false,
  collapsed_building boolean default false,
  vehicles integer default 0
);

create index if not exists idx_incidents_created_at on incidents (created_at desc);
create index if not exists idx_incidents_priority on incidents (priority);

-- Authentication: user_profiles + auto-provisioning trigger.
-- See docs/migrations/002_add_user_profiles.sql for existing databases
-- (same content, kept there too so it's independently re-runnable).
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  department text,
  organization text,
  role text not null default 'viewer' check (role in ('admin', 'responder', 'viewer')),
  profile_image text,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

alter table user_profiles enable row level security;

drop policy if exists "Users can view their own profile" on user_profiles;
create policy "Users can view their own profile"
  on user_profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on user_profiles;
create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage: create a public bucket named "incident-images" in
-- Supabase Storage (Dashboard -> Storage -> New bucket -> Public).

-- View to allow the backend to verify triggers and policies via REST API
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

