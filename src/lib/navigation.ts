import type { FridgeUnitId, StorageLocation } from '@/types'
import { isFreezerCompartment, isFridgeCompartment, STORAGE_META } from '@/types'

export type LocationRouteOptions = {
  shelfLevel?: number
  ingredientId?: string
}

export function getLocationRoute(
  location: StorageLocation,
  options?: LocationRouteOptions,
): string {
  const meta = STORAGE_META[location]
  const params = new URLSearchParams()

  if (meta.unitId) {
    if (isFreezerCompartment(location)) params.set('compartment', 'freezer')
    else if (isFridgeCompartment(location)) params.set('compartment', 'fridge')
    if (options?.shelfLevel !== undefined) {
      params.set('level', String(options.shelfLevel))
    }
    if (options?.ingredientId) params.set('ingredient', options.ingredientId)
    const qs = params.toString()
    return `/fridge/${meta.unitId}${qs ? `?${qs}` : ''}`
  }

  if (location === 'shelf') {
    const params = new URLSearchParams()
    if (options?.shelfLevel !== undefined) params.set('level', String(options.shelfLevel))
    if (options?.ingredientId) params.set('ingredient', options.ingredientId)
    const qs = params.toString()
    return qs ? `/shelf?${qs}` : '/shelf'
  }

  if (location === 'pantry') {
    const params = new URLSearchParams()
    if (options?.shelfLevel !== undefined) params.set('level', String(options.shelfLevel))
    if (options?.ingredientId) params.set('ingredient', options.ingredientId)
    const qs = params.toString()
    return qs ? `/pantry?${qs}` : '/pantry'
  }

  return '/home'
}

export function getIngredientRoute(ingredient: {
  id: string
  location: StorageLocation
  shelfLevel?: number
}): string {
  return getLocationRoute(ingredient.location, {
    shelfLevel: ingredient.shelfLevel,
    ingredientId: ingredient.id,
  })
}

export function parseCompartmentIndex(
  value: string | null,
): 0 | 1 | null {
  if (value === 'freezer' || value === '0') return 0
  if (value === 'fridge' || value === '1') return 1
  return null
}

export function parseLevelIndex(value: string | null): number | undefined {
  if (value === null || value === '') return undefined
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 6) return undefined
  return n
}

export function getFridgeUnitRoute(unitId: FridgeUnitId): string {
  return `/fridge/${unitId}`
}

export function getRecipeRoute(id: string): string {
  return `/recipes/${id}`
}

export const HOME_TILES = [
  { id: 'general' as const, label: '일반', route: '/fridge/general', color: 'bg-fridge text-fridge-dark' },
  { id: 'kimchi' as const, label: '김치', route: '/fridge/kimchi', color: 'bg-amber-50 text-amber-800' },
  { id: 'shelf' as const, label: '선반', route: '/shelf', color: 'bg-shelf text-shelf-dark' },
  { id: 'pantry' as const, label: '펜트리', route: '/pantry', color: 'bg-pantry text-pantry-dark' },
] as const
