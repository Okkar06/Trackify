create table if not exists public.work_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  break_time numeric(10,2) not null default 1,
  pay_rate numeric(12,2) not null,
  weekend_pay_rate numeric(12,2) not null default 0,
  meal_allowance numeric(12,2) not null default 0,
  total_hours numeric(10,2) not null,
  payable_hours numeric(10,2) not null,
  total_pay numeric(12,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_entries_break_time_non_negative check (break_time >= 0),
  constraint work_entries_pay_rate_non_negative check (pay_rate >= 0),
  constraint work_entries_weekend_pay_rate_non_negative check (weekend_pay_rate >= 0),
  constraint work_entries_meal_allowance_non_negative check (meal_allowance >= 0),
  constraint work_entries_total_hours_non_negative check (total_hours >= 0),
  constraint work_entries_payable_hours_non_negative check (payable_hours >= 0),
  constraint work_entries_total_pay_non_negative check (total_pay >= 0)
);

drop trigger if exists work_entries_set_updated_at on public.work_entries;
create trigger work_entries_set_updated_at
before update on public.work_entries
for each row execute function public.set_updated_at();

create index if not exists work_entries_user_date_idx on public.work_entries (user_id, date);
create index if not exists work_entries_user_start_idx on public.work_entries (user_id, date, start_time);

alter table public.work_entries enable row level security;

drop policy if exists work_entries_select_self on public.work_entries;
create policy work_entries_select_self
on public.work_entries
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists work_entries_insert_self on public.work_entries;
create policy work_entries_insert_self
on public.work_entries
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists work_entries_update_self on public.work_entries;
create policy work_entries_update_self
on public.work_entries
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists work_entries_delete_self on public.work_entries;
create policy work_entries_delete_self
on public.work_entries
for delete
to authenticated
using (user_id = auth.uid());

