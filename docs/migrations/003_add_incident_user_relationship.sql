-- Migration 003: Add incident-user relationship and security policies
-- Idempotent: safe to run multiple times without losing existing data or dropping tables.

-- 1. Add user_id column referencing user_profiles
alter table public.incidents 
  add column if not exists user_id uuid references public.user_profiles(id) on delete set null;

-- 2. Create index for user_id to optimize filtering queries
create index if not exists idx_incidents_user_id on public.incidents (user_id);

-- 3. Enable RLS on incidents table
alter table public.incidents enable row level security;

-- 4. Create RLS policies for incidents table
drop policy if exists "Select incidents policy" on public.incidents;
create policy "Select incidents policy"
  on public.incidents for select
  using (
    auth.uid() = user_id 
    or (select role from public.user_profiles where id = auth.uid()) in ('admin', 'responder')
  );

drop policy if exists "Insert incidents policy" on public.incidents;
create policy "Insert incidents policy"
  on public.incidents for insert
  with check (
    auth.uid() = user_id
  );

drop policy if exists "Delete incidents policy" on public.incidents;
create policy "Delete incidents policy"
  on public.incidents for delete
  using (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  );

-- 5. Safe backfill: Associate existing orphaned/legacy incidents (where user_id is NULL)
-- with the first/oldest Administrator account if one exists, ensuring they are viewable.
do $$
declare
  default_admin_id uuid;
begin
  select id into default_admin_id from public.user_profiles where role = 'admin' order by created_at asc limit 1;
  if default_admin_id is not null then
    update public.incidents set user_id = default_admin_id where user_id is null;
  end if;
end $$;
