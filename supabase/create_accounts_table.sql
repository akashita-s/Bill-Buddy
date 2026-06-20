-- Create a persistent accounts table to store user account cards
-- Run this in the Supabase SQL editor

create table if not exists public.accounts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

-- Allow owners (and their team owners via existing policies) to select their accounts
drop policy if exists "owners can access accounts" on public.accounts;
create policy "owners can access accounts"
  on public.accounts
  for select, insert, update, delete
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Trigger to set updated_at on update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

-- Optional: seed initial accounts for users is left to the app to insert if desired.
