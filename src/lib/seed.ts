import { db } from './db'
import seedRecipes from '@/data/seed-recipes.json'
import type { Recipe } from '@/types'

const EXPECTED_BUILTIN_COUNT = seedRecipes.length
/** 기본 레시피 데이터가 바뀌면 숫자를 올려 로컬 DB를 다시 채웁니다 */
const BUILTIN_SEED_VERSION = 2
const BUILTIN_SEED_VERSION_KEY = 'yeodongsikdang_builtin_seed_v'

export async function seedIfNeeded() {
  const storedVersion = localStorage.getItem(BUILTIN_SEED_VERSION_KEY)
  const count = await db.recipes.filter((r) => r.isBuiltin).count()
  const needsRefresh =
    storedVersion !== String(BUILTIN_SEED_VERSION) || count < EXPECTED_BUILTIN_COUNT

  if (!needsRefresh) return

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
  localStorage.setItem(BUILTIN_SEED_VERSION_KEY, String(BUILTIN_SEED_VERSION))
}
