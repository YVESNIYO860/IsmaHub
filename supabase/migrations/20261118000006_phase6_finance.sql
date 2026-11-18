insert into public.permissions (code, description) values
  ('expense.manage','Create and manage business expenses'),
  ('finance.read','View financial transactions and reports'),
  ('finance.manage','Manage VAT configuration and financial corrections'),
  ('profit.read','View gross and net profit reports')
on conflict (code) do update set description=excluded.description;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name in ('owner','administrator','manager')
and p.code in ('expense.manage','finance.read','finance.manage','profit.read')
on conflict do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p
on p.code in ('expense.manage','finance.read','profit.read')
where r.name='accountant'
on conflict do nothing;

create table public.vat_configuration (
  id smallint primary key default 1 check(id=1),
  rate numeric(6,3) not null default 0 check(rate>=0 and rate<=100),
  is_active boolean not null default true,
  effective_from timestamptz not null,
  configured_by uuid references public.staff_profiles(id),
  approved_by uuid references public.staff_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.vat_configuration(id,rate,effective_from)
values(1,0,now())
on conflict(id) do nothing;

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  description text not null,
  amount numeric(14,2) not null check(amount>0),
  currency char(3) not null default 'RWF' check(currency='RWF'),
  expense_date date not null default current_date,
  payment_method text,
  supplier_name text,
  receipt_reference text,
  status text not null default 'approved' check(status in ('draft','approved','void')),
  idempotency_key text not null unique,
  recorded_by uuid references public.staff_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_corrections (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  field_name text not null,
  original_value jsonb not null,
  corrected_value jsonb not null,
  reason text not null,
  actor_id uuid references public.staff_profiles(id),
  created_at timestamptz not null default now()
);

create index business_expenses_date_idx on public.business_expenses(expense_date desc);
create index business_expenses_category_idx on public.business_expenses(category_id);
create index financial_corrections_entity_idx on public.financial_corrections(entity_type,entity_id);

create trigger vat_configuration_updated_at before update on public.vat_configuration
for each row execute function public.handle_updated_at();
create trigger business_expenses_updated_at before update on public.business_expenses
for each row execute function public.handle_updated_at();

create or replace function public.next_expense_reference()
returns text
language plpgsql security definer set search_path=public
as $$
declare next_number bigint;
begin
 select coalesce(max(replace(reference,'EXP-','')::bigint),0)+1
 into next_number from public.business_expenses;
 return 'EXP-'||lpad(next_number::text,6,'0');
end;
$$;

create or replace function public.gross_profit_report(p_from timestamptz default null,p_to timestamptz default null)
returns table(revenue numeric,gross_profit numeric,vat_amount numeric)
language plpgsql security definer set search_path=public
as $$
begin
 if not public.has_permission('profit.read') then raise exception 'permission denied'; end if;
 return query
 with sales as (
   select (
     (select coalesce(sum(pi.quantity*pi.unit_price),0)
      from public.pos_sales ps
      join public.pos_sale_items pi on pi.pos_sale_id=ps.id
      where (p_from is null or ps.created_at>=p_from)
        and (p_to is null or ps.created_at<p_to))
     +
     (select coalesce(sum(oi.quantity*oi.unit_price),0)
      from public.customer_orders co
      join public.order_items oi on oi.order_id=co.id
      where co.status<> 'cancelled'
        and (p_from is null or co.created_at>=p_from)
        and (p_to is null or co.created_at<p_to))
   ) revenue
 ),
 pos_cogs as (
   select (
     (select coalesce(sum(pi.quantity*coalesce(p.cost_price,0)),0)
      from public.pos_sales ps
      join public.pos_sale_items pi on pi.pos_sale_id=ps.id
      join public.products p on p.id=pi.product_id
      where (p_from is null or ps.created_at>=p_from)
        and (p_to is null or ps.created_at<p_to))
     +
     (select coalesce(sum(oi.quantity*coalesce(p.cost_price,0)),0)
      from public.customer_orders co
      join public.order_items oi on oi.order_id=co.id
      join public.products p on p.id=oi.product_id
      where co.status<> 'cancelled'
        and (p_from is null or co.created_at>=p_from)
        and (p_to is null or co.created_at<p_to))
   ) cogs
 ),
 vat as (
   select (
     (select coalesce(sum(ps.tax_amount),0)
      from public.pos_sales ps
      where (p_from is null or ps.created_at>=p_from)
        and (p_to is null or ps.created_at<p_to))
     +
     (select coalesce(sum(co.tax_amount),0)
      from public.customer_orders co
      where co.status<> 'cancelled'
        and (p_from is null or co.created_at>=p_from)
        and (p_to is null or co.created_at<p_to))
   ) tax_amount
 )
 select sales.revenue,(sales.revenue-pos_cogs.cogs) gross_profit,vat.tax_amount
 from sales,pos_cogs,vat;
end;
$$;

create or replace function public.net_profit_report(p_from timestamptz default null,p_to timestamptz default null)
returns table(gross_profit numeric,recorded_expenses numeric,net_profit numeric)
language plpgsql security definer set search_path=public
as $$
declare gross numeric;
 expenses numeric;
begin
 if not public.has_permission('profit.read') then raise exception 'permission denied'; end if;
 select coalesce(g.gross_profit,0) into gross
 from public.gross_profit_report(p_from,p_to) g;
 select coalesce(sum(e.amount),0) into expenses
 from public.business_expenses e
 where e.status='approved'
 and (p_from is null or e.created_at>=p_from)
 and (p_to is null or e.created_at<p_to);
 return query select gross,expenses,(gross-expenses);
end;
$$;

revoke execute on function public.next_expense_reference() from public,anon;
revoke execute on function public.gross_profit_report(timestamptz,timestamptz) from public,anon;
revoke execute on function public.net_profit_report(timestamptz,timestamptz) from public,anon;
grant execute on function public.next_expense_reference() to authenticated;
grant execute on function public.gross_profit_report(timestamptz,timestamptz) to authenticated;
grant execute on function public.net_profit_report(timestamptz,timestamptz) to authenticated;

alter table public.vat_configuration enable row level security;
alter table public.expense_categories enable row level security;
alter table public.business_expenses enable row level security;
alter table public.financial_corrections enable row level security;

create policy vat_read on public.vat_configuration for select to authenticated
using(public.has_permission('finance.read') or public.has_permission('finance.manage'));
create policy vat_manage on public.vat_configuration for all to authenticated
using(public.has_permission('finance.manage'))
with check(public.has_permission('finance.manage'));

create policy expense_categories_manage on public.expense_categories for all to authenticated
using(public.has_permission('expense.manage') or public.has_permission('finance.read'))
with check(public.has_permission('expense.manage'));

create policy expenses_read on public.business_expenses for select to authenticated
using(public.has_permission('finance.read') or public.has_permission('expense.manage'));
create policy expenses_manage on public.business_expenses for all to authenticated
using(public.has_permission('expense.manage'))
with check(public.has_permission('expense.manage'));

create policy corrections_manage on public.financial_corrections for all to authenticated
using(public.has_permission('finance.manage'))
with check(public.has_permission('finance.manage'));
