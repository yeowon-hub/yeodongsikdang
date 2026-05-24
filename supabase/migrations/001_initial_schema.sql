-- 여동식당 Supabase 스키마

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default '개',
  location text not null check (location in ('fridge1', 'fridge2', 'freezer', 'shelf')),
  expiry_date date,
  shelf_level integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  steps jsonb not null default '[]',
  ingredients jsonb not null default '[]',
  cooking_time integer,
  servings integer,
  category text,
  image_url text,
  is_builtin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;

create policy "Users manage own ingredients"
  on public.ingredients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own recipes"
  on public.recipes for all
  using (auth.uid() = user_id and not is_builtin)
  with check (auth.uid() = user_id and not is_builtin);

create policy "Anyone can read builtin recipes"
  on public.recipes for select
  using (is_builtin = true);

create index if not exists ingredients_user_id_idx on public.ingredients(user_id);
create index if not exists recipes_user_id_idx on public.recipes(user_id);
