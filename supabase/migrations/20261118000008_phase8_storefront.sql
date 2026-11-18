alter table public.physical_locations
add column if not exists is_default boolean not null default false;

create unique index physical_locations_one_default
on public.physical_locations(is_default)
where is_default;

create index customers_phone_idx on public.customers(phone);

create or replace function public.create_public_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_items jsonb,
  p_idempotency_key text
)
returns table(order_id uuid, reference text)
language plpgsql
security definer
set search_path=public
as $$
declare
  existing_order record;
  customer_id uuid;
  location_id uuid;
  order_id uuid;
  order_reference text;
  item record;
  product record;
  subtotal numeric(14,2):=0;
begin
  if p_customer_name is null or length(trim(p_customer_name))<2 then
    raise exception 'customer name is required';
  end if;
  if p_phone is null or length(trim(p_phone))<7 then
    raise exception 'valid phone number is required';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))=0 then
    raise exception 'idempotency key is required';
  end if;
  if p_items is null or jsonb_array_length(p_items)=0 then
    raise exception 'order items required';
  end if;

  select co.id,co.reference into existing_order
  from public.customer_orders co
  where co.idempotency_key=p_idempotency_key;
  if existing_order.id is not null then
    return query select existing_order.id,existing_order.reference;
    return;
  end if;

  select id into location_id
  from public.physical_locations
  where is_active=true and (is_default=true or location_type='store')
  order by is_default desc,created_at asc
  limit 1;
  if location_id is null then
    raise exception 'no active store location configured';
  end if;

  insert into public.customers(full_name,phone,address)
  values(trim(p_customer_name),trim(p_phone),nullif(trim(p_address),''))
  returning id into customer_id;

  order_reference:=public.next_sales_reference('ORD');
  insert into public.customer_orders(
    reference,customer_id,location_id,status,currency,subtotal,tax_amount,total_amount,
    vat_rate,idempotency_key
  )
  values(
    order_reference,customer_id,location_id,'pending','RWF',0,0,0,0,p_idempotency_key
  )
  returning id into order_id;

  for item in select * from jsonb_to_recordset(p_items) as x(product_id text,quantity integer)
  loop
    if item.quantity<=0 then
      raise exception 'order quantities must be positive';
    end if;
    select id,sale_price into product
    from public.products
    where id=item.product_id::uuid and status='active';
    if product.id is null then
      raise exception 'invalid product';
    end if;
    perform 1
    from public.inventory_balances
    where location_id=location_id and product_id=product.id
      and available_quantity>=item.quantity;
    if not found then
      raise exception 'insufficient available stock';
    end if;

    update public.inventory_balances
    set available_quantity=available_quantity-item.quantity,
        reserved_quantity=reserved_quantity+item.quantity
    where location_id=location_id and product_id=product.id;

    insert into public.order_items(order_id,product_id,quantity,unit_price,line_total)
    values(order_id,product.id,item.quantity,product.sale_price,product.sale_price*item.quantity);
    subtotal:=subtotal+(product.sale_price*item.quantity);
  end loop;

  update public.customer_orders
  set subtotal=subtotal,total_amount=subtotal
  where id=order_id;
  return query select order_id,order_reference;
end;
$$;

create or replace function public.track_public_order(p_reference text,p_phone text)
returns table(
  reference text,
  status public.order_status,
  total_amount numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path=public
as $$
  select co.reference,co.status,co.total_amount,co.created_at
  from public.customer_orders co
  join public.customers c on c.id=co.customer_id
  where co.reference=p_reference
    and c.phone=trim(p_phone)
  limit 1;
$$;

revoke execute on function public.create_public_order(text,text,text,jsonb,text) from public,anon;
revoke execute on function public.track_public_order(text,text) from public,anon;
grant execute on function public.next_sales_reference(text) to anon;
grant execute on function public.create_public_order(text,text,text,jsonb,text) to anon,authenticated;
grant execute on function public.track_public_order(text,text) to anon,authenticated;
