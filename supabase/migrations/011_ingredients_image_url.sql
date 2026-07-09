-- ingredients 테이블에 image_url 컬럼 추가 (업로드 실패 해결)
-- Supabase SQL Editor에서 Run

alter table public.ingredients
  add column if not exists image_url text;

NOTIFY pgrst, 'reload schema';
