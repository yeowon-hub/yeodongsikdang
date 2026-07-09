-- 본인 외 관리자 1명만 허용 (최대 2명)

create or replace function public.admin_set_admin(target_user_id uuid, grant_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count int;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다';
  end if;

  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception '사용자를 찾을 수 없습니다';
  end if;

  if target_user_id = auth.uid() and grant_admin = false then
    select count(*) into admin_count from public.profiles where is_admin = true;
    if admin_count <= 1 then
      raise exception '마지막 관리자의 권한은 해제할 수 없습니다';
    end if;
  end if;

  if grant_admin then
    if target_user_id = auth.uid() then
      update public.profiles set is_admin = true where id = target_user_id;
      return;
    end if;

    -- 본인 외 다른 관리자는 1명만: 기존 부관리자 권한 해제 후 부여
    update public.profiles
    set is_admin = false
    where is_admin = true
      and id != auth.uid()
      and id != target_user_id;

    update public.profiles
    set is_admin = true
    where id = target_user_id;
  else
    update public.profiles
    set is_admin = false
    where id = target_user_id;
  end if;
end;
$$;

create or replace function public.get_my_profile()
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    return null;
  end if;

  return (
    select row_to_json(t)
    from (
      select id, email, display_name, is_admin, created_at
      from public.profiles
      where id = auth.uid()
    ) t
  );
end;
$$;

grant execute on function public.get_my_profile() to authenticated;
