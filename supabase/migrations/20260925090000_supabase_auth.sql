-- Link application profiles to Supabase Auth. Passwords are managed only by
-- auth.users and must never be stored in public.users.
alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;

alter table public.users
  alter column password_hash drop not null;

create index if not exists idx_users_auth_user_id on public.users (auth_user_id);
