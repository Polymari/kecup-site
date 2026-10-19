-- KeCup — setup-all.sql
-- GENERATED convenience file: concatenates migrations 0001 → 0004 in order
-- for a single paste into the Supabase SQL Editor. If you edit the individual
-- migrations, re-paste those instead (or keep this file in sync).
-- Run: paste everything below into the SQL Editor and press Ctrl+Enter.

-- ============================================================================
-- KeCup — 0001_schema.sql
-- Brand-level reference data + per-outlet operational tables.
-- ============================================================================

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

-- ============================================================================
-- KeCup — 0002_security_rls.sql
-- Row-Level Security + column grants. The publishable key is public;
-- RLS is the real access control.
-- ============================================================================

create or replace function is_outlet_member(p_outlet uuid)
returns boolean language sql security definer set search_path = '' as $$
  select exists (
    select 1 from public.outlet_members m
    where m.outlet_id = p_outlet and m.user_id = auth.uid()
  );
$$;

grant execute on function is_outlet_member(uuid) to authenticated;

alter table outlets         enable row level security;
alter table outlet_members  enable row level security;
alter table menu_items      enable row level security;
alter table stock_items     enable row level security;
alter table recipe_lines    enable row level security;
alter table outlet_stock    enable row level security;
alter table sales           enable row level security;
alter table sale_items      enable row level security;
alter table stock_movements enable row level security;
alter table menu_overrides  enable row level security;

-- Public read: brand data + outlets (the public site works anonymously)
drop policy if exists pub_read_menu   on menu_items;
drop policy if exists pub_read_stocki on stock_items;
drop policy if exists pub_read_recipe on recipe_lines;
drop policy if exists pub_read_outlet on outlets;
create policy pub_read_menu   on menu_items   for select using (true);
create policy pub_read_stocki on stock_items  for select using (true);
create policy pub_read_recipe on recipe_lines for select using (true);
create policy pub_read_outlet on outlets      for select using (true);

-- Overrides: public read (drives sold-out badges), member write only
drop policy if exists pub_read_ovr  on menu_overrides;
drop policy if exists mem_write_ovr on menu_overrides;
create policy pub_read_ovr on menu_overrides for select using (true);
create policy mem_write_ovr on menu_overrides for all
  using (is_outlet_member(outlet_id)) with check (is_outlet_member(outlet_id));

-- Member-scoped read on operational tables
drop policy if exists mem_read_members on outlet_members;
drop policy if exists mem_read_stock   on outlet_stock;
drop policy if exists mem_read_sales   on sales;
drop policy if exists mem_read_salei   on sale_items;
drop policy if exists mem_read_moves   on stock_movements;
create policy mem_read_members on outlet_members for select using (is_outlet_member(outlet_id));
create policy mem_read_stock   on outlet_stock   for select using (is_outlet_member(outlet_id));
create policy mem_read_sales   on sales          for select using (is_outlet_member(outlet_id));
create policy mem_read_salei   on sale_items     for select
  using (exists (select 1 from sales s where s.id = sale_items.sale_id and is_outlet_member(s.outlet_id)));
create policy mem_read_moves   on stock_movements for select using (is_outlet_member(outlet_id));

-- Outlet profile: members may update only their own row
drop policy if exists mem_update_outlet on outlets;
create policy mem_update_outlet on outlets for update
  using (is_outlet_member(id)) with check (is_outlet_member(id));

-- outlet_stock: members may edit ONLY low_threshold + unit_cost directly.
-- All qty changes happen through the SECURITY DEFINER RPCs in 0003.
revoke all on outlet_stock from authenticated, anon;
grant select on outlet_stock to authenticated;
grant update (low_threshold, unit_cost) on outlet_stock to authenticated;

-- ============================================================================
-- KeCup — 0003_functions.sql
-- SECURITY DEFINER RPCs. Every mutation verifies outlet membership and
-- raises NOT_AUTHORIZED otherwise. The client is never trusted for
-- prices or stock math.
-- ============================================================================

-- expand_requirements: pure helper. Input: [{menu_item_id, drink_choice?, qty}].
-- Combo expansion = non-packaging lines of the component snack + non-packaging
-- lines of the chosen drink + the combo's own packaging lines (pack-stack).
create or replace function expand_requirements(p_items jsonb)
returns table(stock_item_id text, qty numeric)
language sql stable set search_path = '' as $$
  with input as (
    select
      (it->>'menu_item_id')::text as menu_item_id,
      coalesce((it->>'drink_choice')::text, mi.drink_key) as drink_choice,
      coalesce((it->>'qty')::numeric, 1) as qty
    from jsonb_array_elements(p_items) it
    join public.menu_items mi on mi.id = (it->>'menu_item_id')::text
  ),
  direct_lines as (
    select rl.stock_item_id, rl.qty * i.qty as qty
    from input i
    join public.menu_items mi on mi.id = i.menu_item_id
    join public.recipe_lines rl on rl.menu_item_id = i.menu_item_id
    where mi.kind <> 'combo'
  ),
  combo_component_lines as (
    select rl.stock_item_id, rl.qty * i.qty as qty
    from input i
    join public.menu_items combo on combo.id = i.menu_item_id and combo.kind = 'combo'
    join public.menu_items snack on snack.kind = 'snack' and snack.flavor_key = combo.flavor_key
    join public.recipe_lines rl on rl.menu_item_id = snack.id
    join public.stock_items si on si.id = rl.stock_item_id and si.category <> 'packaging'
  ),
  combo_drink_lines as (
    select rl.stock_item_id, rl.qty * i.qty as qty
    from input i
    join public.menu_items combo on combo.id = i.menu_item_id and combo.kind = 'combo'
    join public.menu_items drink on drink.id = i.drink_choice and drink.kind = 'drink'
    join public.recipe_lines rl on rl.menu_item_id = drink.id
    join public.stock_items si on si.id = rl.stock_item_id and si.category <> 'packaging'
  ),
  combo_packaging_lines as (
    select rl.stock_item_id, rl.qty * i.qty as qty
    from input i
    join public.menu_items mi on mi.id = i.menu_item_id and mi.kind = 'combo'
    join public.recipe_lines rl on rl.menu_item_id = i.menu_item_id
  )
  select u.stock_item_id, sum(u.qty)::numeric
  from (
    select * from direct_lines
    union all
    select * from combo_component_lines
    union all
    select * from combo_drink_lines
    union all
    select * from combo_packaging_lines
  ) u
  group by u.stock_item_id;
$$;

revoke all on function expand_requirements(jsonb) from public, anon;
grant execute on function expand_requirements(jsonb) to authenticated;

-- record_sale: one atomic POS transaction.
create or replace function record_sale(
  p_outlet uuid,
  p_payment text,
  p_cash integer,
  p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_sale_id uuid;
  v_total integer := 0;
  v_cogs numeric := 0;
  v_line_cogs numeric;
  v_change integer := 0;
  v_low text[];
  v_item record;
  v_req record;
begin
  if v_user is null or not exists (
    select 1 from public.outlet_members m
    where m.outlet_id = p_outlet and m.user_id = v_user
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_payment not in ('cash', 'qris') then
    raise exception 'INVALID_PAYMENT';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) it
    left join public.menu_items mi on mi.id = (it->>'menu_item_id')::text
    where mi.id is null or not mi.active
  ) then
    raise exception 'UNKNOWN_ITEM';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) it
    join public.menu_overrides mo
      on mo.outlet_id = p_outlet
     and mo.menu_item_id = (it->>'menu_item_id')::text
     and mo.sold_out
  ) then
    raise exception 'SOLD_OUT';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) it
    join public.menu_items combo on combo.id = (it->>'menu_item_id')::text and combo.kind = 'combo'
    left join public.menu_items drink
      on drink.id = coalesce((it->>'drink_choice')::text, combo.drink_key)
     and drink.kind = 'drink'
    where drink.id is null
  ) then
    raise exception 'UNKNOWN_DRINK_CHOICE';
  end if;

  -- Lock this outlet's stock rows to prevent concurrent oversell.
  perform 1 from public.outlet_stock os where os.outlet_id = p_outlet for update;

  if exists (
    with req as (
      select * from public.expand_requirements(p_items)
    )
    select 1 from req
    left join public.outlet_stock os
      on os.outlet_id = p_outlet and os.stock_item_id = req.stock_item_id
    where os.qty is null or os.qty < req.qty
  ) then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  -- Prices and COGS are computed server-side only.
  for v_item in
    select
      (it->>'menu_item_id')::text as menu_item_id,
      (it->>'drink_choice')::text as drink_choice,
      greatest(coalesce((it->>'qty')::integer, 1), 1) as qty
    from jsonb_array_elements(p_items) it
  loop
    select coalesce(sum(r.qty * os.unit_cost), 0) into v_line_cogs
    from public.expand_requirements(jsonb_build_array(jsonb_build_object(
      'menu_item_id', v_item.menu_item_id,
      'drink_choice', v_item.drink_choice,
      'qty', v_item.qty
    ))) r
    join public.outlet_stock os
      on os.outlet_id = p_outlet and os.stock_item_id = r.stock_item_id;

    v_cogs := v_cogs + v_line_cogs;

    select v_total + mi.price * v_item.qty into v_total
    from public.menu_items mi where mi.id = v_item.menu_item_id;
  end loop;

  if p_payment = 'cash' then
    if coalesce(p_cash, 0) < v_total then
      raise exception 'INSUFFICIENT_CASH';
    end if;
    v_change := coalesce(p_cash, 0) - v_total;
  end if;

  insert into public.sales (outlet_id, cashier_id, payment_method, total, cogs, cash_received, change_due)
  values (p_outlet, v_user, p_payment, v_total, v_cogs,
          case when p_payment = 'cash' then p_cash end,
          case when p_payment = 'cash' then v_change end)
  returning id into v_sale_id;

  for v_item in
    select
      (it->>'menu_item_id')::text as menu_item_id,
      (it->>'drink_choice')::text as drink_choice,
      greatest(coalesce((it->>'qty')::integer, 1), 1) as qty
    from jsonb_array_elements(p_items) it
  loop
    select coalesce(sum(r.qty * os.unit_cost), 0) into v_line_cogs
    from public.expand_requirements(jsonb_build_array(jsonb_build_object(
      'menu_item_id', v_item.menu_item_id,
      'drink_choice', v_item.drink_choice,
      'qty', v_item.qty
    ))) r
    join public.outlet_stock os
      on os.outlet_id = p_outlet and os.stock_item_id = r.stock_item_id;

    insert into public.sale_items (sale_id, menu_item_id, drink_choice, qty, unit_price, line_cogs)
    select v_sale_id, v_item.menu_item_id, v_item.drink_choice, v_item.qty, mi.price, v_line_cogs
    from public.menu_items mi where mi.id = v_item.menu_item_id;
  end loop;

  for v_req in
    select * from public.expand_requirements(p_items)
  loop
    insert into public.stock_movements (outlet_id, stock_item_id, kind, delta, ref_sale_id)
    values (p_outlet, v_req.stock_item_id, 'sale', -v_req.qty, v_sale_id);

    update public.outlet_stock os
    set qty = os.qty - v_req.qty
    where os.outlet_id = p_outlet and os.stock_item_id = v_req.stock_item_id;
  end loop;

  select array_agg(os.stock_item_id) into v_low
  from public.outlet_stock os
  where os.outlet_id = p_outlet and os.qty < os.low_threshold;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'total', v_total,
    'cogs', v_cogs,
    'change_due', v_change,
    'low_stock', coalesce(to_jsonb(v_low), '[]'::jsonb)
  );
end;
$$;

revoke all on function record_sale(uuid, text, integer, jsonb) from public, anon;
grant execute on function record_sale(uuid, text, integer, jsonb) to authenticated;

-- void_sale: reverses stock via compensating movements. Voided sales are
-- excluded from analytics in the app layer (sales.voided).
create or replace function void_sale(p_sale uuid, p_reason text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_outlet uuid;
  v_move record;
begin
  select outlet_id into v_outlet from public.sales where id = p_sale;
  if v_outlet is null then
    raise exception 'UNKNOWN_SALE';
  end if;

  if v_user is null or not exists (
    select 1 from public.outlet_members m
    where m.outlet_id = v_outlet and m.user_id = v_user
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if exists (select 1 from public.sales s where s.id = p_sale and s.voided) then
    raise exception 'ALREADY_VOIDED';
  end if;

  for v_move in
    select * from public.stock_movements
    where ref_sale_id = p_sale and kind = 'sale'
  loop
    insert into public.stock_movements (outlet_id, stock_item_id, kind, delta, ref_sale_id, note)
    values (v_move.outlet_id, v_move.stock_item_id, 'void', -v_move.delta, p_sale, p_reason);

    update public.outlet_stock os
    set qty = os.qty - v_move.delta
    where os.outlet_id = v_move.outlet_id and os.stock_item_id = v_move.stock_item_id;
  end loop;

  update public.sales
  set voided = true, voided_at = now(), voided_by = v_user, void_reason = p_reason
  where id = p_sale;
end;
$$;

revoke all on function void_sale(uuid, text) from public, anon;
grant execute on function void_sale(uuid, text) to authenticated;

-- restock_stock: weighted-average cost update when a unit cost is provided.
create or replace function restock_stock(
  p_outlet uuid,
  p_item text,
  p_qty numeric,
  p_unit_cost numeric default null,
  p_note text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_on_hand numeric;
  v_cost numeric;
begin
  if v_user is null or not exists (
    select 1 from public.outlet_members m
    where m.outlet_id = p_outlet and m.user_id = v_user
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_qty is null or p_qty <= 0 then
    raise exception 'INVALID_QTY';
  end if;

  select qty, unit_cost into v_on_hand, v_cost
  from public.outlet_stock
  where outlet_id = p_outlet and stock_item_id = p_item
  for update;

  if not found then
    raise exception 'UNKNOWN_STOCK_ITEM';
  end if;

  update public.outlet_stock os
  set qty = os.qty + p_qty,
      unit_cost = case
        when p_unit_cost is null then os.unit_cost
        when os.qty > 0 then (os.qty * os.unit_cost + p_qty * p_unit_cost) / (os.qty + p_qty)
        else p_unit_cost
      end
  where os.outlet_id = p_outlet and os.stock_item_id = p_item;

  insert into public.stock_movements (outlet_id, stock_item_id, kind, delta, note)
  values (p_outlet, p_item, 'restock', p_qty, p_note);
end;
$$;

revoke all on function restock_stock(uuid, text, numeric, numeric, text) from public, anon;
grant execute on function restock_stock(uuid, text, numeric, numeric, text) to authenticated;

-- adjust_stock: delta-based (manual recount = positive/negative, waste must be negative).
create or replace function adjust_stock(
  p_outlet uuid,
  p_item text,
  p_delta numeric,
  p_kind text,
  p_note text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_on_hand numeric;
begin
  if v_user is null or not exists (
    select 1 from public.outlet_members m
    where m.outlet_id = p_outlet and m.user_id = v_user
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_kind not in ('adjustment', 'waste') then
    raise exception 'INVALID_KIND';
  end if;

  if p_kind = 'waste' and (p_delta is null or p_delta >= 0) then
    raise exception 'WASTE_MUST_BE_NEGATIVE';
  end if;

  if p_delta is null or p_delta = 0 then
    raise exception 'INVALID_QTY';
  end if;

  select qty into v_on_hand
  from public.outlet_stock
  where outlet_id = p_outlet and stock_item_id = p_item
  for update;

  if not found then
    raise exception 'UNKNOWN_STOCK_ITEM';
  end if;

  if v_on_hand + p_delta < 0 then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  update public.outlet_stock os
  set qty = os.qty + p_delta
  where os.outlet_id = p_outlet and os.stock_item_id = p_item;

  insert into public.stock_movements (outlet_id, stock_item_id, kind, delta, note)
  values (p_outlet, p_item, p_kind, p_delta, p_note);
end;
$$;

revoke all on function adjust_stock(uuid, text, numeric, text, text) from public, anon;
grant execute on function adjust_stock(uuid, text, numeric, text, text) to authenticated;

-- get_outlet_stock_flags: PUBLIC read model. A boolean per stock item
-- (qty >= the largest single-unit requirement) — raw quantities never leave.
create or replace function get_outlet_stock_flags(p_slug text)
returns table(stock_item_id text, in_stock boolean)
language sql stable security definer set search_path = '' as $$
  with max_req as (
    select rl.stock_item_id, max(rl.qty) as max_qty
    from public.recipe_lines rl
    group by rl.stock_item_id
  )
  select m.stock_item_id::text,
         (coalesce(os.qty, 0) >= coalesce(m.max_qty, 0)) as in_stock
  from max_req m
  left join public.outlet_stock os
    on os.stock_item_id = m.stock_item_id
   and os.outlet_id = (select o.id from public.outlets o where o.slug = p_slug);
$$;

revoke all on function get_outlet_stock_flags(text) from public;
grant execute on function get_outlet_stock_flags(text) to anon, authenticated;

-- ============================================================================
-- KeCup — 0004_realtime.sql
-- Publish only public-readable tables, so anon subscribers cannot leak
-- private data. The public site subscribes to these inputs and refetches
-- availability (which is a function, not a table).
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'outlets'
  ) then
    alter publication supabase_realtime add table outlets;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_overrides'
  ) then
    alter publication supabase_realtime add table menu_overrides;
  end if;
end $$;
