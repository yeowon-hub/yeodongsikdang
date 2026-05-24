import { db } from './db'
import seedRecipes from '@/data/seed-recipes.json'
import type { Recipe } from '@/types'

const SEED_KEY = 'yeodongsikdang_seeded'

export async function seedIfNeeded() {
  const alreadySeeded = localStorage.getItem(SEED_KEY)
  const count = await db.recipes.filter((r) => r.isBuiltin).count()

  if (alreadySeeded && count > 0) return

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
  localStorage.setItem(SEED_KEY, 'true')
}
