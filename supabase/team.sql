-- Run this in the Supabase SQL editor to enable the Team page.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are visible to signed in users" on public.profiles;
create policy "profiles are visible to signed in users"
  on public.profiles
  for select
  to authenticated
  using (true);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user_profile();

insert into public.profiles (id, email)
select id, lower(email)
from auth.users
where email is not null
on conflict (id) do update set email = excluded.email;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  member_email text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, member_id)
);

alter table public.team_members enable row level security;

drop policy if exists "owners can read their team members" on public.team_members;
create policy "owners can read their team members"
  on public.team_members
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "owners can add their team members" on public.team_members;
create policy "owners can add their team members"
  on public.team_members
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "owners can delete their team members" on public.team_members;
create policy "owners can delete their team members"
  on public.team_members
  for delete
  to authenticated
  using (owner_id = auth.uid());

create table if not exists public.account_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.account_balances enable row level security;

drop policy if exists "users and team owners can read balances" on public.account_balances;
create policy "users and team owners can read balances"
  on public.account_balances
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.team_members
      where team_members.owner_id = auth.uid()
        and team_members.member_id = account_balances.user_id
    )
  );

drop policy if exists "users can insert their balance" on public.account_balances;
create policy "users can insert their balance"
  on public.account_balances
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can update their balance" on public.account_balances;
create policy "users can update their balance"
  on public.account_balances
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "team owners can read member expenses" on public.expenses;
create policy "team owners can read member expenses"
  on public.expenses
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.team_members
      where team_members.owner_id = auth.uid()
        and team_members.member_id = expenses.user_id
    )
  );
