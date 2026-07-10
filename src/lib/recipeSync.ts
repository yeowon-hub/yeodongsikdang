import type { Recipe } from '@/types'

/** 시드에 포함된 기본 레시피 ID (예: builtin-001) */
export function isBuiltinRecipeId(id: string): boolean {
  return id.startsWith('builtin-')
}

/** 서버에 올릴 수 있는 레시피인지 (내 레시피 또는 가족이 수정한 기본 레시피) */
export function canSyncRecipeToServer(recipe: Recipe): boolean {
  if (!recipe.isBuiltin) return true
  return recipe.builtinCustomized === true
}

/** 서버에서 받은 가족 기본 레시피 오버라이드를 로컬 기본 레시피로 변환 */
export function recipeFromRemoteRow(item: Recipe, householdId?: string | null): Recipe {
  const isBuiltinOverride = isBuiltinRecipeId(item.id) && !item.isBuiltin
  if (!isBuiltinOverride) {
    return {
      ...item,
      householdId: item.householdId ?? householdId ?? undefined,
      synced: true,
    }
  }
  return {
    ...item,
    isBuiltin: true,
    builtinCustomized: true,
    householdId: item.householdId ?? householdId ?? undefined,
    synced: true,
  }
}
