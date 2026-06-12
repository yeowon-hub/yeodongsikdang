/** 홈 타일 배경색(index.css --color-tile-*) — 하단 탭·홈 타일용 */
export const HOME_TILE_BG = {
  general: '#D6E4F5',
  kimchi: '#F5E6A8',
  shelf: '#E8D4BC',
  pantry: '#B8A99A',
} as const

/** 보관함 페이지 바탕 (타일 색과 분리) */
export const STORAGE_PAGE_BG = '#FFFFFF'

/**
 * 냉장고·선반·펜트리 저장 영역 색 (index.css --color-fridge 등과 동기화)
 */
export const STORAGE_INTERIOR = {
  general: { bg: '#E3ECFF', border: '#B8C8E8' },
  kimchi: { bg: '#FBFCCE', border: '#D8D9A8' },
  shelf: { bg: '#E4D4C4', border: '#C9B5A8' },
  pantry: { bg: '#CCB7AC', border: '#A89488' },
} as const

/** 홈 타일에서 추출한 글자만 (배경 투명) */
export const STORAGE_TITLE_WORD = {
  general: '/assets/storage/general/title-word.png',
  kimchi: '/assets/storage/kimchi/title-word.png',
  shelf: '/assets/storage/shelf/title-word.png',
  pantry: '/assets/storage/pantry/title-word.png',
} as const

export const STORAGE_CARD_RADIUS = 28
export const STORAGE_CARD_SHADOW_FLEX = 8
export const STORAGE_SUBNAV_FLEX = 32

export const STORAGE_CARD_INSET = {
  left: 7.2,
  width: 85.6,
} as const

export const STORAGE_SHELF_DIVIDER =
  'linear-gradient(180deg, #d9cfcf 0%, #d7cccc 45%, #c9bfbf 100%)'

export const STORAGE_CARD_SHADOW_GRADIENT =
  'linear-gradient(180deg, #c0c0c0 0%, #c3c3c3 12.5%, #cacaca 25%, #d5d5d5 37.5%, #e4e4e4 50%, #f0f0f0 62.5%, #f9f9f9 75%, #fefefe 87.5%, #ffffff 100%)'

export type StorageDesignId = 'general' | 'kimchi' | 'shelf' | 'pantry'

export type StorageDesignTheme = {
  id: StorageDesignId
  pageBg: string
  cardBg: string
  cardBorder: string
  titleWordSrc: string
  titleAlt: string
}

export const STORAGE_DESIGNS: Record<StorageDesignId, StorageDesignTheme> = {
  general: {
    id: 'general',
    pageBg: STORAGE_PAGE_BG,
    cardBg: STORAGE_INTERIOR.general.bg,
    cardBorder: STORAGE_INTERIOR.general.border,
    titleWordSrc: STORAGE_TITLE_WORD.general,
    titleAlt: 'FRIDGE',
  },
  kimchi: {
    id: 'kimchi',
    pageBg: STORAGE_PAGE_BG,
    cardBg: STORAGE_INTERIOR.kimchi.bg,
    cardBorder: STORAGE_INTERIOR.kimchi.border,
    titleWordSrc: STORAGE_TITLE_WORD.kimchi,
    titleAlt: 'KIMCHI',
  },
  shelf: {
    id: 'shelf',
    pageBg: STORAGE_PAGE_BG,
    cardBg: STORAGE_INTERIOR.shelf.bg,
    cardBorder: STORAGE_INTERIOR.shelf.border,
    titleWordSrc: STORAGE_TITLE_WORD.shelf,
    titleAlt: 'SHELF',
  },
  pantry: {
    id: 'pantry',
    pageBg: STORAGE_PAGE_BG,
    cardBg: STORAGE_INTERIOR.pantry.bg,
    cardBorder: STORAGE_INTERIOR.pantry.border,
    titleWordSrc: STORAGE_TITLE_WORD.pantry,
    titleAlt: 'PANTRY',
  },
}

export function getStorageDesign(id: StorageDesignId) {
  return STORAGE_DESIGNS[id]
}

export function getStorageDesignIdFromPath(pathname: string): StorageDesignId | null {
  if (pathname.startsWith('/fridge/general')) return 'general'
  if (pathname.startsWith('/fridge/kimchi')) return 'kimchi'
  if (pathname.startsWith('/shelf')) return 'shelf'
  if (pathname.startsWith('/pantry')) return 'pantry'
  return null
}

export function getStoragePageBgFromPath(pathname: string): string | null {
  const id = getStorageDesignIdFromPath(pathname)
  return id ? STORAGE_DESIGNS[id].pageBg : null
}
