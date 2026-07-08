import { db } from './db'
import seedRecipes from '@/data/seed-recipes.json'
import type { Recipe } from '@/types'

const SEED_KEY = 'yeodongsikdang_seeded'

export async function seedIfNeeded() {
  const alreadySeeded = localStorage.getItem(SEED_KEY)
  const builtinRecipes = await db.recipes.filter((r) => r.isBuiltin).toArray()
  const existingIds = new Set(builtinRecipes.map((r) => r.id))
  const missingSeedRecipes = seedRecipes.filter((r) => !existingIds.has(r.id))

  const now = new Date().toISOString()
  const sourceRecipes = alreadySeeded && builtinRecipes.length > 0 ? missingSeedRecipes : seedRecipes

  if (sourceRecipes.length === 0) return

  const recipes: Recipe[] = (sourceRecipes as Omit<Recipe, 'createdAt' | 'updatedAt' | 'synced'>[]).map(
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
