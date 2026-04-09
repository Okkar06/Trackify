create extension if not exists pgcrypto;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.roles (name)
values ('user'), ('admin')
on conflict (name) do nothing;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  full_name text not null,
  email text,
  profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pay_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  weekday_pay_rate numeric(12,2) not null default 0,
  weekend_pay_rate numeric(12,2) not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.break_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  default_break_minutes int not null default 60,
  is_break_paid boolean not null default false,
  break_pay_rate numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint default_break_minutes_non_negative check (default_break_minutes >= 0)
);

create table if not exists public.work_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  total_hours numeric(10,2) not null default 0,
  break_time numeric(10,2) not null default 1,
  pay_rate numeric(12,2) not null default 0,
  weekend_pay_rate numeric(12,2) not null default 0,
  meal_allowance numeric(12,2) not null default 0,
  payable_hours numeric(10,2) not null default 0,
  total_pay numeric(12,2) not null default 0,
  break_minutes int,
  is_break_paid boolean,
  break_pay numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_entries_unique_user_date_start unique (user_id, date, start_time)
);

create index if not exists work_entries_user_date_idx on public.work_entries (user_id, date);

create table if not exists public.ai_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  storage_path text not null,
  original_filename text,
  status text not null default 'pending',
  extracted_data jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_uploads_user_created_idx on public.ai_uploads (user_id, created_at desc);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  export_type text not null,
  period_type text not null,
  period_start date,
  period_end date,
  storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists exports_user_created_idx on public.exports (user_id, created_at desc);

create table if not exists public.password_reset_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  email text,
  requested_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists pay_settings_set_updated_at on public.pay_settings;
create trigger pay_settings_set_updated_at
before update on public.pay_settings
for each row execute function public.set_updated_at();

drop trigger if exists break_settings_set_updated_at on public.break_settings;
create trigger break_settings_set_updated_at
before update on public.break_settings
for each row execute function public.set_updated_at();

drop trigger if exists work_entries_set_updated_at on public.work_entries;
create trigger work_entries_set_updated_at
before update on public.work_entries
for each row execute function public.set_updated_at();

drop trigger if exists ai_uploads_set_updated_at on public.ai_uploads;
create trigger ai_uploads_set_updated_at
before update on public.ai_uploads
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id uuid;
begin
  select id into default_role_id from public.roles where name = 'user';

  insert into public.users (id, role_id)
  values (new.id, default_role_id)
  on conflict (id) do nothing;

  insert into public.user_profiles (user_id, full_name, email, profile_image_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'profile_image_url'
  )
  on conflict (user_id) do nothing;

  insert into public.pay_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.break_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.id = auth.uid() and r.name = 'admin'
  );
$$;

alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.pay_settings enable row level security;
alter table public.break_settings enable row level security;
alter table public.work_entries enable row level security;
alter table public.ai_uploads enable row level security;
alter table public.exports enable row level security;
alter table public.password_reset_logs enable row level security;

drop policy if exists roles_read on public.roles;
create policy roles_read
on public.roles
for select
to authenticated
using (true);

drop policy if exists users_read_self_or_admin on public.users;
create policy users_read_self_or_admin
on public.users
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists users_update_self_or_admin on public.users;
create policy users_update_self_or_admin
on public.users
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists user_profiles_read_self_or_admin on public.user_profiles;
create policy user_profiles_read_self_or_admin
on public.user_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_profiles_update_self_or_admin on public.user_profiles;
create policy user_profiles_update_self_or_admin
on public.user_profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists pay_settings_read_self_or_admin on public.pay_settings;
create policy pay_settings_read_self_or_admin
on public.pay_settings
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists pay_settings_update_self_or_admin on public.pay_settings;
create policy pay_settings_update_self_or_admin
on public.pay_settings
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists break_settings_read_self_or_admin on public.break_settings;
create policy break_settings_read_self_or_admin
on public.break_settings
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists break_settings_update_self_or_admin on public.break_settings;
create policy break_settings_update_self_or_admin
on public.break_settings
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists work_entries_select_self_or_admin on public.work_entries;
create policy work_entries_select_self_or_admin
on public.work_entries
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists work_entries_insert_self on public.work_entries;
create policy work_entries_insert_self
on public.work_entries
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists work_entries_update_self_or_admin on public.work_entries;
create policy work_entries_update_self_or_admin
on public.work_entries
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists work_entries_delete_self_or_admin on public.work_entries;
create policy work_entries_delete_self_or_admin
on public.work_entries
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_uploads_select_self_or_admin on public.ai_uploads;
create policy ai_uploads_select_self_or_admin
on public.ai_uploads
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_uploads_insert_self on public.ai_uploads;
create policy ai_uploads_insert_self
on public.ai_uploads
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists ai_uploads_update_self_or_admin on public.ai_uploads;
create policy ai_uploads_update_self_or_admin
on public.ai_uploads
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists exports_select_self_or_admin on public.exports;
create policy exports_select_self_or_admin
on public.exports
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists exports_insert_self on public.exports;
create policy exports_insert_self
on public.exports
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists password_reset_logs_select_self_or_admin on public.password_reset_logs;
create policy password_reset_logs_select_self_or_admin
on public.password_reset_logs
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());
