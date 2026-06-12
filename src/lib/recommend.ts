import type { Ingredient, Recipe, RecipeMatch } from '@/types'

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '')
}

function hasIngredient(available: Set<string>, required: string) {
  const normalized = normalizeName(required)
  if (available.has(normalized)) return true

  for (const item of available) {
    if (item.includes(normalized) || normalized.includes(item)) return true
  }
  return false
}

export function getAvailableNames(ingredients: Ingredient[]) {
  return new Set(ingredients.map((i) => normalizeName(i.name)))
}

export function matchRecipe(recipe: Recipe, available: Set<string>): RecipeMatch {
  const required = recipe.ingredients.filter((i) => !i.isOptional)
  const optional = recipe.ingredients.filter((i) => i.isOptional)

  const matchedRequired = required.filter((i) => hasIngredient(available, i.name))
  const matchedOptional = optional.filter((i) => hasIngredient(available, i.name))
  const missingRequired = required
    .filter((i) => !hasIngredient(available, i.name))
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

export function recommendRecipes(recipes: Recipe[], ingredients: Ingredient[]): RecipeMatch[] {
  const available = getAvailableNames(ingredients)
  return recipes
    .map((recipe) => matchRecipe(recipe, available))
    .filter((m) => m.matchScore > 0)
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
