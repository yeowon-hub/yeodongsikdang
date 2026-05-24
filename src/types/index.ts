export type StorageLocation = 'fridge1' | 'fridge2' | 'freezer' | 'shelf'

export const COLD_STORAGE_LOCATIONS = ['fridge1', 'fridge2', 'freezer'] as const
export type ColdStorageLocation = (typeof COLD_STORAGE_LOCATIONS)[number]

export const STORAGE_META: Record<
  StorageLocation,
  { label: string; shortLabel: string; kind: 'fridge' | 'freezer' | 'shelf' }
> = {
  fridge1: { label: '냉장고 1', shortLabel: '냉장1', kind: 'fridge' },
  fridge2: { label: '냉장고 2', shortLabel: '냉장2', kind: 'fridge' },
  freezer: { label: '냉동실', shortLabel: '냉동', kind: 'freezer' },
  shelf: { label: '선반', shortLabel: '선반', kind: 'shelf' },
}

export const ALL_STORAGE_LOCATIONS = Object.keys(STORAGE_META) as StorageLocation[]

export function isFridgeLocation(location: StorageLocation) {
  return location === 'fridge1' || location === 'fridge2'
}

export function isColdLocation(location: StorageLocation) {
  return isFridgeLocation(location) || location === 'freezer'
}

export function usesShelfLevel(location: StorageLocation) {
  return isColdLocation(location) || location === 'shelf'
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
