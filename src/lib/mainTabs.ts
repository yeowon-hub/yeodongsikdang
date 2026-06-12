import type { FridgeUnitId } from '@/types'

import { HOME_TILE_BG, STORAGE_INTERIOR } from '@/lib/storageDesignSpec'

export const MAIN_TABS = [
  { path: '/fridge/general', label: '일반', theme: HOME_TILE_BG.general },
  { path: '/fridge/kimchi', label: '김치', theme: HOME_TILE_BG.kimchi },
  { path: '/home', label: '홈', theme: '#FFFFFF' },
  { path: '/shelf', label: '선반', theme: HOME_TILE_BG.shelf },
  { path: '/pantry', label: '펜트리', theme: HOME_TILE_BG.pantry },
] as const

export type MainTabPath = (typeof MAIN_TABS)[number]['path']

export function isMainTabPath(pathname: string) {
  return getMainTabIndex(pathname) !== null
}

export function getMainTabIndex(pathname: string): number | null {
  const idx = MAIN_TABS.findIndex((tab) =>
    tab.path === '/home' ? pathname === '/home' : pathname.startsWith(tab.path),
  )
  return idx === -1 ? null : idx
}

export function getMainTabTheme(pathname: string) {
  const idx = getMainTabIndex(pathname)
  return idx !== null ? MAIN_TABS[idx].theme : '#FFFFFF'
}

/** 냉장고 유닛별 내부·프레임 색 */
export const FRIDGE_UNIT_THEMES: Record<FridgeUnitId, { bg: string; border: string }> = {
  general: STORAGE_INTERIOR.general,
  kimchi: STORAGE_INTERIOR.kimchi,
}

export function getFridgeUnitTheme(unitId: FridgeUnitId) {
  return FRIDGE_UNIT_THEMES[unitId]
}

export const STORAGE_PAGE_THEMES = {
  shelf: STORAGE_INTERIOR.shelf,
  pantry: STORAGE_INTERIOR.pantry,
} as const

export function getStoragePageTheme(kind: keyof typeof STORAGE_PAGE_THEMES) {
  return STORAGE_PAGE_THEMES[kind]
}

export function getAdjacentMainTabPath(pathname: string, direction: 'prev' | 'next') {
  const idx = getMainTabIndex(pathname)
  if (idx === null) return null
  const next = direction === 'next' ? idx + 1 : idx - 1
  if (next < 0 || next >= MAIN_TABS.length) return null
  return MAIN_TABS[next].path
}
