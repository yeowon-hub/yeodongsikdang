import Dexie, { type EntityTable } from 'dexie'
import type { Ingredient, Recipe, SyncQueueItem } from '@/types'

class YeodongDB extends Dexie {
  ingredients!: EntityTable<Ingredient, 'id'>
  recipes!: EntityTable<Recipe, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>

  constructor() {
    super('yeodongsikdang')
    this.version(1).stores({
      ingredients: 'id, location, userId, expiryDate, updatedAt',
      recipes: 'id, isBuiltin, userId, category, updatedAt',
      syncQueue: '++id, table, recordId, createdAt',
    })
    this.version(2)
      .stores({
        ingredients: 'id, location, userId, expiryDate, updatedAt',
        recipes: 'id, isBuiltin, userId, category, updatedAt',
        syncQueue: '++id, table, recordId, createdAt',
      })
      .upgrade(async (tx) => {
        const ingredients = await tx.table('ingredients').toArray()
        for (const item of ingredients) {
          if (item.location === 'fridge') {
            await tx.table('ingredients').update(item.id, { location: 'fridge1' })
          }
        }
      })
    this.version(3).stores({
      ingredients: 'id, location, userId, householdId, expiryDate, updatedAt',
      recipes: 'id, isBuiltin, userId, householdId, category, updatedAt',
      syncQueue: '++id, table, recordId, createdAt',
    })
  }
}

export const db = new YeodongDB()

export async function enqueueSync(item: Omit<SyncQueueItem, 'id' | 'createdAt'>) {
  await db.syncQueue.add({
    ...item,
    createdAt: new Date().toISOString(),
  })
}

export async function getPendingSyncItems() {
  return db.syncQueue.orderBy('createdAt').toArray()
}

export async function clearSyncItem(id: number) {
  await db.syncQueue.delete(id)
}
