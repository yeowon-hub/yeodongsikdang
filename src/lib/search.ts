/** 검색어·대상 텍스트 정규화 (공백 제거, 소문자) */
export function normalizeSearchText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, '')
}

/** 부분 문자열 포함 여부 (시작 위치 무관) */
export function matchesSearchText(text: string, query: string): boolean {
  const q = normalizeSearchText(query)
  if (!q) return false
  return normalizeSearchText(text).includes(q)
}
