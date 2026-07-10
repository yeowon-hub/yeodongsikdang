import { useCallback, useEffect, useRef, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, getRedirectUrl } from '@/lib/supabase'
import { db, getPendingSyncItems, clearSyncItem, clearSyncItemsForRecord, clearUserLocalData, enqueueSync } from '@/lib/db'
import {
  ensureLocalItemsHaveHousehold,
  migrateRemoteDataToHousehold,
  normalizeLocalIngredientLocations,
  removeStaleHouseholdItems,
  fetchHouseholdIngredientsFromServer,
  fetchHouseholdRecipesFromServer,
  type SyncStats,
} from '@/lib/householdSync'
import type { Ingredient, Recipe } from '@/types'
import { normalizeStorageLocation, toLegacyPushLocation } from '@/types'
import { normalizeRecipeIngredients, normalizeRecipeSteps } from '@/lib/recipeIngredients'
import { canSyncRecipeToServer, recipeFromRemoteRow } from '@/lib/recipeSync'

function toDbIngredient(row: Record<string, unknown>): Ingredient {
  return {
    id: row.id as string,
    userId: row.user_id as string | undefined,
    householdId: (row.household_id as string) || undefined,
    name: row.name as string,
    quantity: row.quantity as number,
    unit: row.unit as string,
    location: normalizeStorageLocation(row.location as string),
    expiryDate: (row.expiry_date as string) || undefined,
    shelfLevel: (row.shelf_level as number) || undefined,
    imageUrl: (row.image_url as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    synced: true,
  }
}

function toDbRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || undefined,
    householdId: (row.household_id as string) || undefined,
    title: row.title as string,
    description: (row.description as string) || undefined,
    steps: normalizeRecipeSteps(row.steps),
    ingredients: normalizeRecipeIngredients(row.ingredients),
    cookingTime: (row.cooking_time as number) || undefined,
    servings: (row.servings as number) || undefined,
    category: (row.category as string) || undefined,
    imageUrl: (row.image_url as string) || undefined,
    sourceUrl: (row.source_url as string) || undefined,
    isBuiltin: row.is_builtin as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    synced: true,
  }
}

function ingredientToRow(item: Ingredient, userId: string, householdId: string | null) {
  return {
    id: item.id,
    user_id: userId,
    household_id: householdId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location,
    expiry_date: item.expiryDate || null,
    shelf_level: item.shelfLevel ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }
}

function formatSyncError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { message?: string; details?: string; hint?: string }
    return [e.message, e.details, e.hint].filter(Boolean).join(' — ')
  }
  if (err instanceof Error) return err.message
  return '동기화 중 오류가 발생했습니다'
}

function isLocationCheckError(err: unknown): boolean {
  return formatSyncError(err).includes('ingredients_location_check')
}

async function upsertIngredient(localIng: Ingredient, userId: string, householdId: string | null) {
  if (!supabase) return

  const normalizedLocation = normalizeStorageLocation(localIng.location as string)
  const normalizedIng: Ingredient = { ...localIng, location: normalizedLocation }
  if (normalizedLocation !== localIng.location) {
    await db.ingredients.put({ ...normalizedIng, synced: false })
  }

  const row = ingredientToRow(normalizedIng, userId, householdId)
  const { error } = await supabase.from('ingredients').upsert(row)
  if (!error) return

  if (isLocationCheckError(error)) {
    const legacyRow = {
      ...row,
      location: toLegacyPushLocation(normalizedLocation),
    }
    const { error: legacyError } = await supabase.from('ingredients').upsert(legacyRow)
    if (!legacyError) return
    throw legacyError
  }

  throw error
}

function recipeToRow(item: Recipe, userId: string, householdId: string | null) {
  return {
    id: item.id,
    user_id: userId,
    household_id: householdId,
    title: item.title,
    description: item.description || null,
    steps: item.steps,
    ingredients: item.ingredients,
    cooking_time: item.cookingTime ?? null,
    servings: item.servings ?? null,
    category: item.category || null,
    image_url: item.imageUrl || null,
    source_url: item.sourceUrl || null,
    is_builtin: false,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }
}

function shouldApplyRemote<T extends { updatedAt: string; householdId?: string; synced?: boolean }>(
  local: T | undefined,
  remote: T,
  activeHouseholdId: string | null,
): boolean {
  if (!local) return true
  if (!local.synced) return false
  const needsHouseholdPatch =
    Boolean(activeHouseholdId) &&
    (!local.householdId || local.householdId !== remote.householdId)
  if (needsHouseholdPatch) return true
  return new Date(remote.updatedAt) >= new Date(local.updatedAt)
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    })
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signInWithKakao = async () => {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')
    return supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: getRedirectUrl(),
        // Keep Kakao consent minimal: nickname + profile image only.
        // queryParams.scope helps override provider-side default scope merges.
        scopes: 'profile_nickname profile_image',
        queryParams: {
          scope: 'profile_nickname profile_image',
        },
      },
    })
  }

  const signOut = async () => {
    if (!supabase) return
    await clearUserLocalData()
    await supabase.auth.signOut()
  }

  return { user, session, loading, signUp, signIn, signInWithKakao, signOut, isConfigured: isSupabaseConfigured }
}

export function useSync(user: User | null, householdId: string | null, householdLoading = false) {
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const migratedHouseholdId = useRef<string | null>(null)
  const prevUserId = useRef<string | null>(null)
  const syncInFlight = useRef<Promise<void> | null>(null)

  useEffect(() => {
    const currentUserId = user?.id ?? null
    if (currentUserId && prevUserId.current && prevUserId.current !== currentUserId) {
      void clearUserLocalData()
      migratedHouseholdId.current = null
    }
    if (!currentUserId) {
      migratedHouseholdId.current = null
    }
    prevUserId.current = currentUserId
  }, [user?.id])

  const pullFromRemote = useCallback(async (): Promise<{ ingredientCount: number; recipeCount: number }> => {
    if (!supabase || !user) return { ingredientCount: 0, recipeCount: 0 }

    let ingredientRows: Record<string, unknown>[] = []
    let recipeRows: Record<string, unknown>[] = []

    if (householdId) {
      const [ingResult, recResult] = await Promise.all([
        fetchHouseholdIngredientsFromServer(householdId),
        fetchHouseholdRecipesFromServer(householdId),
      ])
      if (ingResult.error) throw new Error(`재료 불러오기 실패: ${ingResult.error}`)
      if (recResult.error) throw new Error(`레시피 불러오기 실패: ${recResult.error}`)
      ingredientRows = ingResult.rows
      recipeRows = recResult.rows

      const { data: orphanIngredients, error: orphanError } = await supabase
        .from('ingredients')
        .select('*')
        .eq('user_id', user.id)
        .is('household_id', null)
      if (orphanError) throw new Error(`개인 재료 불러오기 실패: ${orphanError.message}`)
      if (orphanIngredients?.length) {
        ingredientRows = [...ingredientRows, ...(orphanIngredients as Record<string, unknown>[])]
      }
    } else {
      const [{ data: ingredients, error: ingredientsError }, { data: recipes, error: recipesError }] =
        await Promise.all([
          supabase.from('ingredients').select('*').eq('user_id', user.id).is('household_id', null),
          supabase.from('recipes').select('*').eq('user_id', user.id).is('household_id', null),
        ])
      if (ingredientsError) throw new Error(`재료 불러오기 실패: ${ingredientsError.message}`)
      if (recipesError) throw new Error(`레시피 불러오기 실패: ${recipesError.message}`)
      ingredientRows = (ingredients ?? []) as Record<string, unknown>[]
      recipeRows = (recipes ?? []) as Record<string, unknown>[]
    }

    for (const row of ingredientRows) {
      const item = toDbIngredient(row)
      const local = await db.ingredients.get(item.id)
      const patchedHouseholdId = item.householdId ?? householdId ?? undefined
      const needsHouseholdUpload = Boolean(householdId && !item.householdId)
      const remoteItem: Ingredient = {
        ...item,
        householdId: patchedHouseholdId,
        synced: needsHouseholdUpload ? false : true,
      }
      if (shouldApplyRemote(local, remoteItem, householdId) || needsHouseholdUpload) {
        await db.ingredients.put(remoteItem)
        if (needsHouseholdUpload) {
          await enqueueSync({
            table: 'ingredients',
            recordId: item.id,
            action: 'update',
            payload: remoteItem as unknown as Record<string, unknown>,
          })
        }
      }
    }

    for (const row of recipeRows) {
      const item = toDbRecipe(row)
      if (item.isBuiltin) continue
      const local = await db.recipes.get(item.id)
      const remoteRecipe = recipeFromRemoteRow(item, householdId)
      if (shouldApplyRemote(local, remoteRecipe, householdId)) {
        await db.recipes.put(remoteRecipe)
      }
    }

    return { ingredientCount: ingredientRows.length, recipeCount: recipeRows.length }
  }, [user, householdId])

  const pushToRemote = useCallback(async (): Promise<{ ok: boolean; errors: string[] }> => {
    if (!supabase || !user) return { ok: true, errors: [] }

    const errors: string[] = []
    const pending = await getPendingSyncItems()
    for (const item of pending) {
      try {
        if (item.table === 'ingredients') {
          if (item.action === 'delete') {
            const { error } = await supabase.from('ingredients').delete().eq('id', item.recordId)
            if (error) throw error
          } else {
            const localIng = await db.ingredients.get(item.recordId)
            if (!localIng) {
              if (item.id) await clearSyncItem(item.id)
              await clearSyncItemsForRecord(item.table, item.recordId)
              continue
            }
            const effectiveHouseholdId = householdId ?? localIng.householdId ?? null
            if (householdId && !effectiveHouseholdId) {
              throw new Error('가족 재료는 household_id가 필요합니다')
            }
            await upsertIngredient(localIng, user.id, effectiveHouseholdId)
            await db.ingredients.update(item.recordId, {
              synced: true,
              userId: user.id,
              householdId: effectiveHouseholdId ?? undefined,
              location: normalizeStorageLocation(localIng.location as string),
            })
          }
        } else if (item.table === 'recipes') {
          if (item.action === 'delete') {
            const { error } = await supabase.from('recipes').delete().eq('id', item.recordId)
            if (error) throw error
          } else {
            const localRec = await db.recipes.get(item.recordId)
            if (!localRec || !canSyncRecipeToServer(localRec)) {
              if (item.id) await clearSyncItem(item.id)
              await clearSyncItemsForRecord(item.table, item.recordId)
              continue
            }
            const effectiveHouseholdId = householdId ?? localRec.householdId ?? null
            if (householdId && !effectiveHouseholdId) {
              throw new Error('가족 레시피는 household_id가 필요합니다')
            }
            const row = recipeToRow(localRec, user.id, effectiveHouseholdId)
            const { error: upsertError } = await supabase.from('recipes').upsert(row)
            if (upsertError) throw upsertError
            await db.recipes.update(item.recordId, {
              synced: true,
              userId: user.id,
              householdId: effectiveHouseholdId ?? undefined,
            })
          }
        }
        if (item.id) await clearSyncItem(item.id)
        await clearSyncItemsForRecord(item.table, item.recordId)
      } catch (err) {
        errors.push(formatSyncError(err))
        console.error('Sync error:', err)
      }
    }
    return { ok: errors.length === 0, errors }
  }, [user, householdId])

  const sync = useCallback(
    async (options?: { force?: boolean }) => {
      if (!user || !supabase || !navigator.onLine) return
      if (!options?.force && householdLoading) return

      if (syncInFlight.current && !options?.force) return syncInFlight.current

      const run = (async () => {
        setSyncing(true)
        setLastSyncError(null)
        try {
          if (householdId) {
            try {
              await migrateRemoteDataToHousehold()
            } catch (err) {
              console.error('remote household migration error:', err)
            }
            await normalizeLocalIngredientLocations()
            await ensureLocalItemsHaveHousehold(householdId)
            migratedHouseholdId.current = householdId
          } else {
            await normalizeLocalIngredientLocations()
          }

          const pushResult = await pushToRemote()
          const pullResult = await pullFromRemote()

          if (householdId && pushResult.ok) {
            const pending = await getPendingSyncItems()
            if (pending.length === 0) {
              const { rows: remoteIngredients } = await fetchHouseholdIngredientsFromServer(householdId)
              const { rows: remoteRecipes } = await fetchHouseholdRecipesFromServer(householdId)
              await removeStaleHouseholdItems(
                householdId,
                new Set(remoteIngredients.map((row) => row.id as string)),
                new Set(remoteRecipes.map((row) => row.id as string)),
              )
            }
          }

          const localCount = householdId
            ? (await db.ingredients.filter((i) => i.householdId === householdId).toArray()).length
            : (await db.ingredients.toArray()).length
          const pendingCount = (await getPendingSyncItems()).length

          setSyncStats({
            remoteIngredients: pullResult.ingredientCount,
            remoteRecipes: pullResult.recipeCount,
            localIngredients: localCount,
            pendingItems: pendingCount,
          })

          if (pushResult.errors.length > 0) {
            setLastSyncError(`업로드 실패: ${pushResult.errors[0]}`)
          } else {
            setLastSynced(new Date())
          }
        } catch (err) {
          const message = formatSyncError(err)
          setLastSyncError(message)
          console.error('sync failed:', err)
        } finally {
          setSyncing(false)
          syncInFlight.current = null
        }
      })()

      syncInFlight.current = run
      return run
    },
    [user, householdId, householdLoading, pushToRemote, pullFromRemote],
  )

  useEffect(() => {
    if (!user) {
      migratedHouseholdId.current = null
      return
    }
    if (householdLoading) return

    sync()
    const interval = setInterval(sync, 10000)
    const onOnline = () => sync()
    window.addEventListener('online', onOnline)
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', onOnline)
    }
  }, [user, householdId, householdLoading, sync])

  return { syncing, lastSynced, lastSyncError, syncStats, sync }
}
