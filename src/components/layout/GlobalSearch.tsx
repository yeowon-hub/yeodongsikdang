import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useIngredients } from '@/hooks/useIngredients'
import { useRecipes } from '@/hooks/useRecipes'
import { getLocationRoute, getRecipeRoute } from '@/lib/navigation'
import { STORAGE_META } from '@/types'

function normalizeQuery(q: string) {
  return q.trim().toLowerCase()
}

interface GlobalSearchProps {
  /** PDF 헤더 검색창 위에 투명 오버레이 */
  overlay?: boolean
}

export function GlobalSearch({ overlay = false }: GlobalSearchProps) {
  const navigate = useNavigate()
  const { ingredients } = useIngredients()
  const { recipes } = useRecipes()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const results = useMemo(() => {
    const q = normalizeQuery(query)
    if (!q) return []

    const ingHits = ingredients
      .filter((i) => i.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map((i) => ({
        type: 'ingredient' as const,
        id: i.id,
        title: i.name,
        subtitle: STORAGE_META[i.location].label,
        route: getLocationRoute(i.location),
      }))

    const recipeHits = (recipes ?? [])
      .filter((r) => r.title.toLowerCase().includes(q))
      .slice(0, 8)
      .map((r) => ({
        type: 'recipe' as const,
        id: r.id,
        title: r.title,
        subtitle: r.category ?? '레시피',
        route: getRecipeRoute(r.id),
      }))

    return [...ingHits, ...recipeHits].slice(0, 12)
  }, [ingredients, recipes, query])

  const showDropdown = open && query.trim().length > 0

  const handleSelect = (route: string) => {
    setQuery('')
    setOpen(false)
    navigate(route)
  }

  return (
    <div className={overlay ? 'relative h-full w-full' : 'relative min-w-0 flex-1'}>
      <div
        className={
          overlay
            ? 'flex h-full items-center px-2.5'
            : 'flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-white/80'
        }
      >
        {!overlay && <Search size={16} className="shrink-0 text-gray-400" />}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current)
            setOpen(true)
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150)
          }}
          placeholder={overlay ? '' : '재료·레시피 검색'}
          className={
            overlay
              ? 'min-w-0 flex-1 bg-transparent text-xs text-gray-700 focus:outline-none'
              : 'min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none'
          }
          aria-label="재료·레시피 검색"
          enterKeyHint="search"
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQuery('')}
            className="shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="검색어 지우기"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-gray-500">검색 결과가 없어요</p>
          ) : (
            results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item.route)}
                className="flex w-full flex-col items-start px-3 py-2.5 text-left hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-800">{item.title}</span>
                <span className="text-[11px] text-gray-500">
                  {item.type === 'ingredient' ? `재료 · ${item.subtitle}` : `레시피 · ${item.subtitle}`}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
