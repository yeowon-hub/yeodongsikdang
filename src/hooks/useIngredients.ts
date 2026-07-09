import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db, enqueueSync } from '@/lib/db'
import { useAuth } from '@/hooks/useSync'
import { useHousehold, getActiveHouseholdId } from '@/contexts/HouseholdContext'
import { useSyncTrigger } from '@/contexts/SyncContext'
import type { Ingredient, StorageLocation } from '@/types'
import { normalizeIngredient } from '@/types'

export function useIngredients(location?: StorageLocation) {
  const { user } = useAuth()
  const { household } = useHousehold()
  const { sync } = useSyncTrigger()
  const activeHouseholdId = household?.id ?? getActiveHouseholdId()

  const ingredients = useLiveQuery(async () => {
    const all = location
      ? await db.ingredients.where('location').equals(location).toArray()
      : await db.ingredients.toArray()

    if (activeHouseholdId) {
      return all
        .map(normalizeIngredient)
        .filter(
          (item) =>
            item.householdId === activeHouseholdId ||
            (!item.householdId && !item.synced),
        )
    }

    return all
      .map(normalizeIngredient)
      .filter((item) => !item.householdId || item.userId === user?.id)
  }, [location, activeHouseholdId, user?.id])

  const addIngredient = async (
    data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt' | 'synced'>,
  ) => {
    const now = new Date().toISOString()
    const activeHouseholdId = household?.id ?? getActiveHouseholdId() ?? undefined
    const ingredient: Ingredient = {
      ...data,
      id: uuidv4(),
      userId: user?.id,
      householdId: activeHouseholdId,
      createdAt: now,
      updatedAt: now,
      synced: false,
    }
    await db.ingredients.add(ingredient)
    await enqueueSync({
      table: 'ingredients',
      recordId: ingredient.id,
      action: 'create',
      payload: ingredient as unknown as Record<string, unknown>,
    })
    void sync()
    return ingredient
  }

  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    const existing = await db.ingredients.get(id)
    if (!existing) return
    const updated: Ingredient = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
      synced: false,
    }
    await db.ingredients.put(updated)
    await enqueueSync({
      table: 'ingredients',
      recordId: id,
      action: 'update',
      payload: updated as unknown as Record<string, unknown>,
    })
    void sync()
  }

  const deleteIngredient = async (id: string) => {
    await db.ingredients.delete(id)
    await enqueueSync({
      table: 'ingredients',
      recordId: id,
      action: 'delete',
    })
    void sync()
  }

  const moveIngredient = async (id: string, newLocation: StorageLocation) => {
    await updateIngredient(id, { location: newLocation })
  }

  const moveIngredientToLevel = async (id: string, shelfLevel: number) => {
    await updateIngredient(id, { shelfLevel })
  }

  return {
    ingredients: ingredients ?? [],
    loading: ingredients === undefined,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    moveIngredient,
    moveIngredientToLevel,
  }
}

export function useExpiringCount() {
  const { user } = useAuth()
  const { household } = useHousehold()

  return useLiveQuery(async () => {
    const all = await db.ingredients.toArray()
    let visible = all
    if (household?.id) {
      visible = all.filter(
        (item) =>
          item.householdId === household.id ||
          (!item.householdId && !item.synced),
      )
    } else {
      visible = all.filter((item) => !item.householdId || item.userId === user?.id)
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const threshold = new Date(now)
    threshold.setDate(threshold.getDate() + 3)
    return visible.filter((i) => {
      if (!i.expiryDate) return false
      const expiry = new Date(i.expiryDate)
      expiry.setHours(0, 0, 0, 0)
      return expiry <= threshold
    }).length
  }, [household?.id, user?.id])
}
