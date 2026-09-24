-- Bridge Group — Supabase / Postgres schema
-- Mirrors the existing SQLite tables in backend/db.js and frontend types.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('innovator', 'investor', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_stage') then
    create type public.project_stage as enum ('concept', 'prototype', 'early_revenue', 'scaling', 'approved');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum ('pending', 'approved', 'rejected', 'live');
  end if;
  if not exists (select 1 from pg_type where typname = 'milestone_status') then
    create type public.milestone_status as enum ('pending', 'in_progress', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'investment_status') then
    create type public.investment_status as enum ('pending', 'active', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('return', 'revenue_share', 'valuation_update');
  end if;
  if not exists (select 1 from pg_type where typname = 'ledger_direction') then
    create type public.ledger_direction as enum ('inflow', 'outflow');
  end if;
  if not exists (select 1 from pg_type where typname = 'idea_status') then
    create type public.idea_status as enum (
      'submitted',
      'under_review',
      'department_review',
      'approved',
      'rejected'
    );
  end if;
end
$$;

create table if not exists public.users (
  id bigserial primary key,
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role public.user_role not null,
  company text,
  bio text,
  avatar_url text,
  expertise_fields text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigserial primary key,
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  icon text,
  color text,
  project_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id bigserial primary key,
  title text not null,
  category text not null,
  category_id bigint references public.categories(id) on delete set null,
  description text not null,
  problem text not null,
  solution text not null,
  stage text not null,
  funding_goal numeric not null,
  funding_raised numeric not null default 0,
  equity_offered numeric not null default 0,
  revenue_share_pct numeric not null default 0,
  roi_projection numeric,
  status text not null default 'live',
  image_url text,
  innovator_id bigint not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id bigserial primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  target_date date,
  completed_at timestamptz,
  status public.milestone_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.investments (
  id bigserial primary key,
  investor_id bigint not null references public.users(id) on delete restrict,
  project_id bigint not null references public.projects(id) on delete restrict,
  amount numeric not null,
  equity_pct numeric not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id bigserial primary key,
  investment_id bigint not null references public.investments(id) on delete cascade,
  project_title text not null,
  amount numeric not null,
  type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_ledger (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete restrict,
  project_id bigint references public.projects(id) on delete set null,
  category text not null,
  direction public.ledger_direction not null,
  amount numeric not null,
  balance_after numeric not null,
  status text not null default 'posted',
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete restrict,
  project_id bigint references public.projects(id) on delete set null,
  amount numeric not null,
  status text not null default 'pending',
  type text not null default 'distribution',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigserial primary key,
  sender_id bigint not null references public.users(id) on delete restrict,
  receiver_id bigint not null references public.users(id) on delete restrict,
  project_id bigint references public.projects(id) on delete set null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_not_self check (sender_id <> receiver_id)
);

create table if not exists public.community_posts (
  id bigserial primary key,
  category text not null,
  author_id bigint not null references public.users(id) on delete restrict,
  author_name text not null,
  author_role text not null,
  title text not null,
  content text not null,
  replies integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.idea_requests (
  id bigserial primary key,
  innovator_id bigint not null references public.users(id) on delete restrict,
  title text not null,
  category text not null,
  field text not null,
  problem text not null,
  solution text not null,
  pitch text not null,
  founder_name text not null,
  email text not null,
  status text not null default 'submitted',
  score integer default 0,
  department text,
  review_summary text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_follows (
  id bigserial primary key,
  investor_id bigint not null references public.users(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (investor_id, project_id)
);

create index if not exists idx_projects_innovator on public.projects (innovator_id);
create index if not exists idx_projects_status on public.projects (status);
create index if not exists idx_investments_investor on public.investments (investor_id);
create index if not exists idx_investments_project on public.investments (project_id);
create index if not exists idx_ledger_user on public.financial_ledger (user_id, created_at desc);
create index if not exists idx_messages_participants on public.messages (sender_id, receiver_id, created_at desc);
create index if not exists idx_ideas_innovator on public.idea_requests (innovator_id);
create index if not exists idx_community_posts_category on public.community_posts (category);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_ideas_updated_at on public.idea_requests;
create trigger trg_ideas_updated_at
before update on public.idea_requests
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.investments enable row level security;
alter table public.transactions enable row level security;
alter table public.financial_ledger enable row level security;
alter table public.payouts enable row level security;
alter table public.messages enable row level security;
alter table public.community_posts enable row level security;
alter table public.idea_requests enable row level security;
alter table public.project_follows enable row level security;

-- All application data is accessed through the authenticated Render API using
-- DATABASE_URL. Keep the browser roles out of these custom-auth tables.
drop policy if exists "categories_read" on public.categories;
drop policy if exists "projects_read_authenticated" on public.projects;
drop policy if exists "users_read_self" on public.users;
drop policy if exists "ideas_owner_or_staff" on public.idea_requests;
drop policy if exists "messages_participants_read" on public.messages;
drop policy if exists "community_posts_read" on public.community_posts;

revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
