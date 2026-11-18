insert into public.permissions (code, description) values
  ('customer.manage','Manage customers'),
  ('order.read','View customer and POS orders'),
  ('order.manage','Create and manage customer orders'),
  ('pos.manage','Create POS transactions'),
  ('quotation.manage','Create and manage quotations'),
  ('return.manage','Process customer returns')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name in ('owner','administrator','manager')
and p.code in ('customer.manage','order.read','order.manage','pos.manage','quotation.manage','return.manage')
on conflict do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='sales_staff'
and p.code in ('customer.manage','order.read','order.manage','quotation.manage')
on conflict do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='cashier'
and p.code in ('customer.manage','order.read','pos.manage','return.manage')
on conflict do nothing;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  address text,
  tax_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.order_status as enum (
  'pending','confirmed','processing','ready','shipped','delivered','cancelled','returned','refunded'
);

create table public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references public.customers(id) on delete restrict,
  location_id uuid references public.physical_locations(id) on delete restrict,
  status public.order_status not null default 'pending',
  currency char(3) not null default 'RWF' check(currency='RWF'),
  subtotal numeric(14,2) not null default 0 check(subtotal>=0),
  tax_amount numeric(14,2) not null default 0 check(tax_amount>=0),
  total_amount numeric(14,2) not null check(total_amount>=0),
  vat_rate numeric(6,3) not null default 0 check(vat_rate>=0),
  idempotency_key text not null unique,
  quotation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.customer_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check(quantity>0),
  unit_price numeric(14,2) not null check(unit_price>=0),
  line_total numeric(14,2) not null check(line_total>=0),
  unique(order_id,product_id)
);

create type public.quotation_status as enum ('draft','sent','accepted','expired','cancelled','converted');

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references public.customers(id) on delete restrict,
  status public.quotation_status not null default 'draft',
  valid_until timestamptz not null default (now()+interval '7 days'),
  currency char(3) not null default 'RWF' check(currency='RWF'),
  subtotal numeric(14,2) not null default 0 check(subtotal>=0),
  tax_amount numeric(14,2) not null default 0 check(tax_amount>=0),
  total_amount numeric(14,2) not null check(total_amount>=0),
  notes text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check(quantity>0),
  unit_price numeric(14,2) not null check(unit_price>=0),
  line_total numeric(14,2) not null check(line_total>=0),
  unique(quotation_id,product_id)
);

alter table public.customer_orders
add constraint customer_orders_quotation_fk
foreign key (quotation_id) references public.quotations(id) on delete restrict;

create table public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  location_id uuid not null references public.physical_locations(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  subtotal numeric(14,2) not null check(subtotal>=0),
  tax_amount numeric(14,2) not null default 0 check(tax_amount>=0),
  total_amount numeric(14,2) not null check(total_amount>=0),
  currency char(3) not null default 'RWF' check(currency='RWF'),
  idempotency_key text not null unique,
  cashier_id uuid references public.staff_profiles(id),
  created_at timestamptz not null default now()
);

create table public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  pos_sale_id uuid not null references public.pos_sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check(quantity>0),
  unit_price numeric(14,2) not null check(unit_price>=0),
  line_total numeric(14,2) not null check(line_total>=0),
  unique(pos_sale_id,product_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  customer_order_id uuid references public.customer_orders(id) on delete restrict,
  pos_sale_id uuid references public.pos_sales(id) on delete restrict,
  amount numeric(14,2) not null check(amount>0),
  payment_method text not null,
  reference text,
  idempotency_key text not null unique,
  recorded_by uuid references public.staff_profiles(id),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check((customer_order_id is not null)::int+(pos_sale_id is not null)::int=1)
);

create table public.returns (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_order_id uuid references public.customer_orders(id) on delete restrict,
  pos_sale_id uuid references public.pos_sales(id) on delete restrict,
  location_id uuid not null references public.physical_locations(id) on delete restrict,
  status text not null default 'requested' check(status in ('requested','approved','received','rejected','completed')),
  reason text not null,
  idempotency_key text not null unique,
  created_by uuid references public.staff_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check(quantity>0),
  unique(return_id,product_id)
);

create index customer_orders_status_idx on public.customer_orders(status);
create index quotations_status_idx on public.quotations(status);
create index pos_sales_location_idx on public.pos_sales(location_id);
create index payments_order_idx on public.payments(customer_order_id);
create index returns_status_idx on public.returns(status);

create trigger customers_updated_at before update on public.customers
for each row execute function public.handle_updated_at();
create trigger customer_orders_updated_at before update on public.customer_orders
for each row execute function public.handle_updated_at();
create trigger quotations_updated_at before update on public.quotations
for each row execute function public.handle_updated_at();
create trigger returns_updated_at before update on public.returns
for each row execute function public.handle_updated_at();

create or replace function public.next_sales_reference(p_kind text)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare next_number bigint;
begin
  if p_kind='ORD' then
    select coalesce(max(replace(reference,'ORD-','')::bigint),0)+1 into next_number from public.customer_orders;
  elsif p_kind='QUO' then
    select coalesce(max(replace(reference,'QUO-','')::bigint),0)+1 into next_number from public.quotations;
  elsif p_kind='POS' then
    select coalesce(max(replace(reference,'POS-','')::bigint),0)+1 into next_number from public.pos_sales;
  elsif p_kind='RET' then
    select coalesce(max(replace(reference,'RET-','')::bigint),0)+1 into next_number from public.returns;
  else raise exception 'invalid reference type'; end if;
  return p_kind||'-'||lpad(next_number::text,6,'0');
end;
$$;

create or replace function public.create_customer_order(
  p_customer_id uuid,
  p_location_id uuid,
  p_items jsonb,
  p_idempotency_key text,
  p_quotation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare existing_id uuid; order_id uuid; item record; balance record;
subtotal numeric(14,2):=0; total_amount numeric(14,2); ref text;
begin
  if not public.has_permission('order.manage') then raise exception 'permission denied'; end if;
  select id into existing_id from public.customer_orders where idempotency_key=p_idempotency_key;
  if existing_id is not null then return existing_id; end if;
  if p_items is null or jsonb_array_length(p_items)=0 then raise exception 'order items required'; end if;

  for item in select * from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
  loop
    if item.quantity<=0 then raise exception 'order quantities must be positive'; end if;
    select * into balance from public.inventory_balances
    where location_id=p_location_id and product_id=item.product_id::uuid for update;
    if balance.id is null or balance.available_quantity-item.quantity<0 then
      raise exception 'insufficient available stock';
    end if;
  end loop;

  ref:=public.next_sales_reference('ORD');
  insert into public.customer_orders(reference,customer_id,location_id,status,currency,subtotal,tax_amount,total_amount,vat_rate,idempotency_key,quotation_id)
  values(ref,p_customer_id,p_location_id,'pending','RWF',0,0,0,0,p_idempotency_key,p_quotation_id)
  returning id into order_id;

  for item in select * from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
  loop
    declare product record;
    begin
      select id,sale_price into product from public.products where id=item.product_id::uuid and status='active';
      if product.id is null then raise exception 'invalid product'; end if;
      subtotal:=subtotal+(product.sale_price*item.quantity);
      insert into public.order_items(order_id,product_id,quantity,unit_price,line_total)
      values(order_id,product.id,item.quantity,product.sale_price,product.sale_price*item.quantity);
      update public.inventory_balances
      set available_quantity=available_quantity-item.quantity,reserved_quantity=reserved_quantity+item.quantity
      where location_id=p_location_id and product_id=product.id;
      insert into public.stock_movements(location_id,product_id,movement_type,quantity,reference_type,reference_id,reason,idempotency_key,actor_id)
      values(p_location_id,product.id,'adjustment',-item.quantity,'customer_order',order_id,'Order stock reserved',p_idempotency_key||':'||product.id,auth.uid());
    end;
  end loop;
  total_amount:=subtotal;
  update public.customer_orders set subtotal=subtotal,total_amount=total_amount where id=order_id;
  return order_id;
end;
$$;

create or replace function public.accept_quotation(p_quotation_id uuid,p_location_id uuid,p_idempotency_key text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare quotation record; item record; existing_id uuid; order_id uuid; subtotal numeric(14,2):=0;
begin
  if not public.has_permission('quotation.manage') then raise exception 'permission denied'; end if;
  select id into existing_id from public.customer_orders where idempotency_key=p_idempotency_key;
  if existing_id is not null then return existing_id; end if;
  select * into quotation from public.quotations where id=p_quotation_id for update;
  if quotation.id is null then raise exception 'quotation not found'; end if;
  if quotation.status='converted' then raise exception 'quotation already converted'; end if;
  if quotation.status='cancelled' or quotation.valid_until<now() then raise exception 'quotation not eligible'; end if;

  for item in select * from public.quotation_items where quotation_id=p_quotation_id
  loop
    perform 1 from public.inventory_balances
      where location_id=p_location_id and product_id=item.product_id
      and available_quantity>=item.quantity;
    if not found then raise exception 'insufficient available stock'; end if;
  end loop;

  insert into public.customer_orders(reference,customer_id,location_id,status,currency,subtotal,tax_amount,total_amount,vat_rate,idempotency_key,quotation_id)
  values(public.next_sales_reference('ORD'),quotation.customer_id,p_location_id,'pending','RWF',quotation.subtotal,quotation.tax_amount,quotation.total_amount,0,p_idempotency_key,p_quotation_id)
  returning id into order_id;

  for item in select * from public.quotation_items where quotation_id=p_quotation_id
  loop
    insert into public.order_items(order_id,product_id,quantity,unit_price,line_total)
    values(order_id,item.product_id,item.quantity,item.unit_price,item.line_total);
    update public.inventory_balances set available_quantity=available_quantity-item.quantity,reserved_quantity=reserved_quantity+item.quantity
    where location_id=p_location_id and product_id=item.product_id;
  end loop;
  update public.quotations set status='converted' where id=p_quotation_id;
  return order_id;
end;
$$;

create or replace function public.cancel_customer_order(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path=public
as $$
declare order_record record; item record;
begin
  if not public.has_permission('order.manage') then raise exception 'permission denied'; end if;
  select * into order_record from public.customer_orders where id=p_order_id for update;
  if order_record.id is null then raise exception 'order not found'; end if;
  if order_record.status not in ('pending','confirmed') then raise exception 'order cannot be cancelled'; end if;
  for item in select * from public.order_items where order_id=p_order_id
  loop
    update public.inventory_balances
    set available_quantity=available_quantity+item.quantity,reserved_quantity=greatest(reserved_quantity-item.quantity,0)
    where location_id=order_record.location_id and product_id=item.product_id;
  end loop;
  update public.customer_orders set status='cancelled' where id=p_order_id;
  return true;
end;
$$;

create or replace function public.create_pos_sale(p_location_id uuid,p_customer_id uuid,p_items jsonb,p_idempotency_key text,p_payment_method text,p_payment_reference text)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare existing_id uuid;sale_id uuid;item record;subtotal numeric(14,2):=0;total_amount numeric(14,2);payment_id uuid;
begin
  if not public.has_permission('pos.manage') then raise exception 'permission denied'; end if;
  select id into existing_id from public.pos_sales where idempotency_key=p_idempotency_key;
  if existing_id is not null then return existing_id; end if;
  if p_items is null or jsonb_array_length(p_items)=0 then raise exception 'sale items required'; end if;

  for item in select * from jsonb_to_recordset(p_items) as x(product_id text,quantity integer)
  loop
    if item.quantity<=0 then raise exception 'sale quantities must be positive'; end if;
    perform 1 from public.inventory_balances where location_id=p_location_id and product_id=item.product_id::uuid and available_quantity>=item.quantity;
    if not found then raise exception 'insufficient available stock'; end if;
  end loop;

  insert into public.pos_sales(reference,location_id,customer_id,subtotal,tax_amount,total_amount,currency,idempotency_key,cashier_id)
  values(public.next_sales_reference('POS'),p_location_id,p_customer_id,0,0,0,'RWF',p_idempotency_key,auth.uid())
  returning id into sale_id;

  for item in select * from jsonb_to_recordset(p_items) as x(product_id text,quantity integer)
  loop
    declare product record;
    begin
      select id,sale_price into product from public.products where id=item.product_id::uuid and status='active';
      if product.id is null then raise exception 'invalid product'; end if;
      subtotal:=subtotal+product.sale_price*item.quantity;
      insert into public.pos_sale_items(pos_sale_id,product_id,quantity,unit_price,line_total)
      values(sale_id,product.id,item.quantity,product.sale_price,product.sale_price*item.quantity);
      update public.inventory_balances set available_quantity=available_quantity-item.quantity
      where location_id=p_location_id and product_id=product.id;
    end;
  end loop;
  total_amount:=subtotal;
  update public.pos_sales set subtotal=subtotal,total_amount=total_amount where id=sale_id;
  insert into public.payments(pos_sale_id,amount,payment_method,reference,idempotency_key,recorded_by)
  values(sale_id,total_amount,p_payment_method,p_payment_reference,p_idempotency_key||':payment',auth.uid())
  returning id into payment_id;
  return sale_id;
end;
$$;

revoke execute on function public.next_sales_reference(text) from public,anon;
revoke execute on function public.create_customer_order(uuid,uuid,jsonb,text,uuid) from public,anon;
revoke execute on function public.accept_quotation(uuid,uuid,text) from public,anon;
revoke execute on function public.cancel_customer_order(uuid) from public,anon;
revoke execute on function public.create_pos_sale(uuid,uuid,jsonb,text,text,text) from public,anon;
grant execute on function public.next_sales_reference(text) to authenticated;
grant execute on function public.create_customer_order(uuid,uuid,jsonb,text,uuid) to authenticated;
grant execute on function public.accept_quotation(uuid,uuid,text) to authenticated;
grant execute on function public.cancel_customer_order(uuid) to authenticated;
grant execute on function public.create_pos_sale(uuid,uuid,jsonb,text,text,text) to authenticated;

alter table public.customers enable row level security;
alter table public.customer_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;

create policy customers_manage on public.customers for all to authenticated
using(public.has_permission('customer.manage') or public.has_permission('order.manage'))
with check(public.has_permission('customer.manage') or public.has_permission('order.manage'));

create policy customer_orders_read on public.customer_orders for select to authenticated
using(public.has_permission('order.read') or public.has_permission('order.manage'));
create policy customer_orders_manage on public.customer_orders for all to authenticated
using(public.has_permission('order.manage'))
with check(public.has_permission('order.manage'));

create policy order_items_read on public.order_items for select to authenticated
using(public.has_permission('order.read') or public.has_permission('order.manage'));

create policy quotations_manage on public.quotations for all to authenticated
using(public.has_permission('quotation.manage'))
with check(public.has_permission('quotation.manage'));
create policy quotation_items_manage on public.quotation_items for all to authenticated
using(public.has_permission('quotation.manage'))
with check(public.has_permission('quotation.manage'));

create policy pos_sales_manage on public.pos_sales for all to authenticated
using(public.has_permission('pos.manage'))
with check(public.has_permission('pos.manage'));
create policy pos_sale_items_manage on public.pos_sale_items for all to authenticated
using(public.has_permission('pos.manage'))
with check(public.has_permission('pos.manage'));

create policy payments_read on public.payments for select to authenticated
using(public.has_permission('order.read') or public.has_permission('pos.manage'));

create policy returns_manage on public.returns for all to authenticated
using(public.has_permission('return.manage'))
with check(public.has_permission('return.manage'));
create policy return_items_manage on public.return_items for all to authenticated
using(public.has_permission('return.manage'))
with check(public.has_permission('return.manage'));
