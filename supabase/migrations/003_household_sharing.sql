-- 가족(공유) 그룹: households + members, ingredients/recipes에 household_id 추가

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default '우리 집',
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

alter table public.ingredients
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.recipes
  add column if not exists household_id uuid references public.households(id) on delete cascade;

create index if not exists ingredients_household_id_idx on public.ingredients(household_id);
create index if not exists recipes_household_id_idx on public.recipes(household_id);
create index if not exists household_members_user_id_idx on public.household_members(user_id);

-- 멤버십 확인 (RLS용)
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- 초대 코드 생성
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, (floor(random() * length(chars) + 1))::int, 1);
  end loop;
  return result;
end;
$$;

-- 가족 만들기
create or replace function public.create_household(household_name text default '우리 집')
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  code text;
  trimmed_name text;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  trimmed_name := nullif(trim(household_name), '');
  if trimmed_name is null then
    trimmed_name := '우리 집';
  end if;

  code := public.generate_invite_code();
  while exists (select 1 from public.households where invite_code = code) loop
    code := public.generate_invite_code();
  end loop;

  insert into public.households (name, invite_code, created_by)
  values (trimmed_name, code, auth.uid())
  returning id into new_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return json_build_object(
    'id', new_id,
    'name', trimmed_name,
    'invite_code', code,
    'role', 'owner'
  );
end;
$$;

-- 초대 코드로 참가
create or replace function public.join_household(code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  hname text;
  hcode text;
  normalized_code text;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  normalized_code := upper(trim(code));
  if length(normalized_code) < 6 then
    raise exception '유효하지 않은 초대 코드입니다';
  end if;

  select h.id, h.name, h.invite_code
  into hid, hname, hcode
  from public.households h
  where h.invite_code = normalized_code;

  if hid is null then
    raise exception '초대 코드를 찾을 수 없습니다';
  end if;

  if exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  ) then
    return json_build_object(
      'id', hid,
      'name', hname,
      'invite_code', hcode,
      'role', (
        select role from public.household_members
        where household_id = hid and user_id = auth.uid()
      ),
      'already_member', true
    );
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (hid, auth.uid(), 'member');

  return json_build_object(
    'id', hid,
    'name', hname,
    'invite_code', hcode,
    'role', 'member'
  );
end;
$$;

-- 내 가족 정보 (첫 번째 가입 그룹)
create or replace function public.get_my_household()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', sub.id,
    'name', sub.name,
    'invite_code', sub.invite_code,
    'role', sub.role,
    'member_count', (
      select count(*)::int
      from public.household_members
      where household_id = sub.id
    )
  )
  from (
    select h.id, h.name, h.invite_code, hm.role
    from public.household_members hm
    join public.households h on h.id = hm.household_id
    where hm.user_id = auth.uid()
    order by hm.joined_at asc
    limit 1
  ) sub;
$$;

-- RLS: households
alter table public.households enable row level security;

create policy "Household members can view household"
  on public.households for select
  using (public.is_household_member(id));

-- RLS: household_members
alter table public.household_members enable row level security;

create policy "Household members can view members"
  on public.household_members for select
  using (public.is_household_member(household_id));

-- RLS: ingredients (가족 공유 + 기존 개인 데이터 호환)
drop policy if exists "Users manage own ingredients" on public.ingredients;

create policy "Household members manage ingredients"
  on public.ingredients for all
  using (
  (household_id is not null and public.is_household_member(household_id))
    or (household_id is null and auth.uid() = user_id)
  )
  with check (
    (household_id is not null and public.is_household_member(household_id))
    or (household_id is null and auth.uid() = user_id)
  );

-- RLS: recipes
drop policy if exists "Users manage own recipes" on public.recipes;

create policy "Household members manage recipes"
  on public.recipes for all
  using (
    (
      (household_id is not null and public.is_household_member(household_id))
      or (household_id is null and auth.uid() = user_id)
    )
    and not is_builtin
  )
  with check (
    (
      (household_id is not null and public.is_household_member(household_id))
      or (household_id is null and auth.uid() = user_id)
    )
    and not is_builtin
  );

grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.get_my_household() to authenticated;
