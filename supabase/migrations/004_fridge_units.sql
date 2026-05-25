-- 양문형 냉장고 구조: 일반(냉장+냉동), 김치(냉장+냉동)

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
      'shelf'
    )
  );
