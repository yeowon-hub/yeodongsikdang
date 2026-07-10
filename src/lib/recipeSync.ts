import { v5 as uuidv5 } from 'uuid'
import type { Recipe } from '@/types'
import { normalizeRecipeIngredients, normalizeRecipeSteps } from '@/lib/recipeIngredients'

/** 가족별 기본 레시피 오버라이드 UUID 생성용 네임스페이스 */
const BUILTIN_OVERRIDE_NAMESPACE = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

/** 시드에 포함된 기본 레시피 ID (예: builtin-001) */
export function isBuiltinRecipeId(id: string): boolean {
  return id.startsWith('builtin-')
}

/** 서버에 올릴 수 있는 레시피인지 (내 레시피 또는 가족이 수정한 기본 레시피) */
export function canSyncRecipeToServer(recipe: Recipe): boolean {
  if (!recipe.isBuiltin) return true
  return recipe.builtinCustomized === true
}

export function isBuiltinOverrideRecipe(recipe: Recipe): boolean {
  return recipe.isBuiltin && recipe.builtinCustomized === true && isBuiltinRecipeId(recipe.id)
}

/** Supabase uuid 컬럼용 안정적인 서버 ID (가족·기본레시피 조합마다 동일) */
export function serverIdForBuiltinOverride(builtinId: string, householdId: string): string {
  return uuidv5(`${householdId}:${builtinId}`, BUILTIN_OVERRIDE_NAMESPACE)
}

export function recipeToServerRow(item: Recipe, userId: string, householdId: string | null) {
  const builtinOverride = isBuiltinOverrideRecipe(item) && householdId
  return {
    id: builtinOverride ? serverIdForBuiltinOverride(item.id, householdId) : item.id,
    user_id: userId,
    household_id: householdId,
    title: item.title,
    description: item.description || null,
    steps: item.steps,
    ingredients: item.ingredients,
    cooking_time: item.cookingTime ?? null,
    servings: item.servings ?? null,
    category: item.category || null,
    image_url: item.imageUrl || null,
    source_url: item.sourceUrl || null,
    builtin_source_id: builtinOverride ? item.id : null,
    is_builtin: false,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }
}

/** 서버 행을 로컬 IndexedDB 레시피로 변환 */
export function recipeFromRemoteRow(
  row: Record<string, unknown>,
  householdId?: string | null,
): Recipe {
  const builtinSourceId = (row.builtin_source_id as string) || undefined
  const isBuiltinOverride = Boolean(builtinSourceId && isBuiltinRecipeId(builtinSourceId))

  return {
    id: isBuiltinOverride ? builtinSourceId! : (row.id as string),
    userId: (row.user_id as string) || undefined,
    householdId: ((row.household_id as string) || householdId) ?? undefined,
    title: row.title as string,
    description: (row.description as string) || undefined,
    steps: normalizeRecipeSteps(row.steps),
    ingredients: normalizeRecipeIngredients(row.ingredients),
    cookingTime: (row.cooking_time as number) || undefined,
    servings: (row.servings as number) || undefined,
    category: (row.category as string) || undefined,
    imageUrl: (row.image_url as string) || undefined,
    sourceUrl: (row.source_url as string) || undefined,
    isBuiltin: isBuiltinOverride,
    builtinCustomized: isBuiltinOverride,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    synced: true,
  }
}

/** 원격 레시피 목록에서 로컬 매칭용 ID 집합 (기본 레시피 오버라이드 포함) */
export function remoteRecipeIdSet(rows: Record<string, unknown>[]): Set<string> {
  const ids = new Set<string>()
  for (const row of rows) {
    ids.add(row.id as string)
    const source = row.builtin_source_id as string | undefined
    if (source) ids.add(source)
  }
  return ids
}
