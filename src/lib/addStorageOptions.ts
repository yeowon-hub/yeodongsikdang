import type { StorageLocation } from '@/types'

export const ADD_STORAGE_CHOICES = [
  { id: 'general', label: '일반', location: 'general_fridge' as StorageLocation },
  { id: 'kimchi', label: '김치', location: 'kimchi_fridge' as StorageLocation },
  { id: 'shelf', label: '선반', location: 'shelf' as StorageLocation },
  { id: 'pantry', label: '펜트리', location: 'pantry' as StorageLocation },
] as const

export type AddStorageChoiceId = (typeof ADD_STORAGE_CHOICES)[number]['id']

export function inferAddStorageFromPath(pathname: string): StorageLocation {
  if (pathname.startsWith('/fridge/kimchi')) return 'kimchi_fridge'
  if (pathname.startsWith('/fridge/general') || pathname.startsWith('/fridge')) {
    return 'general_fridge'
  }
  if (pathname.startsWith('/shelf')) return 'shelf'
  if (pathname.startsWith('/pantry')) return 'pantry'
  return 'general_fridge'
}

export function addChoiceIdFromLocation(location: StorageLocation): AddStorageChoiceId {
  if (location.startsWith('kimchi')) return 'kimchi'
  if (location === 'shelf') return 'shelf'
  if (location === 'pantry') return 'pantry'
  return 'general'
}

export function locationFromAddChoiceId(id: AddStorageChoiceId): StorageLocation {
  return ADD_STORAGE_CHOICES.find((c) => c.id === id)!.location
}
