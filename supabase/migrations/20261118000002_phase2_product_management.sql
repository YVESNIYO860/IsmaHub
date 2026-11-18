insert into public.permissions (code, description) values
  ('product.read', 'View products'),
  ('product.manage', 'Create, update, and deactivate products'),
  ('category.manage', 'Manage product categories and subcategories'),
  ('brand.manage', 'Manage product brands'),
  ('product_image.manage', 'Manage product images')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('owner', 'administrator', 'manager')
  and p.code in (
    'product.read',
    'product.manage',
    'category.manage',
    'brand.manage',
    'product_image.manage'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('product.read', 'product.manage')
where r.name = 'inventory_manager'
on conflict do nothing;

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.product_categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories(id) on delete restrict,
  brand_id uuid references public.product_brands(id) on delete restrict,
  name text not null,
  slug text not null unique,
  sku text not null unique,
  supplier_code text,
  short_description text,
  description text,
  cost_price numeric(14,2),
  sale_price numeric(14,2) not null check (sale_price >= 0),
  compare_at_price numeric(14,2) check (compare_at_price is null or compare_at_price >= 0),
  currency char(3) not null default 'RWF' check (currency = 'RWF'),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_tag_links (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.product_tags(id) on delete cascade,
  primary key (product_id, tag_id)
);

create table public.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, name)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index product_primary_image_one
on public.product_images(product_id)
where is_primary;

create sequence public.product_sku_sequence start with 1;

create or replace function public.generate_product_sku()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.product_sku_sequence');
  loop
    exit when not exists (
      select 1
      from public.products
      where sku = 'SKU-' || lpad(next_number::text, 6, '0')
    );
    next_number := nextval('public.product_sku_sequence');
  end loop;
  return 'SKU-' || lpad(next_number::text, 6, '0');
end;
$$;

revoke execute on function public.generate_product_sku() from public, anon;
grant execute on function public.generate_product_sku() to authenticated;

create index product_categories_parent_idx on public.product_categories(parent_id);
create index product_categories_active_idx on public.product_categories(is_active);
create index products_category_idx on public.products(category_id);
create index products_brand_idx on public.products(brand_id);
create index products_status_idx on public.products(status);
create index products_featured_idx on public.products(is_featured);
create index product_specifications_product_idx on public.product_specifications(product_id);
create index product_images_product_idx on public.product_images(product_id);

create trigger product_categories_updated_at
before update on public.product_categories
for each row execute function public.handle_updated_at();

create trigger product_brands_updated_at
before update on public.product_brands
for each row execute function public.handle_updated_at();

create trigger products_updated_at
before update on public.products
for each row execute function public.handle_updated_at();

alter table public.product_categories enable row level security;
alter table public.product_brands enable row level security;
alter table public.product_tags enable row level security;
alter table public.products enable row level security;
alter table public.product_tag_links enable row level security;
alter table public.product_specifications enable row level security;
alter table public.product_images enable row level security;

create policy product_categories_public_read
on public.product_categories for select
to anon, authenticated
using (is_active);

create policy product_categories_manage
on public.product_categories for all
to authenticated
using (public.has_permission('category.manage'))
with check (public.has_permission('category.manage'));

create policy product_brands_public_read
on public.product_brands for select
to anon, authenticated
using (is_active);

create policy product_brands_manage
on public.product_brands for all
to authenticated
using (public.has_permission('brand.manage'))
with check (public.has_permission('brand.manage'));

create policy products_public_read
on public.products for select
to anon, authenticated
using (status = 'active');

create policy products_manage
on public.products for all
to authenticated
using (public.has_permission('product.manage'))
with check (public.has_permission('product.manage'));

create policy product_tags_manage
on public.product_tags for all
to authenticated
using (public.has_permission('product.manage'))
with check (public.has_permission('product.manage'));

create policy product_tag_links_manage
on public.product_tag_links for all
to authenticated
using (public.has_permission('product.manage'))
with check (public.has_permission('product.manage'));

create policy product_specifications_public_read
on public.product_specifications for select
to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_id and p.status = 'active'
));

create policy product_specifications_manage
on public.product_specifications for all
to authenticated
using (public.has_permission('product.manage'))
with check (public.has_permission('product.manage'));

create policy product_images_public_read
on public.product_images for select
to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_id and p.status = 'active'
));

create policy product_images_manage
on public.product_images for all
to authenticated
using (public.has_permission('product_image.manage'))
with check (public.has_permission('product_image.manage'));
