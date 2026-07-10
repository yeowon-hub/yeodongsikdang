-- 기본 레시피 수정본을 uuid id로 저장할 때 원본 builtin ID 보존

alter table public.recipes
  add column if not exists builtin_source_id text;

create index if not exists recipes_builtin_source_id_idx
  on public.recipes (household_id, builtin_source_id)
  where builtin_source_id is not null;

NOTIFY pgrst, 'reload schema';
