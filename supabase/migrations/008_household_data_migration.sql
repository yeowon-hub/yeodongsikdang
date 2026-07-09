-- 가족 가입 후 household_id 없이 저장된 재료·레시피를 공유 그룹으로 옮김

create or replace function public.migrate_my_data_to_household()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  select hm.household_id
  into hid
  from public.household_members hm
  where hm.user_id = auth.uid()
  order by hm.joined_at asc
  limit 1;

  if hid is null then
    return;
  end if;

  update public.ingredients
  set household_id = hid
  where user_id = auth.uid()
    and household_id is null;

  update public.recipes
  set household_id = hid
  where user_id = auth.uid()
    and household_id is null
    and not is_builtin;
end;
$$;

grant execute on function public.migrate_my_data_to_household() to authenticated;

-- 기존에 household_id 없이 저장된 모든 가족 재료·레시피 일괄 연결
update public.ingredients i
set household_id = hm.household_id
from public.household_members hm
where i.user_id = hm.user_id
  and i.household_id is null;

update public.recipes r
set household_id = hm.household_id
from public.household_members hm
where r.user_id = hm.user_id
  and r.household_id is null
  and not r.is_builtin;
