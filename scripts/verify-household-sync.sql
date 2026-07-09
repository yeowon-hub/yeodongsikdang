-- 가족 재료 동기화 진단 (Supabase SQL Editor에서 실행)

-- 가족별 재료 수 (household_id 연결 확인)
select h.name, count(i.id) as ingredient_count
from public.households h
left join public.ingredients i on i.household_id = h.id
group by h.id, h.name;

-- 최근 재료 (household_id·등록자 확인)
select i.name, i.household_id, h.name as household_name, u.email
from public.ingredients i
left join public.households h on h.id = i.household_id
left join auth.users u on u.id = i.user_id
order by i.updated_at desc
limit 20;

-- household_id 없는 재료 (0건이어야 정상)
select count(*) as orphan_ingredients
from public.ingredients i
join public.household_members hm on hm.user_id = i.user_id
where i.household_id is null;

-- 가족 구성원
select u.email, h.name, hm.role
from public.household_members hm
join public.households h on h.id = hm.household_id
join auth.users u on u.id = hm.user_id
order by h.name, hm.joined_at;
