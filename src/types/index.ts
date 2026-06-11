export type StorageLocation =
  | 'general_fridge'
  | 'general_freezer'
  | 'kimchi_fridge'
  | 'kimchi_freezer'
  | 'shelf'
  | 'pantry'

export type ColdStorageLocation =
  | 'general_fridge'
  | 'general_freezer'
  | 'kimchi_fridge'
  | 'kimchi_freezer'

/** 양문형 냉장고 1대 = 냉장실 + 냉동실 */
export const FRIDGE_UNITS = [
  {
    id: 'general' as const,
    label: '일반 냉장고',
    compartments: [
      { location: 'general_freezer' as const, shortLabel: '냉동실' },
      { location: 'general_fridge' as const, shortLabel: '냉장실' },
    ],
  },
  {
    id: 'kimchi' as const,
    label: '김치냉장고',
    compartments: [
      { location: 'kimchi_freezer' as const, shortLabel: '냉동실' },
      { location: 'kimchi_fridge' as const, shortLabel: '냉장실' },
    ],
  },
] as const

export type FridgeUnitId = (typeof FRIDGE_UNITS)[number]['id']

export const COLD_STORAGE_LOCATIONS: readonly ColdStorageLocation[] = [
  'general_fridge',
  'general_freezer',
  'kimchi_fridge',
  'kimchi_freezer',
]

export const STORAGE_META: Record<
  StorageLocation,
  {
    label: string
    shortLabel: string
    kind: 'fridge' | 'freezer' | 'shelf' | 'pantry'
    unitId?: FridgeUnitId
  }
> = {
  general_fridge: {
    label: '일반 냉장고 · 냉장실',
    shortLabel: '냉장실',
    kind: 'fridge',
    unitId: 'general',
  },
  general_freezer: {
    label: '일반 냉장고 · 냉동실',
    shortLabel: '냉동실',
    kind: 'freezer',
    unitId: 'general',
  },
  kimchi_fridge: {
    label: '김치냉장고 · 냉장실',
    shortLabel: '냉장실',
    kind: 'fridge',
    unitId: 'kimchi',
  },
  kimchi_freezer: {
    label: '김치냉장고 · 냉동실',
    shortLabel: '냉동실',
    kind: 'freezer',
    unitId: 'kimchi',
  },
  shelf: { label: '선반', shortLabel: '선반', kind: 'shelf' },
  pantry: { label: '펜트리', shortLabel: '펜트리', kind: 'pantry' },
}

export const ALL_STORAGE_LOCATIONS = Object.keys(STORAGE_META) as StorageLocation[]

export function isFridgeCompartment(location: StorageLocation) {
  return location.endsWith('_fridge')
}

export function isFreezerCompartment(location: StorageLocation) {
  return location.endsWith('_freezer')
}

export function isColdLocation(location: StorageLocation) {
  return isFridgeCompartment(location) || isFreezerCompartment(location)
}

export function usesShelfLevel(location: StorageLocation) {
  return isColdLocation(location) || location === 'shelf' || location === 'pantry'
}

export interface Ingredient {
  id: string
  userId?: string
  householdId?: string
  name: string
  quantity: number
  unit: string
  location: StorageLocation
  expiryDate?: string
  shelfLevel?: number
  imageUrl?: string
  createdAt: string
  updatedAt: string
  synced?: boolean
}

export interface RecipeStep {
  order: number
  text: string
}

export interface RecipeIngredient {
  name: string
  quantity?: string
  unit?: string
  isOptional?: boolean
}

export interface Recipe {
  id: string
  userId?: string
  householdId?: string
  title: string
  description?: string
  steps: RecipeStep[]
  ingredients: RecipeIngredient[]
  cookingTime?: number
  servings?: number
  category?: string
  imageUrl?: string
  isBuiltin: boolean
  createdAt: string
  updatedAt: string
  synced?: boolean
}

export interface RecipeMatch {
  recipe: Recipe
  matchScore: number
  matchedIngredients: string[]
  missingIngredients: string[]
  tier: 'ready' | 'almost' | 'other'
}

export interface SyncQueueItem {
  id?: number
  table: 'ingredients' | 'recipes'
  recordId: string
  action: 'create' | 'update' | 'delete'
  payload?: Record<string, unknown>
  createdAt: string
}

export const UNITS = ['개', 'g', 'kg', 'ml', 'L', '컵', '큰술', '작은술', '봉', '팩', '줄기', '장'] as const

export const CATEGORIES = ['찌개·국', '볶음', '밥·면', '반찬', '간식', '샐러드', '기타'] as const

export const SHELF_LEVELS = [0, 1, 2, 3] as const

export type HouseholdRole = 'owner' | 'member'

export interface Household {
  id: string
  name: string
  inviteCode: string
  role: HouseholdRole
  memberCount: number
}

/** 예전 location 값 → 새 구조 */
export const LEGACY_LOCATION_MAP: Record<string, StorageLocation> = {
  fridge: 'general_fridge',
  fridge1: 'general_fridge',
  fridge2: 'kimchi_fridge',
  freezer: 'general_freezer',
}
