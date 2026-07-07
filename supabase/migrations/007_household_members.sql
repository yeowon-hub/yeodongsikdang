-- 구성원 정보 화면용: 가족 구성원의 표시 이름과 로그인 이메일을 조회합니다.
-- Supabase SQL Editor에서 실행하면 /account/members 화면이 구성원 목록을 표시합니다.

create or replace function public.list_household_members()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with current_household as (
    select hm.household_id
    from public.household_members hm
    where hm.user_id = auth.uid()
    order by hm.joined_at asc
    limit 1
  )
  select coalesce(
    json_agg(
      json_build_object(
        'id', hm.user_id,
        'name', coalesce(
          nullif(u.raw_user_meta_data ->> 'nickname', ''),
          nullif(u.raw_user_meta_data ->> 'name', ''),
          nullif(u.raw_user_meta_data ->> 'full_name', ''),
          nullif(u.raw_user_meta_data ->> 'preferred_username', ''),
          nullif(split_part(u.email, '@', 1), ''),
          '구성원'
        ),
        'email', coalesce(u.email, ''),
        'role', hm.role,
        'joined_at', hm.joined_at
      )
      order by hm.joined_at asc
    ),
    '[]'::json
  )
  from public.household_members hm
  join current_household ch on ch.household_id = hm.household_id
  join auth.users u on u.id = hm.user_id
  where public.is_household_member(hm.household_id);
$$;

grant execute on function public.list_household_members() to authenticated;

NOTIFY pgrst, 'reload schema';
