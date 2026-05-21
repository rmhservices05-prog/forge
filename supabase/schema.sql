create table if not exists public.organizations (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  organization_id text not null references public.organizations (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('Owner', 'Operator', 'Manager', 'Observer')) default 'Operator',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
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

create table if not exists public.task_activity (
  id text primary key,
  organization_id text not null references public.organizations (id) on delete cascade,
  task_id text not null references public.tasks (id) on delete cascade,
  actor_id uuid not null references public.profiles (user_id) on delete cascade,
  action text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.task_subtasks (
  id text primary key,
  organization_id text not null references public.organizations (id) on delete cascade,
  task_id text not null references public.tasks (id) on delete cascade,
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.task_comments (
  id text primary key,
  organization_id text not null references public.organizations (id) on delete cascade,
  task_id text not null references public.tasks (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_preferences (
  organization_id text primary key references public.organizations (id) on delete cascade,
  project_icon text,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_activity enable row level security;
alter table public.task_subtasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.organization_preferences enable row level security;

drop policy if exists "organizations select for authenticated users" on public.organizations;
create policy "organizations select for authenticated users" on public.organizations
for select
using (auth.role() = 'authenticated');

drop policy if exists "organizations upsert default org" on public.organizations;
create policy "organizations upsert default org" on public.organizations
for insert
with check (auth.role() = 'authenticated' and id = 'forge-internal');

drop policy if exists "organizations update default org" on public.organizations;
create policy "organizations update default org" on public.organizations
for update
using (auth.role() = 'authenticated' and id = 'forge-internal')
with check (auth.role() = 'authenticated' and id = 'forge-internal');

drop policy if exists "profiles read same organization" on public.profiles;
create policy "profiles read same organization" on public.profiles
for select
using (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.user_id = auth.uid()
      and current_profile.organization_id = profiles.organization_id
  )
  or user_id = auth.uid()
);

drop policy if exists "profiles manage self" on public.profiles;
create policy "profiles manage self" on public.profiles
for insert
with check (user_id = auth.uid());

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
