import Dexie, { type EntityTable } from 'dexie'
import type { Ingredient, Recipe, SyncQueueItem } from '@/types'
import { LEGACY_LOCATION_MAP } from '@/types'

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
    this.version(4)
      .stores({
        ingredients: 'id, location, userId, householdId, expiryDate, updatedAt',
        recipes: 'id, isBuiltin, userId, householdId, category, updatedAt',
        syncQueue: '++id, table, recordId, createdAt',
      })
      .upgrade(async (tx) => {
        const ingredients = await tx.table('ingredients').toArray()
        for (const item of ingredients) {
          const next = LEGACY_LOCATION_MAP[item.location as string]
          if (next && next !== item.location) {
            await tx.table('ingredients').update(item.id, { location: next })
          }
        }
      })
  }
}

export const db = new YeodongDB()

export async function enqueueSync(item: Omit<SyncQueueItem, 'id' | 'createdAt'>) {
  const existing = await db.syncQueue.where('recordId').equals(item.recordId).toArray()
  for (const row of existing) {
    if (row.table === item.table && row.id !== undefined) {
      await db.syncQueue.delete(row.id)
    }
  }
  await db.syncQueue.add({
    ...item,
    createdAt: new Date().toISOString(),
  })
}

export async function getPendingSyncItems() {
  const all = await db.syncQueue.orderBy('createdAt').toArray()
  const latestByKey = new Map<string, SyncQueueItem>()
  for (const item of all) {
    latestByKey.set(`${item.table}:${item.recordId}`, item)
  }
  return all.filter((item) => latestByKey.get(`${item.table}:${item.recordId}`) === item)
}

export async function clearSyncItemsForRecord(table: SyncQueueItem['table'], recordId: string) {
  const existing = await db.syncQueue.where('recordId').equals(recordId).toArray()
  for (const row of existing) {
    if (row.table === table && row.id !== undefined) {
      await db.syncQueue.delete(row.id)
    }
  }
}

export async function clearSyncItem(id: number) {
  await db.syncQueue.delete(id)
}

/** 로그아웃·계정 전환 시 이전 사용자 로컬 데이터 제거 (내장 레시피는 유지) */
export async function clearUserLocalData() {
  await db.ingredients.clear()
  const customRecipes = await db.recipes.filter((r) => !r.isBuiltin).toArray()
  if (customRecipes.length > 0) {
    await db.recipes.bulkDelete(customRecipes.map((r) => r.id))
  }
  await db.syncQueue.clear()
}
