create table if not exists public.user_work_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_pay_rate numeric(12,2) not null default 0,
  default_weekend_pay_rate numeric(12,2) not null default 0,
  default_break_time numeric(10,2) not null default 1,
  default_meal_allowance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint default_pay_rate_non_negative check (default_pay_rate >= 0),
  constraint default_weekend_pay_rate_non_negative check (default_weekend_pay_rate >= 0),
  constraint default_break_time_non_negative check (default_break_time >= 0),
  constraint default_meal_allowance_non_negative check (default_meal_allowance >= 0)
);

create or replace function public.set_updated_at_user_work_settings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_work_settings_set_updated_at on public.user_work_settings;
create trigger user_work_settings_set_updated_at
before update on public.user_work_settings
for each row execute function public.set_updated_at_user_work_settings();

alter table public.user_work_settings enable row level security;

drop policy if exists user_work_settings_select_self on public.user_work_settings;
create policy user_work_settings_select_self
on public.user_work_settings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_work_settings_upsert_self on public.user_work_settings;
create policy user_work_settings_upsert_self
on public.user_work_settings
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists user_work_settings_update_self on public.user_work_settings;
create policy user_work_settings_update_self
on public.user_work_settings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

