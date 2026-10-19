-- KeCup — 0001_schema.sql
-- Brand-level reference data + per-outlet operational tables.

create table if not exists menu_items (
  id            text primary key,
  kind          text not null check (kind in ('snack','drink','combo')),
  name          text not null,
  price         integer not null,
  compare_price integer,
  flavor_key    text,
  drink_key     text,
  photo_key     text,
  sort_order    integer not null default 0,
  active        boolean not null default true
);

create table if not exists stock_items (
  id        text primary key,
  name      text not null,
  category  text not null check (category in ('food','drink','packaging')),
  unit      text not null default 'portion'
);

create table if not exists recipe_lines (
  menu_item_id  text not null references menu_items(id) on delete cascade,
  stock_item_id text not null references stock_items(id) on delete restrict,
  qty           numeric not null check (qty > 0),
  primary key (menu_item_id, stock_item_id)
);

create table if not exists outlets (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  name               text not null,
  area               text,
  address            text,
  maps_query         text,
  whatsapp           text,
  instagram          text,
  hours              jsonb not null,
  line_order         integer not null default 0,
  is_flagship        boolean not null default false,
  temporarily_closed boolean not null default false,
  created_at         timestamptz not null default now()
);

create table if not exists outlet_members (
  outlet_id uuid not null references outlets(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'staff' check (role in ('owner','staff')),
  primary key (outlet_id, user_id)
);

create table if not exists outlet_stock (
  outlet_id     uuid not null references outlets(id) on delete cascade,
  stock_item_id text not null references stock_items(id) on delete restrict,
  qty           numeric not null default 0,
  low_threshold numeric not null default 0,
  unit_cost     numeric not null default 0,
  primary key (outlet_id, stock_item_id)
);

create table if not exists sales (
  id             uuid primary key default gen_random_uuid(),
  outlet_id      uuid not null references outlets(id) on delete cascade,
  cashier_id     uuid references auth.users(id),
  payment_method text not null check (payment_method in ('cash','qris')),
  total          integer not null default 0,
  cogs           numeric not null default 0,
  cash_received  integer,
  change_due     integer,
  order_code     text,
  voided         boolean not null default false,
  voided_at      timestamptz,
  voided_by      uuid references auth.users(id),
  void_reason    text,
  created_at     timestamptz not null default now()
);

create table if not exists sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references sales(id) on delete cascade,
  menu_item_id text not null references menu_items(id),
  drink_choice text,
  qty          integer not null check (qty > 0),
  unit_price   integer not null,
  line_cogs    numeric not null default 0
);

create table if not exists stock_movements (
  id            uuid primary key default gen_random_uuid(),
  outlet_id     uuid not null references outlets(id) on delete cascade,
  stock_item_id text not null references stock_items(id),
  kind          text not null check (kind in ('sale','restock','adjustment','waste','void','seed')),
  delta         numeric not null,
  ref_sale_id   uuid references sales(id),
  note          text,
  created_at    timestamptz not null default now()
);

create table if not exists menu_overrides (
  outlet_id    uuid not null references outlets(id) on delete cascade,
  menu_item_id text not null references menu_items(id) on delete cascade,
  sold_out     boolean not null default false,
  updated_at   timestamptz not null default now(),
  primary key (outlet_id, menu_item_id)
);

create index if not exists sales_outlet_created_idx on sales (outlet_id, created_at);
create index if not exists sale_items_sale_idx on sale_items (sale_id);
create index if not exists stock_movements_outlet_created_idx on stock_movements (outlet_id, created_at);
create index if not exists outlet_stock_outlet_idx on outlet_stock (outlet_id);
