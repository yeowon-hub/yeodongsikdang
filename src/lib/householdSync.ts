import { db, enqueueSync, getPendingSyncItems } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { canSyncRecipeToServer } from '@/lib/recipeSync'
import type { Ingredient, Recipe } from '@/types'
import { normalizeStorageLocation } from '@/types'

export interface SyncStats {
  remoteIngredients: number
  remoteRecipes: number
  localIngredients: number
  pendingItems: number
}

export async function migrateRemoteDataToHousehold() {
  if (!supabase) return
  const { error } = await supabase.rpc('migrate_my_data_to_household')
  if (error) throw error
}

export async function fetchHouseholdIngredientsFromServer(
  householdId: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  if (!supabase) return { rows: [], error: null }

  const { data: rpcData, error: rpcError } = await supabase.rpc('get_household_ingredients')
  if (!rpcError && Array.isArray(rpcData)) {
    return { rows: rpcData as Record<string, unknown>[], error: null }
  }

  const { data, error } = await supabase.from('ingredients').select('*').eq('household_id', householdId)
  if (error) return { rows: [], error: error.message }
  return { rows: (data ?? []) as Record<string, unknown>[], error: null }
}

export async function fetchHouseholdRecipesFromServer(
  householdId: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  if (!supabase) return { rows: [], error: null }

  const { data: rpcData, error: rpcError } = await supabase.rpc('get_household_recipes')
  if (!rpcError && Array.isArray(rpcData)) {
    return { rows: rpcData as Record<string, unknown>[], error: null }
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_builtin', false)
  if (error) return { rows: [], error: error.message }
  return { rows: (data ?? []) as Record<string, unknown>[], error: null }
}

export async function normalizeLocalIngredientLocations() {
  const pendingIds = new Set(
    (await getPendingSyncItems()).map((item) => item.recordId),
  )
  const now = new Date().toISOString()
  const ingredients = await db.ingredients.toArray()

  for (const item of ingredients) {
    const location = normalizeStorageLocation(item.location as string)
    if (location === item.location) continue
    const updated: Ingredient = {
      ...item,
      location,
      updatedAt: now,
      synced: false,
    }
    await db.ingredients.put(updated)
    if (!pendingIds.has(item.id)) {
      await enqueueSync({
        table: 'ingredients',
        recordId: item.id,
        action: 'update',
        payload: updated as unknown as Record<string, unknown>,
      })
    }
  }
}

export async function ensureLocalItemsHaveHousehold(householdId: string) {
  const pendingIds = new Set(
    (await getPendingSyncItems()).map((item) => item.recordId),
  )
  const now = new Date().toISOString()

  const ingredients = await db.ingredients.filter((item) => !item.householdId).toArray()
  for (const item of ingredients) {
    const updated: Ingredient = {
      ...item,
      householdId,
      updatedAt: now,
      synced: false,
    }
    await db.ingredients.put(updated)
    if (!pendingIds.has(item.id)) {
      await enqueueSync({
        table: 'ingredients',
        recordId: item.id,
        action: 'update',
        payload: updated as unknown as Record<string, unknown>,
      })
    }
  }

  const recipes = await db.recipes
    .filter((item) => canSyncRecipeToServer(item) && !item.householdId)
    .toArray()
  for (const item of recipes) {
    const updated: Recipe = {
      ...item,
      householdId,
      updatedAt: now,
      synced: false,
    }
    await db.recipes.put(updated)
    if (!pendingIds.has(item.id)) {
      await enqueueSync({
        table: 'recipes',
        recordId: item.id,
        action: 'update',
        payload: updated as unknown as Record<string, unknown>,
      })
    }
  }
}

export async function migrateLocalDataToHousehold(householdId: string) {
  await ensureLocalItemsHaveHousehold(householdId)
}

export async function removeStaleHouseholdItems(
  householdId: string,
  remoteIngredientIds: Set<string>,
  remoteRecipeIds: Set<string>,
) {
  const pendingIds = new Set(
    (await getPendingSyncItems()).map((item) => item.recordId),
  )

  const localIngredients = await db.ingredients
    .filter((item) => item.householdId === householdId)
    .toArray()
  for (const item of localIngredients) {
    if (remoteIngredientIds.has(item.id)) continue
    if (!item.synced || pendingIds.has(item.id)) continue
    await db.ingredients.delete(item.id)
  }

  const localRecipes = await db.recipes
    .filter((item) => !item.isBuiltin && item.householdId === householdId)
    .toArray()
  for (const item of localRecipes) {
    if (remoteRecipeIds.has(item.id)) continue
    if (!item.synced || pendingIds.has(item.id)) continue
    await db.recipes.delete(item.id)
  }
}

export async function getLocalSyncStats(householdId: string | null): Promise<SyncStats> {
  const allIngredients = await db.ingredients.toArray()
  const localIngredients = householdId
    ? allIngredients.filter((item) => item.householdId === householdId)
    : allIngredients
  const pending = await getPendingSyncItems()
  return {
    remoteIngredients: 0,
    remoteRecipes: 0,
    localIngredients: localIngredients.length,
    pendingItems: pending.length,
  }
}
