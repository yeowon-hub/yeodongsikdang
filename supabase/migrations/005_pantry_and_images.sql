-- 펜트리 보관 위치 + 재료 사진

alter table public.ingredients drop constraint if exists ingredients_location_check;

alter table public.ingredients
  add column if not exists image_url text;

alter table public.ingredients
  add constraint ingredients_location_check
  check (
    location in (
      'general_fridge',
      'general_freezer',
      'kimchi_fridge',
      'kimchi_freezer',
      'shelf',
      'pantry'
    )
  );
