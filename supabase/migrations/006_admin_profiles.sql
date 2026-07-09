-- 앱 관리자(profiles.is_admin) 및 계정 관리 RPC

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, display_name, created_at)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(new.created_at, now())
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, email, display_name, created_at)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'nickname',
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    split_part(coalesce(u.email, ''), '@', 1)
  ),
  u.created_at
from auth.users u
on conflict (id) do nothing;

-- 최초 가입자를 관리자로 지정 (이미 관리자가 없을 때만)
update public.profiles
set is_admin = true
where id = (
  select u.id
  from auth.users u
  order by u.created_at asc
  limit 1
)
and not exists (select 1 from public.profiles where is_admin = true);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  using (public.is_admin());

create or replace function public.admin_list_users()
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다';
  end if;

  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  into result
  from (
    select
      p.id,
      p.email,
      p.display_name,
      p.is_admin,
      p.created_at,
      u.last_sign_in_at,
      (
        select h.name
        from public.household_members hm
        join public.households h on h.id = hm.household_id
        where hm.user_id = p.id
        order by hm.joined_at asc
        limit 1
      ) as household_name
    from public.profiles p
    join auth.users u on u.id = p.id
  ) t;

  return result;
end;
$$;

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

  update public.profiles
  set is_admin = grant_admin
  where id = target_user_id;
end;
$$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  admin_count int;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다';
  end if;

  if target_user_id = auth.uid() then
    raise exception '본인 계정은 삭제할 수 없습니다';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception '사용자를 찾을 수 없습니다';
  end if;

  if exists (select 1 from public.profiles where id = target_user_id and is_admin) then
    select count(*) into admin_count from public.profiles where is_admin = true;
    if admin_count <= 1 then
      raise exception '마지막 관리자는 삭제할 수 없습니다';
    end if;
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
