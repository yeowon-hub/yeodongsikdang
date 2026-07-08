-- Enable Supabase Realtime for cross-device sync.
-- Run this in Supabase SQL Editor if realtime updates do not arrive.

alter table public.ingredients replica identity full;
alter table public.recipes replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'ingredients'
    ) then
      alter publication supabase_realtime add table public.ingredients;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'recipes'
    ) then
      alter publication supabase_realtime add table public.recipes;
    end if;
  end if;
end $$;
