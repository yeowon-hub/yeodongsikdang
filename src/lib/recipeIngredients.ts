import type { RecipeIngredient, RecipeStep } from '@/types'

export function normalizeRecipeIngredients(raw: unknown): RecipeIngredient[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is RecipeIngredient =>
        Boolean(item) && typeof item === 'object' && typeof (item as RecipeIngredient).name === 'string',
    )
  }

  if (typeof raw === 'string') {
    try {
      return normalizeRecipeIngredients(JSON.parse(raw))
    } catch {
      return []
    }
  }

  if (raw && typeof raw === 'object') {
    return normalizeRecipeIngredients(Object.values(raw as Record<string, unknown>))
  }

  return []
}

export function normalizeRecipeSteps(raw: unknown): RecipeStep[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is RecipeStep =>
        Boolean(item) && typeof item === 'object' && typeof (item as RecipeStep).text === 'string',
    )
  }

  if (typeof raw === 'string') {
    try {
      return normalizeRecipeSteps(JSON.parse(raw))
    } catch {
      return []
    }
  }

  return []
}
