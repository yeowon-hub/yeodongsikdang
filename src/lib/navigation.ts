import type { FridgeUnitId, StorageLocation } from '@/types'
import { STORAGE_META } from '@/types'

export function getLocationRoute(location: StorageLocation): string {
  const meta = STORAGE_META[location]
  if (meta.unitId) return `/fridge/${meta.unitId}`
  if (location === 'shelf') return '/shelf'
  if (location === 'pantry') return '/pantry'
  return '/home'
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
