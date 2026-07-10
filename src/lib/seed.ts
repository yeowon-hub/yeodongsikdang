import { db } from './db'
import seedRecipes from '@/data/seed-recipes.json'
import type { Recipe } from '@/types'

/** 앱 시작 시 기본 레시피를 최신 시드로 덮어씁니다 (사용자가 수정한 기본 레시피·내 레시피는 유지) */
export async function seedIfNeeded() {
  const customizedIds = new Set(
    (await db.recipes.filter((r) => r.isBuiltin && r.builtinCustomized === true).toArray()).map((r) => r.id),
  )

  const now = new Date().toISOString()
  const recipes: Recipe[] = (seedRecipes as Omit<Recipe, 'createdAt' | 'updatedAt' | 'synced'>[])
    .filter((r) => !customizedIds.has(r.id))
    .map((r) => ({
      ...r,
      isBuiltin: true,
      createdAt: now,
      updatedAt: now,
      synced: true,
    }))

  if (recipes.length > 0) {
    await db.recipes.bulkPut(recipes)
  }
}
