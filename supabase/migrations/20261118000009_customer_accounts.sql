alter table public.customers
add column auth_user_id uuid unique references auth.users(id) on delete set null;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_type text := new.raw_user_meta_data->>'account_type';
  customer_name text := nullif(btrim(new.raw_user_meta_data->>'full_name'), '');
begin
  if account_type = 'customer' then
    insert into public.customers (auth_user_id, full_name, email, phone)
    values (
      new.id,
      coalesce(customer_name, new.email, 'Customer'),
      new.email,
      nullif(btrim(new.raw_user_meta_data->>'phone'), '')
    )
    on conflict (auth_user_id) do nothing;
  elsif new.raw_app_meta_data->>'account_type' = 'staff' then
    insert into public.staff_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

alter table public.customers enable row level security;
alter table public.customer_orders enable row level security;
alter table public.order_items enable row level security;

grant select on public.customers, public.customer_orders, public.order_items to authenticated;

create policy customers_read_self
on public.customers for select to authenticated
using (auth_user_id = auth.uid());

create policy customer_orders_read_self
on public.customer_orders for select to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = customer_orders.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

create policy order_items_read_self
on public.order_items for select to authenticated
using (
  exists (
    select 1
    from public.customer_orders
    join public.customers on customers.id = customer_orders.customer_id
    where customer_orders.id = order_items.order_id
      and customers.auth_user_id = auth.uid()
  )
);
