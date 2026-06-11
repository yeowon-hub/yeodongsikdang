import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db, enqueueSync } from '@/lib/db'
import type { Ingredient, StorageLocation } from '@/types'

export function useIngredients(location?: StorageLocation) {
  const ingredients = useLiveQuery(async () => {
    if (location) {
      return db.ingredients.where('location').equals(location).toArray()
    }
    return db.ingredients.toArray()
  }, [location])

  const addIngredient = async (
    data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt' | 'synced'>,
  ) => {
    const now = new Date().toISOString()
    const ingredient: Ingredient = {
      ...data,
      id: uuidv4(),
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
  }

  const deleteIngredient = async (id: string) => {
    await db.ingredients.delete(id)
    await enqueueSync({
      table: 'ingredients',
      recordId: id,
      action: 'delete',
    })
  }

  const moveIngredient = async (id: string, newLocation: StorageLocation) => {
    await updateIngredient(id, { location: newLocation })
  }

  return {
    ingredients: ingredients ?? [],
    loading: ingredients === undefined,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    moveIngredient,
  }
}

export function useExpiringCount() {
  return useLiveQuery(async () => {
    const all = await db.ingredients.toArray()
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const threshold = new Date(now)
    threshold.setDate(threshold.getDate() + 3)
    return all.filter((i) => {
      if (!i.expiryDate) return false
      const expiry = new Date(i.expiryDate)
      expiry.setHours(0, 0, 0, 0)
      return expiry <= threshold
    }).length
  })
}
