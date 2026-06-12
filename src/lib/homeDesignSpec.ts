import type { CSSProperties } from 'react'

/** 여동식당 홈화면.pdf (360×800) 좌표 — scripts/extract-home-assets.py 와 동기화 */
export const HOME_ARTBOARD = { w: 360, h: 800 } as const

export const HOME_BANNER_SCALE_Y = 0.4 * 1.2
/** 핑크 칸(y=108~315) 상단 30% / 하단 70% — 그림자는 CSS */
export const HOME_BANNER_TOP_COVER_RATIO = 0.3
export const HOME_BANNER_BOTTOM_COVER_RATIO = 0.7
export const HOME_BANNER_PINK_SOURCE_H = 207
export const HOME_BANNER_TOP_SOURCE_H = HOME_BANNER_PINK_SOURCE_H * HOME_BANNER_TOP_COVER_RATIO
export const HOME_BANNER_BOTTOM_PINK_SOURCE_H =
  HOME_BANNER_PINK_SOURCE_H * HOME_BANNER_BOTTOM_COVER_RATIO
export const HOME_BANNER_TOP_FLEX = 29.8
export const HOME_BANNER_BOTTOM_PINK_FLEX = 69.5
/** 타일과 동일 드롭 섀도우 (목업 y=464~472) */
export const HOME_BANNER_SHADOW_FLEX = 8
export const HOME_BANNER_FLEX =
  HOME_BANNER_TOP_FLEX + HOME_BANNER_BOTTOM_PINK_FLEX + HOME_BANNER_SHADOW_FLEX
/** 배너와 타일 사이 여백 */
export const HOME_GAP_FLEX = 14
/** 타일 영역 (y=338~728) */
export const HOME_TILE_FLEX = 390

export const HOME_BODY_FLEX = HOME_BANNER_FLEX + HOME_GAP_FLEX + HOME_TILE_FLEX
export const HOME_BODY_ASPECT = 360 / HOME_BODY_FLEX

/** PDF 배너 카드 인셋 (26~334) */
export const HOME_EXPIRING_INSET = {
  left: 7.2222,
  width: 85.5556,
} as const

export const HOME_BANNER_RADIUS = 16

/** 타일·배너 공통 하단 그림자 그라데이션 */
export const HOME_BANNER_SHADOW_GRADIENT =
  'linear-gradient(180deg, #c0c0c0 0%, #c3c3c3 12.5%, #cacaca 25%, #d5d5d5 37.5%, #e4e4e4 50%, #f0f0f0 62.5%, #f9f9f9 75%, #fefefe 87.5%, #ffffff 100%)'

export type HomeRect = {
  left: number
  top: number
  width: number
  height: number
}

/** body.png(타일) 기준 핫스팟 % */
export const HOME_HOTSPOTS = {
  fridge: { left: 7.2222, top: 0, width: 40, height: 32.3077 },
  kimchi: { left: 52.7778, top: 0, width: 40, height: 32.3077 },
  shelf: { left: 7.2222, top: 38.2051, width: 40, height: 32.0513 },
  pantry: { left: 52.7778, top: 38.2051, width: 40, height: 32.0513 },
  recipe: { left: 7.2222, top: 76.4103, width: 85.5556, height: 19.4872 },
} as const satisfies Record<string, HomeRect>

export function homeRectStyle(rect: HomeRect): CSSProperties {
  return {
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
  }
}
