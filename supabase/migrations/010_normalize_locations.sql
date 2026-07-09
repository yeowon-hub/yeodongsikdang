-- 구버전 location 값을 새 구조로 통일

update public.ingredients set location = 'general_fridge' where location in ('fridge', 'fridge1');
update public.ingredients set location = 'kimchi_fridge' where location = 'fridge2';
update public.ingredients set location = 'general_freezer' where location = 'freezer';
