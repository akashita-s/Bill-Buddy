-- Add email column to expenses table
-- Run this in the Supabase SQL editor

alter table public.expenses
add column email text;

-- Populate email for existing expenses by joining with auth.users
update public.expenses
set email = auth.users.email
from auth.users
where expenses.user_id = auth.users.id
and expenses.email is null;

-- Make email non-null after populating
alter table public.expenses
alter column email set not null;

-- Create index on email for faster filtering
create index if not exists expenses_email_idx on public.expenses(email);
