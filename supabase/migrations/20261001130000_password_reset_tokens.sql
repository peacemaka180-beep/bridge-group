create table if not exists public.password_reset_tokens (
  token_hash text primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);