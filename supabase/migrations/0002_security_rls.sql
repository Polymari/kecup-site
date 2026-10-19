-- KeCup — 0002_security_rls.sql
-- Row-Level Security + column grants. The publishable key is public;
-- RLS is the real access control.

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
