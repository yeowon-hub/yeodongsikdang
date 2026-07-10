/**
 * 재료카드 이름 ↔ 레시피 재료 이름 매칭
 * - 동의어(달걀/계란 등)를 같은 재료로 처리
 * - 부위명(삼겹살/목살 등)을 상위 재료(돼지고기)와 매칭
 */

export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '')
}

/** 같은 재료로 취급할 이름 묶음 (첫 항목이 대표 이름) */
export const INGREDIENT_ALIAS_GROUPS: readonly (readonly string[])[] = [
  ['달걀', '계란', '유정란', '왕란', '깐달걀', '흰달걀'],
  [
    '돼지고기',
    '삼겹살',
    '목살',
    '목심',
    '앞다리',
    '앞다리살',
    '뒤다리',
    '뒤다리살',
    '등심',
    '안심',
    '갈비',
    '돼지갈비',
    '갈비살',
    '항정살',
    '가브리살',
    '제육용',
    '수육용',
    '족발용',
    '앞고기',
    '뒷고기',
  ],
  [
    '소고기',
    '소등심',
    '소안심',
    '소목심',
    '소갈비',
    '양지',
    '사태',
    '우둔',
    '채끝',
    '불고기용',
    '국거리용',
  ],
  ['닭고기', '닭', '닭다리', '닭가슴살', '닭안심', '닭볶음탕용', '닭다리살'],
  ['대파', '파', '쪽파', '실파', '청파', '다진파'],
  ['마늘', '다진마늘', '편마늘', '통마늘'],
  ['양파', '다진양파'],
  ['두부', '순두부', '연두부', '부침두부', '찌개두부'],
  ['우유'],
  ['버터'],
  ['치즈', '모짜렐라', '체다치즈', '슬라이스치즈'],
  ['쌀', '밥', '쌀밥', '백미'],
  ['면', '국수', '소면', '중면', '파스타', '스파게티면', '라면'],
  ['고추', '청양고추', '홍고추', '꽈리고추', '고춧가루'],
  ['감자'],
  ['당근'],
  ['시금치'],
  ['배추', '얼갈이', '배추김치'],
  ['김치', '포기김치', '총각김치'],
  ['참기름'],
  ['간장', '진간장', '국간장'],
  ['식용유', '포도씨유', '카놀라유', '올리브오일'],
]

function aliasMatchesName(alias: string, name: string): boolean {
  const normalizedAlias = normalizeIngredientName(alias)
  const normalizedName = normalizeIngredientName(name)
  if (!normalizedAlias || !normalizedName) return false
  return (
    normalizedName === normalizedAlias ||
    normalizedName.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedName)
  )
}

function findAliasGroupIndexes(name: string): Set<number> {
  const indexes = new Set<number>()
  INGREDIENT_ALIAS_GROUPS.forEach((group, index) => {
    if (group.some((alias) => aliasMatchesName(alias, name))) {
      indexes.add(index)
    }
  })
  return indexes
}

/** 두 재료 이름이 동일·동의어·부위-상위재료 관계인지 판별 */
export function ingredientsMatch(nameA: string, nameB: string): boolean {
  if (aliasMatchesName(nameA, nameB)) return true

  const groupsA = findAliasGroupIndexes(nameA)
  const groupsB = findAliasGroupIndexes(nameB)
  for (const index of groupsA) {
    if (groupsB.has(index)) return true
  }
  return false
}

/** 보유 재료 목록에 레시피 재료가 있는지 확인 */
export function hasMatchedIngredient(available: Set<string>, required: string): boolean {
  for (const item of available) {
    if (ingredientsMatch(item, required)) return true
  }
  return false
}

/** 재료카드/레시피 이름을 대표 이름으로 변환 (표시·디버그용) */
export function canonicalIngredientName(name: string): string {
  for (const group of INGREDIENT_ALIAS_GROUPS) {
    if (group.some((alias) => aliasMatchesName(alias, name))) {
      return group[0]
    }
  }
  return name.trim()
}

/** 조리법·설명 문장에 재료(동의어·부위명 포함)가 언급됐는지 */
export function textMentionsIngredient(text: string, ingredientName: string): boolean {
  const haystack = normalizeIngredientName(text)
  if (!haystack) return false

  const direct = normalizeIngredientName(ingredientName)
  if (direct.length >= 2 && haystack.includes(direct)) return true

  for (const group of INGREDIENT_ALIAS_GROUPS) {
    if (!group.some((alias) => aliasMatchesName(alias, ingredientName))) continue
    for (const alias of group) {
      const normalizedAlias = normalizeIngredientName(alias)
      if (normalizedAlias.length >= 2 && haystack.includes(normalizedAlias)) {
        return true
      }
    }
  }

  return false
}
