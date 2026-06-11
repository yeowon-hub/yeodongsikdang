import type { Ingredient } from '@/types'

/** 유통기한 가까운 순 (없으면 맨 아래) — 선입선출 */
export function sortByExpiry(ingredients: Ingredient[]): Ingredient[] {
  return [...ingredients].sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return a.name.localeCompare(b.name, 'ko')
    if (!a.expiryDate) return 1
    if (!b.expiryDate) return -1
    const cmp = a.expiryDate.localeCompare(b.expiryDate)
    return cmp !== 0 ? cmp : a.name.localeCompare(b.name, 'ko')
  })
}
