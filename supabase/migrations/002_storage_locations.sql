-- location 값 확장 (fridge1, fridge2, freezer, shelf)

alter table public.ingredients drop constraint if exists ingredients_location_check;

alter table public.ingredients
  add constraint ingredients_location_check
  check (location in ('fridge1', 'fridge2', 'freezer', 'shelf', 'fridge'));

-- 기존 fridge 데이터 마이그레이션
update public.ingredients set location = 'fridge1' where location = 'fridge';

alter table public.ingredients drop constraint if exists ingredients_location_check;

alter table public.ingredients
  add constraint ingredients_location_check
  check (location in ('fridge1', 'fridge2', 'freezer', 'shelf'));
