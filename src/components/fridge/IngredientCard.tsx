import { formatExpiryDisplay, getExpiryStatus } from '@/lib/recommend'
import { requestIngredientRecipes } from '@/lib/ingredientActions'
import type { Ingredient } from '@/types'
import { INGREDIENT_CARD_SIZE } from '@/types'
import { AlertTriangle, Clock } from 'lucide-react'

interface IngredientCardProps {
  ingredient: Ingredient
  onClick?: () => void
  onLongPress?: (ingredient: Ingredient) => void
  compact?: boolean
  mini?: boolean
  banner?: boolean
  highlighted?: boolean
  asDiv?: boolean
}

const { compactWidth, compactHeight } = INGREDIENT_CARD_SIZE
const BANNER_WIDTH = 92
const BANNER_HEIGHT = 90

const INGREDIENT_COLOR_GROUPS = [
  {
    className: 'border-pink-200 bg-pink-50',
    keywords: [
      '소고기',
      '쇠고기',
      '돼지고기',
      '삼겹살',
      '목살',
      '닭고기',
      '닭가슴살',
      '닭다리살',
      '고기',
      '생선',
      '고등어',
      '오징어',
      '연어',
      '참치',
      '새우',
      '바지락',
      '해산물',
    ],
  },
  {
    className: 'border-orange-200 bg-orange-50',
    keywords: ['두부', '순두부', '연두부', '계란', '달걀', '어묵', '오뎅', '햄', '소시지', '치즈', '유부'],
  },
  {
    className: 'border-stone-300 bg-stone-100',
    keywords: [
      '소스',
      '오일',
      '올리브오일',
      '식용유',
      '참기름',
      '들기름',
      '양념',
      '간장',
      '국간장',
      '고추장',
      '된장',
      '쌈장',
      '고춧가루',
      '설탕',
      '소금',
      '후추',
      '식초',
      '케첩',
      '마요네즈',
      '액젓',
      '카레',
    ],
  },
  {
    className: 'border-orange-300 bg-orange-100',
    keywords: ['김치', '배추김치', '묵은지', '신김치', '장아찌', '단무지', '나물', '무침', '젓갈', '피클'],
  },
  {
    className: 'border-lime-200 bg-lime-50',
    keywords: [
      '상추',
      '양상추',
      '샐러드',
      '채소',
      '야채',
      '배추',
      '양배추',
      '대파',
      '쪽파',
      '양파',
      '마늘',
      '감자',
      '고구마',
      '당근',
      '오이',
      '토마토',
      '호박',
      '애호박',
      '가지',
      '버섯',
      '콩나물',
      '무',
      '깻잎',
      '파프리카',
      '고추',
    ],
  },
  {
    className: 'border-sky-200 bg-sky-50',
    keywords: ['라면', '만두', '간편식', '즉석', '냉동식품', '밀키트', '떡', '떡볶이떡', '떡국떡', '유부초밥'],
  },
] as const

function normalizeIngredientName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '')
}

function getIngredientColorClass(name: string) {
  const normalized = normalizeIngredientName(name)
  const group = INGREDIENT_COLOR_GROUPS.find(({ keywords }) =>
    keywords.some((keyword) => {
      const normalizedKeyword = normalizeIngredientName(keyword)
      return normalized === normalizedKeyword || normalized.includes(normalizedKeyword)
    }),
  )
  return group?.className ?? 'border-gray-100 bg-white'
}

export function IngredientCard({
  ingredient,
  onClick,
  onLongPress,
  compact,
  mini,
  banner,
  highlighted,
  asDiv,
}: IngredientCardProps) {
  const expiryStatus = getExpiryStatus(ingredient.expiryDate)
  const Tag = asDiv ? 'div' : 'button'
  const colorClass = getIngredientColorClass(ingredient.name)
  const handleLongPress = (item: Ingredient) => {
    if (onLongPress) onLongPress(item)
    else requestIngredientRecipes(item.id)
  }

  return (
    <Tag
      type={asDiv ? undefined : 'button'}
      onClick={asDiv ? undefined : onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-yeodong-ingredient-id', ingredient.id)
        e.dataTransfer.setData('text/plain', ingredient.id)
        e.dataTransfer.effectAllowed = 'copyMove'
      }}
      onDoubleClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleLongPress(ingredient)
      }}
      style={
        compact
          ? { width: compactWidth, height: compactHeight, minWidth: compactWidth, maxWidth: compactWidth }
          : banner
            ? {
                width: BANNER_WIDTH,
                height: BANNER_HEIGHT,
                minWidth: BANNER_WIDTH,
                maxWidth: BANNER_WIDTH,
              }
            : undefined
      }
      className={`group relative flex shrink-0 grow-0 flex-col items-stretch overflow-hidden text-left ${
        banner
          ? `rounded-lg shadow-sm ${colorClass}`
          : `rounded-xl border shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${colorClass}`
      } ${
        highlighted
          ? 'z-10 border-red-500 ring-[3px] ring-red-400 ring-offset-1'
          : !banner &&
              (expiryStatus === 'expired'
                ? 'border-red-300'
                : expiryStatus === 'soon'
                  ? 'border-amber-300'
                  : '')
      } ${
        mini
          ? 'min-w-[56px] max-w-[64px] p-1'
          : banner
            ? 'box-border p-1.5'
            : compact
              ? 'box-border p-1'
              : 'w-full p-3'
      }`}
    >
      <span
        className={`block w-full shrink-0 truncate font-medium text-gray-800 ${
          mini
            ? 'px-0.5 text-[10px] leading-tight'
            : banner
              ? 'text-[11px] font-semibold leading-tight'
              : compact
                ? 'text-[10px] leading-tight'
                : ''
        }`}
      >
        {ingredient.name}
      </span>
      {!banner && (
        <span
          className={`block w-full shrink-0 truncate text-gray-500 ${
            mini ? 'px-0.5 text-[9px] leading-tight' : compact ? 'text-[9px] leading-tight' : 'mt-0.5 text-xs'
          }`}
        >
          {ingredient.quantity}
          {ingredient.unit}
        </span>
      )}
      {ingredient.expiryDate && !mini && (
        <span
          className={`flex w-full shrink-0 items-center gap-0.5 truncate ${
            banner ? 'text-[10px]' : compact ? 'text-[8px]' : 'text-[10px]'
          } ${
            expiryStatus === 'expired'
              ? 'text-red-600'
              : expiryStatus === 'soon'
                ? 'text-amber-600'
                : 'text-gray-400'
          }`}
        >
          {expiryStatus === 'expired' ? (
            <AlertTriangle size={banner ? 10 : compact ? 8 : 10} className="shrink-0" />
          ) : expiryStatus === 'soon' ? (
            <Clock size={banner ? 10 : compact ? 8 : 10} className="shrink-0" />
          ) : null}
          <span className="truncate">{formatExpiryDisplay(ingredient.expiryDate)}</span>
        </span>
      )}
      {ingredient.imageUrl ? (
        <img
          src={ingredient.imageUrl}
          alt=""
          className={`mt-auto w-full shrink-0 object-cover ${
            mini
              ? 'mt-0.5 h-8'
              : banner
                ? 'h-10 rounded-md'
                : compact
                  ? 'mt-0.5 h-7'
                  : 'mt-2 h-24'
          }`}
        />
      ) : (
        banner && <div className="mt-auto h-10 shrink-0" aria-hidden />
      )}
    </Tag>
  )
}
