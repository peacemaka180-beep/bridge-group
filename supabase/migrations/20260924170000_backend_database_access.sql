-- The application authenticates through its Render API and connects directly
-- to Postgres. Do not expose private application rows through the browser roles.
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
