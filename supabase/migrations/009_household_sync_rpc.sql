-- 가족 재료·레시피를 RLS 우회 없이 안전하게 조회 (멤버만)

create or replace function public.get_household_ingredients()
returns setof public.ingredients
language sql
stable
security definer
set search_path = public
as $$
  select i.*
  from public.ingredients i
  where i.household_id in (
    select hm.household_id
    from public.household_members hm
    where hm.user_id = auth.uid()
  )
  order by i.updated_at desc;
$$;

create or replace function public.get_household_recipes()
returns setof public.recipes
language sql
stable
security definer
set search_path = public
as $$
  select r.*
  from public.recipes r
  where not r.is_builtin
    and r.household_id in (
      select hm.household_id
      from public.household_members hm
      where hm.user_id = auth.uid()
    )
  order by r.updated_at desc;
$$;

grant execute on function public.get_household_ingredients() to authenticated;
grant execute on function public.get_household_recipes() to authenticated;

NOTIFY pgrst, 'reload schema';
