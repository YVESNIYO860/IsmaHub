create extension if not exists pgcrypto;

create type public.staff_role as enum (
  'owner',
  'administrator',
  'manager',
  'inventory_manager',
  'sales_staff',
  'cashier',
  'purchasing_staff',
  'accountant'
);

create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id smallserial primary key,
  name staff_role not null unique,
  description text
);

insert into public.roles (name, description) values
  ('owner', 'Business owner with full administrative authority'),
  ('administrator', 'System administrator'),
  ('manager', 'Store manager'),
  ('inventory_manager', 'Inventory and warehouse manager'),
  ('sales_staff', 'Sales representative'),
  ('cashier', 'POS cashier'),
  ('purchasing_staff', 'Purchasing and supplier staff'),
  ('accountant', 'Accounting and financial reporting staff');

create table public.permissions (
  id smallserial primary key,
  code text not null unique,
  description text
);

create table public.role_permissions (
  role_id smallint not null references public.roles(id) on delete cascade,
  permission_id smallint not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.staff_roles (
  user_id uuid not null references public.staff_profiles(id) on delete cascade,
  role_id smallint not null references public.roles(id) on delete cascade,
  assigned_by uuid references public.staff_profiles(id),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.staff_profiles(id),
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger staff_profiles_updated_at
before update on public.staff_profiles
for each row execute function public.handle_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.staff_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_roles sr
    join public.roles r on r.id = sr.role_id
    where sr.user_id = auth.uid()
      and r.name = 'owner'
  );
$$;

create or replace function public.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_roles sr
    join public.role_permissions rp on rp.role_id = sr.role_id
    join public.permissions p on p.id = rp.permission_id
    where sr.user_id = auth.uid()
      and p.code = permission_code
  );
$$;

alter table public.staff_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_roles enable row level security;
alter table public.audit_logs enable row level security;

create policy staff_profiles_select_self_or_owner
on public.staff_profiles for select
to authenticated
using (id = auth.uid() or public.is_owner());

create policy staff_profiles_update_owner
on public.staff_profiles for update
to authenticated
using (public.is_owner())
with check (public.is_owner());

create policy roles_authenticated_read
on public.roles for select
to authenticated
using (true);

create policy permissions_owner_read
on public.permissions for select
to authenticated
using (public.is_owner());

create policy role_permissions_owner_read
on public.role_permissions for select
to authenticated
using (public.is_owner());

create policy staff_roles_owner_manage
on public.staff_roles for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

create policy audit_logs_owner_read
on public.audit_logs for select
to authenticated
using (public.is_owner());
