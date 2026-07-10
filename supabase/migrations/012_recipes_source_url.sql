-- 레시피 참고 링크·사진 컬럼 (동기화 오류: source_url column not found)

alter table public.recipes
  add column if not exists source_url text;

alter table public.recipes
  add column if not exists image_url text;

NOTIFY pgrst, 'reload schema';
