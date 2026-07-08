import type { Ingredient, Recipe, RecipeMatch } from '@/types'

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '')
}

const SUBSTITUTE_GROUPS = [
  ['닭고기', '닭가슴살', '닭다리살', '닭안심', '닭'],
  ['돼지고기', '삼겹살', '목살', '앞다리살', '뒷다리살', '다짐육'],
  ['소고기', '쇠고기', '불고기용소고기', '차돌박이', '양지'],
  ['김치', '배추김치', '묵은지', '신김치'],
  ['대파', '쪽파', '실파'],
  ['양파', '적양파'],
  ['감자', '고구마'],
  ['애호박', '주키니', '호박'],
  ['버섯', '표고버섯', '느타리버섯', '양송이버섯', '새송이버섯', '팽이버섯'],
  ['상추', '양상추', '깻잎', '샐러드채소', '채소'],
  ['토마토', '방울토마토'],
  ['오이', '피클'],
  ['두부', '순두부', '연두부'],
  ['계란', '달걀'],
  ['참치', '참치캔'],
  ['어묵', '오뎅'],
  ['라면', '우동면', '칼국수면', '소면', '국수', '파스타면', '스파게티면'],
  ['떡', '떡국떡', '떡볶이떡'],
  ['밥', '즉석밥', '찬밥'],
  ['고추장', '쌈장'],
  ['된장', '쌈장'],
  ['간장', '국간장', '진간장', '양조간장'],
  ['고춧가루', '청양고추', '고추'],
  ['마늘', '다진마늘'],
  ['치즈', '슬라이스치즈', '모짜렐라치즈'],
  ['우유', '생크림', '두유'],
].map((group) => group.map(normalizeName))

function getSubstitutes(name: string) {
  const normalized = normalizeName(name)
  const group = SUBSTITUTE_GROUPS.find((items) =>
    items.some((item) => item === normalized || item.includes(normalized) || normalized.includes(item)),
  )
  return group ?? [normalized]
}

function findMatchingIngredient(available: Set<string>, required: string) {
  const normalized = normalizeName(required)
  if (available.has(normalized)) return true

  const candidates = getSubstitutes(required)
  for (const candidate of candidates) {
    for (const item of available) {
      if (item === candidate || item.includes(candidate) || candidate.includes(item)) {
        return item
      }
    }
  }
  return null
}

function hasIngredient(available: Set<string>, required: string) {
  return Boolean(findMatchingIngredient(available, required))
}

export function getAvailableNames(ingredients: Ingredient[]) {
  return new Set(ingredients.map((i) => normalizeName(i.name)))
}

export function recipeUsesIngredient(recipe: Recipe, ingredientName: string) {
  const available = new Set([normalizeName(ingredientName)])
  return recipe.ingredients.some((ingredient) => hasIngredient(available, ingredient.name))
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
