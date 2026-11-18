insert into public.permissions(code,description) values
 ('staff.manage','Create and manage staff accounts'),
 ('staff.read','View staff accounts'),
 ('role.manage','Assign roles and manage permissions'),
 ('audit.read','View audit logs'),
 ('dashboard.read','View operational dashboard')
on conflict(code)do update set description=excluded.description;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name in ('owner','administrator')
and p.code in ('staff.manage','staff.read','role.manage','audit.read','dashboard.read')
on conflict do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='manager'
and p.code in ('staff.read','audit.read','dashboard.read')
on conflict do nothing;

alter table public.audit_logs add column if not exists ip_address text;
alter table public.audit_logs add column if not exists user_agent text;
alter table public.audit_logs add column if not exists request_id text;

create index audit_logs_actor_idx on public.audit_logs(actor_id);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index audit_logs_action_idx on public.audit_logs(action);
create index staff_profiles_active_idx on public.staff_profiles(is_active);

create or replace function public.assign_staff_role(p_user_id uuid,p_role_name text,p_assigned_by uuid default auth.uid())
returns boolean
language plpgsql security definer set search_path=public
as $$
declare role_record record;
begin
 if not public.has_permission('role.manage') and not public.is_owner() then
  raise exception 'permission denied';
 end if;
 if p_role_name='owner' and not public.is_owner() then
  raise exception 'only owner may assign owner role';
 end if;
 select id,name into role_record from public.roles where name=p_role_name::public.staff_role;
 if role_record.id is null then raise exception 'invalid role'; end if;
 insert into public.staff_roles(user_id,role_id,assigned_by)
 values(p_user_id,role_record.id,p_assigned_by)
 on conflict(user_id,role_id) do update set assigned_by=excluded.assigned_by,assigned_at=now();
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'staff.role_assigned','staff_profile',p_user_id::text,
 jsonb_build_object('role',role_record.name));
 return true;
end;
$$;

create or replace function public.remove_staff_role(p_user_id uuid,p_role_name text)
returns boolean
language plpgsql security definer set search_path=public
as $$
declare role_record record;
begin
 if not public.has_permission('role.manage') and not public.is_owner() then
  raise exception 'permission denied';
 end if;
 if p_role_name='owner' and not public.is_owner() then
  raise exception 'only owner may remove owner role';
 end if;
 if p_user_id=auth.uid() and p_role_name='owner' then
  raise exception 'owner cannot remove their own owner role';
 end if;
 select id,name into role_record from public.roles where name=p_role_name::public.staff_role;
 if role_record.id is null then raise exception 'invalid role'; end if;
 delete from public.staff_roles where user_id=p_user_id and role_id=role_record.id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'staff.role_removed','staff_profile',p_user_id::text,
 jsonb_build_object('role',role_record.name));
 return true;
end;
$$;

create or replace function public.dashboard_summary()
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare result jsonb;
begin
 if not public.has_permission('dashboard.read') then raise exception 'permission denied'; end if;
 select jsonb_build_object(
  'pending_orders',(select count(*) from public.customer_orders where status='pending'),
  'pending_quotations',(select count(*) from public.quotations where status='sent'),
  'active_products',(select count(*) from public.products where status='active'),
  'open_purchase_orders',(select count(*) from public.purchase_orders where status not in ('received','cancelled','closed')),
  'low_stock_products',(select count(*) from (
    select product_id from public.inventory_balances
    group by product_id having sum(available_quantity)<=5
  ) low),
  'damaged_units',(select coalesce(sum(damaged_quantity),0) from public.inventory_balances),
  'today_pos_sales',(select coalesce(sum(total_amount),0) from public.pos_sales where created_at>=date_trunc('day',now()))
 ) into result;
 return result;
end;
$$;

revoke execute on function public.assign_staff_role(uuid,text,uuid) from public,anon;
revoke execute on function public.remove_staff_role(uuid,text) from public,anon;
revoke execute on function public.dashboard_summary() from public,anon;
grant execute on function public.assign_staff_role(uuid,text,uuid) to authenticated;
grant execute on function public.remove_staff_role(uuid,text) to authenticated;
grant execute on function public.dashboard_summary() to authenticated;

drop policy if exists staff_profiles_select_self_or_owner on public.staff_profiles;
create policy staff_profiles_select_authorized
on public.staff_profiles for select to authenticated
using(id=auth.uid() or public.has_permission('staff.read') or public.is_owner());

drop policy if exists staff_profiles_update_owner on public.staff_profiles;
create policy staff_profiles_update_authorized
on public.staff_profiles for update to authenticated
using(public.has_permission('staff.manage') or public.is_owner())
with check(public.has_permission('staff.manage') or public.is_owner());

drop policy if exists audit_logs_owner_read on public.audit_logs;
create policy audit_logs_authorized_read
on public.audit_logs for select to authenticated
using(public.has_permission('audit.read') or public.is_owner());
