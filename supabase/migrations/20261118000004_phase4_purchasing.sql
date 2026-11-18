insert into public.permissions (code, description) values
  ('supplier.manage', 'Manage suppliers'),
  ('purchase.read', 'View purchase orders and supplier transactions'),
  ('purchase.manage', 'Create and update purchase orders'),
  ('purchase.receive', 'Receive supplier deliveries'),
  ('purchase.pay', 'Record supplier invoices and payments'),
  ('warranty.manage', 'Manage supplier warranties and claims')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('owner', 'administrator', 'manager')
  and p.code in (
    'supplier.manage','purchase.read','purchase.manage','purchase.receive',
    'purchase.pay','warranty.manage'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('supplier.manage','purchase.read','purchase.manage','purchase.receive','purchase.pay')
where r.name = 'purchasing_staff'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('purchase.read','purchase.pay')
where r.name = 'accountant'
on conflict do nothing;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  contact_name text,
  email text,
  phone text,
  address text,
  tax_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.purchase_order_status as enum (
  'draft','submitted','approved','partially_received','received','cancelled','closed'
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  location_id uuid not null references public.physical_locations(id) on delete restrict,
  status public.purchase_order_status not null default 'draft',
  order_date date not null default current_date,
  expected_date date,
  currency char(3) not null default 'RWF' check (currency = 'RWF'),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  notes text,
  idempotency_key text not null unique,
  created_by uuid references public.staff_profiles(id),
  approved_by uuid references public.staff_profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  supplier_code text,
  quantity_ordered integer not null check (quantity_ordered > 0),
  quantity_received integer not null default 0 check (quantity_received >= 0),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  check (quantity_received <= quantity_ordered)
);

create table public.supplier_deliveries (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete restrict,
  location_id uuid not null references public.physical_locations(id) on delete restrict,
  reference text,
  delivered_at timestamptz not null default now(),
  idempotency_key text not null unique,
  received_by uuid references public.staff_profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create table public.supplier_delivery_items (
  delivery_id uuid not null references public.supplier_deliveries(id) on delete cascade,
  purchase_order_item_id uuid not null references public.purchase_order_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  primary key (delivery_id, purchase_order_item_id)
);

create table public.supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  purchase_order_id uuid references public.purchase_orders(id) on delete restrict,
  invoice_number text not null,
  invoice_date date not null,
  due_date date,
  currency char(3) not null default 'RWF' check (currency = 'RWF'),
  amount numeric(14,2) not null check (amount >= 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  status text not null default 'open' check (status in ('open','partially_paid','paid','cancelled')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (paid_amount <= amount),
  unique (supplier_id, invoice_number)
);

create table public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  invoice_id uuid references public.supplier_invoices(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  payment_method text not null,
  reference text,
  paid_at timestamptz not null default now(),
  idempotency_key text not null unique,
  recorded_by uuid references public.staff_profiles(id),
  created_at timestamptz not null default now()
);

create table public.supplier_warranties (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  product_id uuid references public.products(id) on delete restrict,
  name text not null,
  warranty_months integer not null check (warranty_months >= 0),
  terms text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_warranty_claims (
  id uuid primary key default gen_random_uuid(),
  warranty_id uuid not null references public.supplier_warranties(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  damaged_stock_id uuid,
  claim_reference text not null unique,
  status text not null default 'submitted'
    check (status in ('submitted','under_review','approved','rejected','resolved','closed')),
  description text not null,
  resolution text,
  submitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  idempotency_key text not null unique,
  created_by uuid references public.staff_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchase_orders_supplier_idx on public.purchase_orders(supplier_id);
create index purchase_orders_status_idx on public.purchase_orders(status);
create index purchase_order_items_order_idx on public.purchase_order_items(purchase_order_id);
create index supplier_deliveries_order_idx on public.supplier_deliveries(purchase_order_id);
create index supplier_invoices_supplier_idx on public.supplier_invoices(supplier_id);
create index supplier_payments_invoice_idx on public.supplier_payments(invoice_id);
create index warranty_claims_status_idx on public.supplier_warranty_claims(status);

create trigger suppliers_updated_at before update on public.suppliers
for each row execute function public.handle_updated_at();
create trigger purchase_orders_updated_at before update on public.purchase_orders
for each row execute function public.handle_updated_at();
create trigger supplier_invoices_updated_at before update on public.supplier_invoices
for each row execute function public.handle_updated_at();
create trigger supplier_warranties_updated_at before update on public.supplier_warranties
for each row execute function public.handle_updated_at();
create trigger supplier_warranty_claims_updated_at before update on public.supplier_warranty_claims
for each row execute function public.handle_updated_at();

create or replace function public.receive_supplier_delivery(
  p_purchase_order_id uuid,
  p_location_id uuid,
  p_items jsonb,
  p_reference text,
  p_notes text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_delivery_id uuid;
  delivery_id uuid;
  po record;
  item record;
  po_item record;
  quantity integer;
  all_received boolean;
begin
  if not public.has_permission('purchase.receive') then raise exception 'permission denied'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required';
  end if;

  select id into existing_delivery_id
  from public.supplier_deliveries
  where idempotency_key = p_idempotency_key;
  if existing_delivery_id is not null then return existing_delivery_id; end if;

  select * into po
  from public.purchase_orders
  where id = p_purchase_order_id
  for update;
  if po.id is null then raise exception 'purchase order not found'; end if;
  if po.status = 'cancelled' or po.status = 'closed' then raise exception 'purchase order is closed'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'delivery items required'; end if;

  insert into public.supplier_deliveries(
    purchase_order_id, location_id, reference, idempotency_key, received_by, notes
  )
  values (
    p_purchase_order_id, p_location_id, nullif(p_reference, ''),
    p_idempotency_key, auth.uid(), p_notes
  )
  returning id into delivery_id;

  for item in select * from jsonb_to_recordset(p_items) as x(purchase_order_item_id text, quantity integer)
  loop
    quantity := item.quantity;
    if quantity <= 0 then raise exception 'delivery quantities must be positive'; end if;
    select * into po_item
    from public.purchase_order_items
    where id = item.purchase_order_item_id::uuid
      and purchase_order_id = p_purchase_order_id
    for update;
    if po_item.id is null then raise exception 'invalid purchase order item'; end if;
    if po_item.quantity_received + quantity > po_item.quantity_ordered then
      raise exception 'delivery quantity exceeds ordered quantity';
    end if;

    update public.purchase_order_items
    set quantity_received = quantity_received + quantity
    where id = po_item.id;

    insert into public.supplier_delivery_items(delivery_id, purchase_order_item_id, quantity)
    values (delivery_id, po_item.id, quantity);

    insert into public.inventory_balances(location_id, product_id)
    values (p_location_id, po_item.product_id)
    on conflict (location_id, product_id) do nothing;
    update public.inventory_balances
    set available_quantity = available_quantity + quantity
    where location_id = p_location_id and product_id = po_item.product_id;

    insert into public.stock_movements(
      location_id, product_id, movement_type, quantity,
      reference_type, reference_id, reason, idempotency_key, actor_id
    )
    values (
      p_location_id, po_item.product_id, 'purchase_receipt', quantity,
      'supplier_delivery', delivery_id, p_notes,
      p_idempotency_key || ':' || po_item.id::text, auth.uid()
    );
  end loop;

  select bool_and(quantity_received = quantity_ordered) into all_received
  from public.purchase_order_items
  where purchase_order_id = p_purchase_order_id;

  update public.purchase_orders
  set status = case when all_received then 'received'::public.purchase_order_status
                    else 'partially_received'::public.purchase_order_status end
  where id = p_purchase_order_id;
  return delivery_id;
end;
$$;

create or replace function public.record_supplier_payment(
  p_supplier_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_reference text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_payment_id uuid;
  payment_id uuid;
  invoice record;
begin
  if not public.has_permission('purchase.pay') then raise exception 'permission denied'; end if;
  if p_amount <= 0 then raise exception 'payment amount must be positive'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required';
  end if;

  select id into existing_payment_id
  from public.supplier_payments
  where idempotency_key = p_idempotency_key;
  if existing_payment_id is not null then return existing_payment_id; end if;

  if p_invoice_id is not null then
    select * into invoice
    from public.supplier_invoices
    where id = p_invoice_id
    for update;
    if invoice.id is null or invoice.supplier_id <> p_supplier_id then
      raise exception 'invalid supplier invoice';
    end if;
    if invoice.paid_amount + p_amount > invoice.amount then
      raise exception 'payment exceeds invoice amount';
    end if;
  end if;

  insert into public.supplier_payments(
    supplier_id, invoice_id, amount, payment_method, reference,
    idempotency_key, recorded_by
  )
  values (
    p_supplier_id, p_invoice_id, p_amount, p_payment_method,
    nullif(p_reference, ''), p_idempotency_key, auth.uid()
  )
  returning id into payment_id;

  if p_invoice_id is not null then
    update public.supplier_invoices
    set paid_amount = paid_amount + p_amount,
        status = case
          when paid_amount + p_amount = amount then 'paid'
          else 'partially_paid'
        end
    where id = p_invoice_id;
  end if;
  return payment_id;
end;
$$;

revoke execute on function public.receive_supplier_delivery(uuid, uuid, jsonb, text, text, text) from public, anon;
revoke execute on function public.record_supplier_payment(uuid, uuid, numeric, text, text, text) from public, anon;
grant execute on function public.receive_supplier_delivery(uuid, uuid, jsonb, text, text, text) to authenticated;
grant execute on function public.record_supplier_payment(uuid, uuid, numeric, text, text, text) to authenticated;

alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.supplier_deliveries enable row level security;
alter table public.supplier_delivery_items enable row level security;
alter table public.supplier_invoices enable row level security;
alter table public.supplier_payments enable row level security;
alter table public.supplier_warranties enable row level security;
alter table public.supplier_warranty_claims enable row level security;

create policy purchasing_read_suppliers on public.suppliers for select to authenticated
using (public.has_permission('supplier.manage') or public.has_permission('purchase.read'));
create policy purchasing_manage_suppliers on public.suppliers for all to authenticated
using (public.has_permission('supplier.manage'))
with check (public.has_permission('supplier.manage'));

create policy purchasing_read_orders on public.purchase_orders for select to authenticated
using (public.has_permission('purchase.read') or public.has_permission('purchase.manage'));
create policy purchasing_manage_orders on public.purchase_orders for all to authenticated
using (public.has_permission('purchase.manage'))
with check (public.has_permission('purchase.manage'));

create policy purchasing_read_order_items on public.purchase_order_items for select to authenticated
using (public.has_permission('purchase.read') or public.has_permission('purchase.manage'));
create policy purchasing_manage_order_items on public.purchase_order_items for all to authenticated
using (public.has_permission('purchase.manage'))
with check (public.has_permission('purchase.manage'));

create policy purchasing_read_deliveries on public.supplier_deliveries for select to authenticated
using (public.has_permission('purchase.read') or public.has_permission('purchase.receive'));
create policy purchasing_read_delivery_items on public.supplier_delivery_items for select to authenticated
using (public.has_permission('purchase.read') or public.has_permission('purchase.receive'));

create policy purchasing_read_invoices on public.supplier_invoices for select to authenticated
using (public.has_permission('purchase.read') or public.has_permission('purchase.pay'));
create policy purchasing_manage_invoices on public.supplier_invoices for all to authenticated
using (public.has_permission('purchase.pay'))
with check (public.has_permission('purchase.pay'));

create policy purchasing_read_payments on public.supplier_payments for select to authenticated
using (public.has_permission('purchase.read') or public.has_permission('purchase.pay'));

create policy warranty_read on public.supplier_warranties for select to authenticated
using (public.has_permission('warranty.manage') or public.has_permission('purchase.read'));
create policy warranty_manage on public.supplier_warranties for all to authenticated
using (public.has_permission('warranty.manage'))
with check (public.has_permission('warranty.manage'));

create policy warranty_claim_read on public.supplier_warranty_claims for select to authenticated
using (public.has_permission('warranty.manage') or public.has_permission('purchase.read'));
create policy warranty_claim_manage on public.supplier_warranty_claims for all to authenticated
using (public.has_permission('warranty.manage'))
with check (public.has_permission('warranty.manage'));
