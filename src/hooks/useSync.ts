import { useCallback, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, getRedirectUrl } from '@/lib/supabase'
import { db, getPendingSyncItems, clearSyncItem } from '@/lib/db'
import type { Ingredient, Recipe } from '@/types'

function toDbIngredient(row: Record<string, unknown>): Ingredient {
  return {
    id: row.id as string,
    userId: row.user_id as string | undefined,
    householdId: (row.household_id as string) || undefined,
    name: row.name as string,
    quantity: row.quantity as number,
    unit: row.unit as string,
    location: row.location as Ingredient['location'],
    expiryDate: (row.expiry_date as string) || undefined,
    shelfLevel: (row.shelf_level as number) || undefined,
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
    steps: row.steps as Recipe['steps'],
    ingredients: row.ingredients as Recipe['ingredients'],
    cookingTime: (row.cooking_time as number) || undefined,
    servings: (row.servings as number) || undefined,
    category: (row.category as string) || undefined,
    imageUrl: (row.image_url as string) || undefined,
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
    is_builtin: false,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }
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
    return supabase.auth.signUp({ email, password })
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
    await supabase.auth.signOut()
  }

  return { user, session, loading, signUp, signIn, signInWithKakao, signOut, isConfigured: isSupabaseConfigured }
}

export function useSync(user: User | null, householdId: string | null) {
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  const pullFromRemote = useCallback(async () => {
    if (!supabase || !user) return

    let ingredientsQuery = supabase.from('ingredients').select('*')
    let recipesQuery = supabase.from('recipes').select('*')

    if (householdId) {
      ingredientsQuery = ingredientsQuery.eq('household_id', householdId)
      recipesQuery = recipesQuery.eq('household_id', householdId)
    } else {
      ingredientsQuery = ingredientsQuery.eq('user_id', user.id).is('household_id', null)
      recipesQuery = recipesQuery.eq('user_id', user.id).is('household_id', null)
    }

    const [{ data: ingredients }, { data: recipes }] = await Promise.all([
      ingredientsQuery,
      recipesQuery,
    ])

    if (ingredients) {
      for (const row of ingredients) {
        const item = toDbIngredient(row)
        const local = await db.ingredients.get(item.id)
        if (!local || new Date(item.updatedAt) > new Date(local.updatedAt)) {
          await db.ingredients.put({ ...item, synced: true })
        }
      }
    }

    if (recipes) {
      for (const row of recipes) {
        const item = toDbRecipe(row)
        if (item.isBuiltin) continue
        const local = await db.recipes.get(item.id)
        if (!local || new Date(item.updatedAt) > new Date(local.updatedAt)) {
          await db.recipes.put({ ...item, synced: true })
        }
      }
    }
  }, [user, householdId])

  const pushToRemote = useCallback(async () => {
    if (!supabase || !user) return

    const pending = await getPendingSyncItems()
    for (const item of pending) {
      try {
        if (item.table === 'ingredients') {
          if (item.action === 'delete') {
            await supabase.from('ingredients').delete().eq('id', item.recordId)
          } else if (item.payload) {
            const ing = item.payload as unknown as Ingredient
            const row = ingredientToRow(ing, user.id, householdId)
            await supabase.from('ingredients').upsert(row)
            await db.ingredients.update(item.recordId, {
              synced: true,
              userId: user.id,
              householdId: householdId ?? undefined,
            })
          }
        } else if (item.table === 'recipes') {
          if (item.action === 'delete') {
            await supabase.from('recipes').delete().eq('id', item.recordId)
          } else if (item.payload) {
            const rec = item.payload as unknown as Recipe
            if (rec.isBuiltin) {
              if (item.id) await clearSyncItem(item.id)
              continue
            }
            const row = recipeToRow(rec, user.id, householdId)
            await supabase.from('recipes').upsert(row)
            await db.recipes.update(item.recordId, {
              synced: true,
              userId: user.id,
              householdId: householdId ?? undefined,
            })
          }
        }
        if (item.id) await clearSyncItem(item.id)
      } catch (err) {
        console.error('Sync error:', err)
      }
    }
  }, [user, householdId])

  const sync = useCallback(async () => {
    if (!user || !supabase || !navigator.onLine) return
    setSyncing(true)
    try {
      await pushToRemote()
      await pullFromRemote()
      setLastSynced(new Date())
    } finally {
      setSyncing(false)
    }
  }, [user, pushToRemote, pullFromRemote])

  useEffect(() => {
    if (!user) return
    sync()
    const interval = setInterval(sync, 30000)
    const onOnline = () => sync()
    window.addEventListener('online', onOnline)
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', onOnline)
    }
  }, [user, householdId, sync])

  return { syncing, lastSynced, sync }
}
