-- ingredients location CHECK 제약을 새 구조로 업데이트 (업로드 실패 해결)
-- Supabase SQL Editor에서 Run

alter table public.ingredients drop constraint if exists ingredients_location_check;

update public.ingredients set location = 'general_fridge' where location in ('fridge', 'fridge1');
update public.ingredients set location = 'kimchi_fridge' where location = 'fridge2';
update public.ingredients set location = 'general_freezer' where location = 'freezer';

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

alter table public.ingredients
  add column if not exists image_url text;

NOTIFY pgrst, 'reload schema';
