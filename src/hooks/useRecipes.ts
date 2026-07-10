import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db, enqueueSync } from '@/lib/db'
import { canSyncRecipeToServer } from '@/lib/recipeSync'
import { useAuth } from '@/hooks/useSync'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useSyncTrigger } from '@/contexts/SyncContext'
import type { Recipe } from '@/types'

export function useRecipes() {
  const { user } = useAuth()
  const { household } = useHousehold()
  const { sync } = useSyncTrigger()

  const recipes = useLiveQuery(() => db.recipes.toArray())

  const myRecipes = useLiveQuery(async () => {
    const all = await db.recipes.filter((r) => !r.isBuiltin).toArray()
    if (household?.id) {
      return all.filter(
        (item) =>
          item.householdId === household.id ||
          (!item.householdId && !item.synced),
      )
    }
    return all.filter((item) => !item.householdId || item.userId === user?.id)
  }, [household?.id, user?.id])

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
      userId: user?.id,
      householdId: household?.id,
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
    void sync()
    return recipe
  }

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    const existing = await db.recipes.get(id)
    if (!existing) return
    const shouldSync = canSyncRecipeToServer(existing) && (!existing.isBuiltin || Boolean(household?.id))
    const updated: Recipe = {
      ...existing,
      ...updates,
      id,
      isBuiltin: existing.isBuiltin,
      builtinCustomized: existing.isBuiltin ? true : existing.builtinCustomized,
      householdId: existing.householdId ?? household?.id,
      updatedAt: new Date().toISOString(),
      synced: shouldSync ? false : true,
    }
    await db.recipes.put(updated)
    if (shouldSync) {
      await enqueueSync({
        table: 'recipes',
        recordId: id,
        action: 'update',
        payload: updated as unknown as Record<string, unknown>,
      })
      void sync()
    }
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
    void sync()
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
