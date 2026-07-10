import { db } from './db'
import seedRecipes from '@/data/seed-recipes.json'
import type { Recipe } from '@/types'

/** 앱 시작 시 기본 레시피를 항상 최신 시드로 덮어씁니다 (내 레시피는 유지) */
export async function seedIfNeeded() {
  const now = new Date().toISOString()
  const recipes: Recipe[] = (seedRecipes as Omit<Recipe, 'createdAt' | 'updatedAt' | 'synced'>[]).map(
    (r) => ({
      ...r,
      isBuiltin: true,
      createdAt: now,
      updatedAt: now,
      synced: true,
    }),
  )

  await db.recipes.bulkPut(recipes)
}
