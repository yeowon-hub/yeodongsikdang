import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db, enqueueSync } from '@/lib/db'
import type { Recipe } from '@/types'

export function useRecipes() {
  const recipes = useLiveQuery(() => db.recipes.toArray())

  const myRecipes = useLiveQuery(() =>
    db.recipes.filter((r) => !r.isBuiltin).toArray(),
  )

  const builtinRecipes = useLiveQuery(() =>
    db.recipes.filter((r) => r.isBuiltin).toArray(),
  )

  const addRecipe = async (
    data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'synced' | 'isBuiltin'>,
  ) => {
    const now = new Date().toISOString()
    const recipe: Recipe = {
      ...data,
      id: uuidv4(),
      isBuiltin: false,
      createdAt: now,
      updatedAt: now,
      synced: false,
    }
    await db.recipes.add(recipe)
    await enqueueSync({
      table: 'recipes',
      recordId: recipe.id,
      action: 'create',
      payload: recipe as unknown as Record<string, unknown>,
    })
    return recipe
  }

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    const existing = await db.recipes.get(id)
    if (!existing || existing.isBuiltin) return
    const updated: Recipe = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
      synced: false,
    }
    await db.recipes.put(updated)
    await enqueueSync({
      table: 'recipes',
      recordId: id,
      action: 'update',
      payload: updated as unknown as Record<string, unknown>,
    })
  }

  const deleteRecipe = async (id: string) => {
    const existing = await db.recipes.get(id)
    if (!existing || existing.isBuiltin) return
    await db.recipes.delete(id)
    await enqueueSync({
      table: 'recipes',
      recordId: id,
      action: 'delete',
    })
  }

  const getRecipe = async (id: string) => {
    return db.recipes.get(id)
  }

  return {
    recipes: recipes ?? [],
    myRecipes: myRecipes ?? [],
    builtinRecipes: builtinRecipes ?? [],
    loading: recipes === undefined,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipe,
  }
}

export function useRecipe(id: string | undefined) {
  return useLiveQuery(() => (id ? db.recipes.get(id) : undefined), [id])
}
