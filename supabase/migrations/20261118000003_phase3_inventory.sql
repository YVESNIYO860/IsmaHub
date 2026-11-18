insert into public.permissions (code, description) values
  ('location.manage', 'Manage physical locations'),
  ('inventory.read', 'View stock balances and movements'),
  ('inventory.adjust', 'Adjust stock and record damaged stock'),
  ('inventory.transfer', 'Create and complete stock transfers')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('owner', 'administrator', 'manager')
  and p.code in ('location.manage', 'inventory.read', 'inventory.adjust', 'inventory.transfer')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('inventory.read', 'inventory.adjust', 'inventory.transfer')
where r.name = 'inventory_manager'
on conflict do nothing;

create type public.location_type as enum ('store', 'warehouse', 'supplier', 'customer', 'transit');
create type public.stock_movement_type as enum (
  'opening',
  'purchase_receipt',
  'sale',
  'sale_cancellation',
  'transfer_out',
  'transfer_in',
  'adjustment',
  'damage',
  'damage_return',
  'return'
);
create type public.stock_transfer_status as enum (
  'draft',
  'in_transit',
  'completed',
  'cancelled'
);

create table public.physical_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  location_type public.location_type not null default 'store',
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_balances (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.physical_locations(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  available_quantity integer not null default 0 check (available_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  damaged_quantity integer not null default 0 check (damaged_quantity >= 0),
  other_quantity integer not null default 0 check (other_quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (location_id, product_id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.physical_locations(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type public.stock_movement_type not null,
  quantity integer not null check (quantity <> 0),
  reference_type text,
  reference_id uuid,
  reason text,
  idempotency_key text,
  actor_id uuid references public.staff_profiles(id),
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  from_location_id uuid not null references public.physical_locations(id) on delete restrict,
  to_location_id uuid not null references public.physical_locations(id) on delete restrict,
  status public.stock_transfer_status not null default 'draft',
  notes text,
  idempotency_key text not null unique,
  created_by uuid references public.staff_profiles(id),
  completed_by uuid references public.staff_profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (from_location_id <> to_location_id)
);

create table public.stock_transfer_items (
  transfer_id uuid not null references public.stock_transfers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  primary key (transfer_id, product_id)
);

create table public.damaged_stock (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.physical_locations(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  reason text not null,
  supplier_warranty_eligible boolean not null default false,
  status text not null default 'recorded'
    check (status in ('recorded', 'under_review', 'disposed', 'returned_to_supplier')),
  idempotency_key text not null unique,
  recorded_by uuid references public.staff_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_balances_location_idx on public.inventory_balances(location_id);
create index inventory_balances_product_idx on public.inventory_balances(product_id);
create index stock_movements_location_idx on public.stock_movements(location_id);
create index stock_movements_product_idx on public.stock_movements(product_id);
create index stock_movements_created_idx on public.stock_movements(created_at desc);
create index stock_transfers_status_idx on public.stock_transfers(status);
create index damaged_stock_status_idx on public.damaged_stock(status);

create trigger physical_locations_updated_at
before update on public.physical_locations
for each row execute function public.handle_updated_at();

create trigger inventory_balances_updated_at
before update on public.inventory_balances
for each row execute function public.handle_updated_at();

create trigger damaged_stock_updated_at
before update on public.damaged_stock
for each row execute function public.handle_updated_at();

create or replace function public.adjust_stock(
  p_location_id uuid,
  p_product_id uuid,
  p_quantity_delta integer,
  p_reason text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_movement_id uuid;
  movement_id uuid;
  balance public.inventory_balances%rowtype;
begin
  if not public.has_permission('inventory.adjust') then
    raise exception 'permission denied';
  end if;
  if p_quantity_delta = 0 then
    raise exception 'quantity delta must not be zero';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required';
  end if;

  select id into existing_movement_id
  from public.stock_movements
  where idempotency_key = p_idempotency_key;
  if existing_movement_id is not null then
    return existing_movement_id;
  end if;

  insert into public.inventory_balances(location_id, product_id)
  values (p_location_id, p_product_id)
  on conflict (location_id, product_id) do nothing;

  select * into balance
  from public.inventory_balances
  where location_id = p_location_id and product_id = p_product_id
  for update;

  if p_quantity_delta < 0 and balance.available_quantity + p_quantity_delta < 0 then
    raise exception 'insufficient available stock';
  end if;

  update public.inventory_balances
  set available_quantity = available_quantity + p_quantity_delta
  where location_id = p_location_id and product_id = p_product_id;

  insert into public.stock_movements(
    location_id, product_id, movement_type, quantity, reason, idempotency_key, actor_id
  )
  values (
    p_location_id,
    p_product_id,
    'adjustment',
    p_quantity_delta,
    p_reason,
    p_idempotency_key,
    auth.uid()
  )
  returning id into movement_id;
  return movement_id;
end;
$$;

create or replace function public.complete_stock_transfer(
  p_from_location_id uuid,
  p_to_location_id uuid,
  p_items jsonb,
  p_notes text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_transfer_id uuid;
  transfer_id uuid;
  item record;
  product_id uuid;
  quantity integer;
  source_balance public.inventory_balances%rowtype;
  next_reference bigint;
  transfer_reference text;
begin
  if not public.has_permission('inventory.transfer') then
    raise exception 'permission denied';
  end if;
  if p_from_location_id = p_to_location_id then
    raise exception 'source and destination locations must differ';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required';
  end if;

  select id into existing_transfer_id
  from public.stock_transfers
  where idempotency_key = p_idempotency_key;
  if existing_transfer_id is not null then
    return existing_transfer_id;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'at least one transfer item is required';
  end if;

  select coalesce(max(replace(reference, 'TRF-', '')::bigint), 0) + 1
  into next_reference
  from public.stock_transfers;
  transfer_reference := 'TRF-' || lpad(next_reference::text, 6, '0');

  insert into public.stock_transfers(
    reference,
    from_location_id,
    to_location_id,
    status,
    notes,
    idempotency_key,
    created_by,
    completed_by,
    completed_at
  )
  values (
    transfer_reference,
    p_from_location_id,
    p_to_location_id,
    'completed',
    p_notes,
    p_idempotency_key,
    auth.uid(),
    auth.uid(),
    now()
  )
  returning id into transfer_id;

  for item in select * from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
  loop
    product_id := item.product_id::uuid;
    quantity := item.quantity;
    if quantity <= 0 then
      raise exception 'transfer quantities must be positive';
    end if;

    insert into public.inventory_balances(location_id, product_id)
    values (p_from_location_id, product_id), (p_to_location_id, product_id)
    on conflict (location_id, product_id) do nothing;

    select * into source_balance
    from public.inventory_balances
    where location_id = p_from_location_id and product_id = product_id
    for update;
    if source_balance.available_quantity < quantity then
      raise exception 'insufficient available stock';
    end if;

    update public.inventory_balances
    set available_quantity = available_quantity - quantity
    where location_id = p_from_location_id and product_id = product_id;
    update public.inventory_balances
    set available_quantity = available_quantity + quantity
    where location_id = p_to_location_id and product_id = product_id;

    insert into public.stock_transfer_items(transfer_id, product_id, quantity)
    values (transfer_id, product_id, quantity);
    insert into public.stock_movements(
      location_id, product_id, movement_type, quantity,
      reference_type, reference_id, reason, idempotency_key, actor_id
    )
    values
      (p_from_location_id, product_id, 'transfer_out', -quantity,
       'stock_transfer', transfer_id, p_notes, p_idempotency_key || ':out:' || product_id, auth.uid()),
      (p_to_location_id, product_id, 'transfer_in', quantity,
       'stock_transfer', transfer_id, p_notes, p_idempotency_key || ':in:' || product_id, auth.uid());
  end loop;
  return transfer_id;
end;
$$;

create or replace function public.record_damaged_stock(
  p_location_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_reason text,
  p_supplier_warranty_eligible boolean,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  damaged_id uuid;
  balance public.inventory_balances%rowtype;
begin
  if not public.has_permission('inventory.adjust') then
    raise exception 'permission denied';
  end if;
  if p_quantity <= 0 then raise exception 'quantity must be positive'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required';
  end if;

  select id into existing_id
  from public.damaged_stock
  where idempotency_key = p_idempotency_key;
  if existing_id is not null then return existing_id; end if;

  insert into public.inventory_balances(location_id, product_id)
  values (p_location_id, p_product_id)
  on conflict (location_id, product_id) do nothing;

  select * into balance
  from public.inventory_balances
  where location_id = p_location_id and product_id = p_product_id
  for update;
  if balance.available_quantity < p_quantity then
    raise exception 'insufficient available stock';
  end if;

  update public.inventory_balances
  set available_quantity = available_quantity - p_quantity,
      damaged_quantity = damaged_quantity + p_quantity
  where location_id = p_location_id and product_id = p_product_id;

  insert into public.damaged_stock(
    location_id, product_id, quantity, reason,
    supplier_warranty_eligible, idempotency_key, recorded_by
  )
  values (
    p_location_id, p_product_id, p_quantity, p_reason,
    p_supplier_warranty_eligible, p_idempotency_key, auth.uid()
  )
  returning id into damaged_id;

  insert into public.stock_movements(
    location_id, product_id, movement_type, quantity,
    reference_type, reference_id, reason, idempotency_key, actor_id
  )
  values (
    p_location_id, p_product_id, 'damage', -p_quantity,
    'damaged_stock', damaged_id, p_reason, p_idempotency_key, auth.uid()
  );
  return damaged_id;
end;
$$;

revoke execute on function public.adjust_stock(uuid, uuid, integer, text, text) from public, anon;
revoke execute on function public.complete_stock_transfer(uuid, uuid, jsonb, text, text) from public, anon;
revoke execute on function public.record_damaged_stock(uuid, uuid, integer, text, boolean, text) from public, anon;
grant execute on function public.adjust_stock(uuid, uuid, integer, text, text) to authenticated;
grant execute on function public.complete_stock_transfer(uuid, uuid, jsonb, text, text) to authenticated;
grant execute on function public.record_damaged_stock(uuid, uuid, integer, text, boolean, text) to authenticated;

alter table public.physical_locations enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_transfers enable row level security;
alter table public.stock_transfer_items enable row level security;
alter table public.damaged_stock enable row level security;

create policy physical_locations_read
on public.physical_locations for select
to authenticated
using (public.has_permission('inventory.read') or public.has_permission('location.manage'));

create policy physical_locations_manage
on public.physical_locations for all
to authenticated
using (public.has_permission('location.manage'))
with check (public.has_permission('location.manage'));

create policy inventory_balances_read
on public.inventory_balances for select
to authenticated
using (public.has_permission('inventory.read') or public.has_permission('inventory.adjust') or public.has_permission('inventory.transfer'));

create policy stock_movements_read
on public.stock_movements for select
to authenticated
using (public.has_permission('inventory.read') or public.has_permission('inventory.adjust') or public.has_permission('inventory.transfer'));

create policy stock_transfers_read
on public.stock_transfers for select
to authenticated
using (public.has_permission('inventory.read') or public.has_permission('inventory.transfer'));

create policy stock_transfer_items_read
on public.stock_transfer_items for select
to authenticated
using (public.has_permission('inventory.read') or public.has_permission('inventory.transfer'));

create policy damaged_stock_read
on public.damaged_stock for select
to authenticated
using (public.has_permission('inventory.read') or public.has_permission('inventory.adjust'));
