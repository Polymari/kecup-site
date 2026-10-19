-- KeCup — 0004_realtime.sql
-- Publish only public-readable tables, so anon subscribers cannot leak
-- private data. The public site subscribes to these inputs and refetches
-- availability (which is a function, not a table).

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
