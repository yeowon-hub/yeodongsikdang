import type { Ingredient, Recipe, RecipeMatch } from '@/types'
import {
  hasMatchedIngredient,
  ingredientsMatch,
  normalizeIngredientName,
  textMentionsIngredient,
} from '@/lib/ingredientMatch'
import { normalizeRecipeIngredients, normalizeRecipeSteps } from '@/lib/recipeIngredients'

export { ingredientsMatch, hasMatchedIngredient, normalizeIngredientName as normalizeName } from '@/lib/ingredientMatch'

/** 레시피가 말풍선 재료를 재료 목록·조리 단계에서 사용하는지 */
export function recipeUsesBubbleIngredient(recipe: Recipe, bubbleName: string): boolean {
  const normalizedBubble = normalizeIngredientName(bubbleName)
  if (!normalizedBubble) return false

  const ingredients = normalizeRecipeIngredients(recipe.ingredients)
  if (ingredients.some((item) => ingredientsMatch(normalizedBubble, item.name))) {
    return true
  }

  const body = [
    recipe.title ?? '',
    recipe.description ?? '',
    ...normalizeRecipeSteps(recipe.steps).map((step) => step.text),
  ].join('\n')

  return textMentionsIngredient(body, normalizedBubble)
}

export function matchRecipe(recipe: Recipe, available: Set<string>): RecipeMatch {
  const ingredients = normalizeRecipeIngredients(recipe.ingredients)
  const required = ingredients.filter((i) => !i.isOptional)
  const optional = ingredients.filter((i) => i.isOptional)

  const matchedRequired = required.filter((i) => hasMatchedIngredient(available, i.name))
  const matchedOptional = optional.filter((i) => hasMatchedIngredient(available, i.name))
  const missingRequired = required
    .filter((i) => !hasMatchedIngredient(available, i.name))
    .map((i) => i.name)

  const requiredCount = required.length || 1
  const baseScore = (matchedRequired.length / requiredCount) * 100
  const bonus = optional.length > 0 ? (matchedOptional.length / optional.length) * 10 : 0
  const matchScore = Math.min(100, Math.round(baseScore + bonus))

  let tier: RecipeMatch['tier'] = 'other'
  if (matchScore >= 70) tier = 'ready'
  else if (matchScore >= 40) tier = 'almost'

  return {
    recipe,
    matchScore,
    matchedIngredients: [...matchedRequired, ...matchedOptional].map((i) => i.name),
    missingIngredients: missingRequired,
    tier,
  }
}

export function getAvailableNames(ingredients: Ingredient[]) {
  return new Set(ingredients.map((i) => normalizeIngredientName(i.name)))
}

/** 말풍선에 담긴 재료 이름이 레시피에 몇 개 매칭되는지 */
export function countBubbleIngredientHits(recipe: Recipe, selected: Ingredient[]): number {
  let hits = 0
  for (const ingredient of selected) {
    if (recipeUsesBubbleIngredient(recipe, ingredient.name)) hits++
  }
  return hits
}

/** 말풍선에 담긴 재료를 레시피가 전부 포함하는지 */
export function recipeIncludesAllBubbleIngredients(
  recipe: Recipe,
  selected: Ingredient[],
): boolean {
  if (selected.length === 0) return false
  return countBubbleIngredientHits(recipe, selected) === selected.length
}

/** 말풍선 재료 전부를 사용하는 레시피만 추천 */
export function recommendRecipesForSelection(
  recipes: Recipe[],
  selected: Ingredient[],
): RecipeMatch[] {
  if (selected.length === 0) return []

  const selectedNames = getAvailableNames(selected)
  return recipes
    .map((recipe) => matchRecipe(recipe, selectedNames))
    .filter((m) => recipeIncludesAllBubbleIngredients(m.recipe, selected))
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function getExpiringSoon(ingredients: Ingredient[], days = 3) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const threshold = new Date(now)
  threshold.setDate(threshold.getDate() + days)

  return ingredients.filter((i) => {
    if (!i.expiryDate) return false
    const expiry = new Date(i.expiryDate)
    expiry.setHours(0, 0, 0, 0)
    return expiry <= threshold
  })
}

export function getExpiryStatus(expiryDate?: string): 'expired' | 'soon' | 'ok' | null {
  if (!expiryDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 3) return 'soon'
  return 'ok'
}

/** 유통기한 표시용 — yy-mm-dd (숫자 6자) */
export function formatExpiryDisplay(expiryDate: string): string {
  const iso = expiryDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1].slice(-2)}-${iso[2]}-${iso[3]}`

  const d = new Date(expiryDate)
  if (Number.isNaN(d.getTime())) return expiryDate

  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
