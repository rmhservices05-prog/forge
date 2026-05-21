drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.organization_preferences cascade;
drop table if exists public.task_comments cascade;
drop table if exists public.task_subtasks cascade;
drop table if exists public.task_activity cascade;
drop table if exists public.tasks cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;

create table public.organizations (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  organization_id text not null references public.organizations (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('Owner', 'Operator', 'Manager', 'Observer')) default 'Operator',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.tasks (
  id text primary key,
  organization_id text not null references public.organizations (id) on delete cascade,
  title text not null,
  description text not null,
  assignee_id uuid references public.profiles (user_id) on delete set null,
  status text not null check (status in ('To Do', 'In Progress', 'Done')),
  priority text not null check (priority in ('Low', 'Medium', 'High', 'Critical')),
  due_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.task_activity (
  id text primary key,
  organization_id text not null references public.organizations (id) on delete cascade,
  task_id text not null references public.tasks (id) on delete cascade,
  actor_id uuid not null references public.profiles (user_id) on delete cascade,
  action text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.task_subtasks (
  id text primary key,
  organization_id text not null references public.organizations (id) on delete cascade,
  task_id text not null references public.tasks (id) on delete cascade,
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.task_comments (
  id text primary key,
  organization_id text not null references public.organizations (id) on delete cascade,
  task_id text not null references public.tasks (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.organization_preferences (
  organization_id text primary key references public.organizations (id) on delete cascade,
  project_icon text,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.organizations (id, name, slug)
values ('forge-internal', 'Forge Internal', 'forge-internal')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_name text;
begin
  derived_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Forge User'
  );

  insert into public.profiles (user_id, organization_id, name, email, role)
  values (
    new.id,
    'forge-internal',
    initcap(replace(replace(replace(derived_name, '.', ' '), '_', ' '), '-', ' ')),
    coalesce(new.email, ''),
    'Operator'
  )
  on conflict (user_id) do update
  set organization_id = excluded.organization_id,
      name = excluded.name,
      email = excluded.email;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (user_id, organization_id, name, email, role)
select
  users.id,
  'forge-internal',
  initcap(
    replace(
      replace(
        replace(
          coalesce(
            nullif(users.raw_user_meta_data ->> 'name', ''),
            nullif(split_part(users.email, '@', 1), ''),
            'Forge User'
          ),
          '.',
          ' '
        ),
        '_',
        ' '
      ),
      '-',
      ' '
    )
  ),
  coalesce(users.email, ''),
  'Operator'
from auth.users as users
on conflict (user_id) do update
set organization_id = excluded.organization_id,
    name = excluded.name,
    email = excluded.email;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_activity enable row level security;
alter table public.task_subtasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.organization_preferences enable row level security;

drop policy if exists "organizations read same organization" on public.organizations;
create policy "organizations read same organization" on public.organizations
for select
using (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = organizations.id
  )
);

drop policy if exists "profiles read same organization" on public.profiles;
create policy "profiles read same organization" on public.profiles
for select
using (auth.role() = 'authenticated');

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "tasks same organization access" on public.tasks;
create policy "tasks same organization access" on public.tasks
for all
using (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = tasks.organization_id
  )
)
with check (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = tasks.organization_id
  )
);

drop policy if exists "task activity same organization access" on public.task_activity;
create policy "task activity same organization access" on public.task_activity
for all
using (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = task_activity.organization_id
  )
)
with check (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = task_activity.organization_id
  )
);

drop policy if exists "task subtasks same organization access" on public.task_subtasks;
create policy "task subtasks same organization access" on public.task_subtasks
for all
using (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = task_subtasks.organization_id
  )
)
with check (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = task_subtasks.organization_id
  )
);

drop policy if exists "task comments same organization access" on public.task_comments;
create policy "task comments same organization access" on public.task_comments
for all
using (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = task_comments.organization_id
  )
)
with check (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = task_comments.organization_id
  )
);

drop policy if exists "organization preferences same organization access" on public.organization_preferences;
create policy "organization preferences same organization access" on public.organization_preferences
for all
using (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = organization_preferences.organization_id
  )
)
with check (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = organization_preferences.organization_id
  )
);
