import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useIngredients } from '@/hooks/useIngredients'
import { ExpiringIngredientCard } from '@/components/home/ExpiringIngredientCard'
import { IngredientForm } from '@/components/fridge/IngredientForm'
import { useSuppressGlobalAddFab } from '@/contexts/GlobalAddFabContext'
import { getExpiringSoon } from '@/lib/recommend'
import { sortByExpiry } from '@/lib/sortIngredients'
import { ASSETS } from '@/lib/assets'
import {
  HOME_BANNER_BOTTOM_PINK_FLEX,
  HOME_BANNER_FLEX,
  HOME_BANNER_RADIUS,
  HOME_BANNER_SHADOW_FLEX,
  HOME_BANNER_SHADOW_GRADIENT,
  HOME_BANNER_TOP_FLEX,
  HOME_EXPIRING_INSET,
  HOME_GAP_FLEX,
  HOME_HOTSPOTS,
  HOME_TILE_FLEX,
  homeRectStyle,
} from '@/lib/homeDesignSpec'
import type { Ingredient } from '@/types'

const NAV_HOTSPOTS = [
  { id: 'fridge', route: '/fridge/general?compartment=fridge', rect: HOME_HOTSPOTS.fridge, label: '일반 냉장고' },
  { id: 'kimchi', route: '/fridge/kimchi?compartment=fridge', rect: HOME_HOTSPOTS.kimchi, label: '김치냉장고' },
  { id: 'shelf', route: '/shelf', rect: HOME_HOTSPOTS.shelf, label: '선반' },
  { id: 'pantry', route: '/pantry', rect: HOME_HOTSPOTS.pantry, label: '펜트리' },
] as const

const bannerInsetStyle = {
  width: `${HOME_EXPIRING_INSET.width}%`,
  marginLeft: 'auto',
  marginRight: 'auto',
} as const

const pinkBlockFlex = HOME_BANNER_TOP_FLEX + HOME_BANNER_BOTTOM_PINK_FLEX

export function HomePage() {
  const { ingredients, updateIngredient, deleteIngredient, moveIngredient } = useIngredients()
  const expiring = sortByExpiry(getExpiringSoon(ingredients, 3))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | undefined>()
  useSuppressGlobalAddFab(formOpen)

  const handleSubmit = async (data: {
    name: string
    quantity: number
    unit: string
    location: Ingredient['location']
    expiryDate?: string
    shelfLevel?: number
    imageUrl?: string
  }) => {
    if (!editing) return
    await updateIngredient(editing.id, data)
    setEditing(undefined)
  }

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div
        className="relative flex w-full shrink-0 flex-col overflow-hidden"
        style={{
          ...bannerInsetStyle,
          flex: `${HOME_BANNER_FLEX} 0 0`,
          borderRadius: HOME_BANNER_RADIUS,
        }}
      >
        <div className="relative flex w-full shrink-0 flex-col" style={{ flex: `${pinkBlockFlex} 0 0` }}>
          <div className="relative w-full shrink-0" style={{ flex: `${HOME_BANNER_TOP_FLEX} 0 0` }}>
            <img
              src={ASSETS.expiringBannerTop}
              alt=""
              className="absolute inset-0 h-full w-full object-fill"
              draggable={false}
            />
          </div>

          <div
            className="relative w-full shrink-0"
            style={{ flex: `${HOME_BANNER_BOTTOM_PINK_FLEX} 0 0` }}
          >
            <img
              src={ASSETS.expiringBannerBottom}
              alt=""
              className="absolute inset-0 h-full w-full object-fill"
              draggable={false}
            />
          </div>

          {expiring.length > 0 && (
            <div
              data-inner-swipe
              className="absolute inset-0 z-10 flex items-center overflow-x-auto overscroll-x-contain px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max min-w-full gap-2.5 [justify-content:safe_center]">
                {expiring.map((ing) => (
                  <ExpiringIngredientCard
                    key={ing.id}
                    ingredient={ing}
                    onLongPress={(item) => {
                      setEditing(item)
                      setFormOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="shrink-0"
          style={{
            flex: `${HOME_BANNER_SHADOW_FLEX} 0 0`,
            background: HOME_BANNER_SHADOW_GRADIENT,
          }}
        />
      </div>

      <div className="shrink-0 bg-white" style={{ flex: `${HOME_GAP_FLEX} 0 0` }} />

      <div className="relative min-h-0" style={{ flex: `${HOME_TILE_FLEX} 0 0` }}>
        <img
          src={ASSETS.homeBody}
          alt=""
          className="absolute inset-0 h-full w-full"
          draggable={false}
        />

        {NAV_HOTSPOTS.map((spot) => (
          <Link
            key={spot.id}
            to={spot.route}
            aria-label={spot.label}
            className="absolute z-10 active:opacity-80"
            style={homeRectStyle(spot.rect)}
          />
        ))}

        <Link
          to="/recipes"
          aria-label="레시피"
          className="absolute z-10 active:opacity-80"
          style={homeRectStyle(HOME_HOTSPOTS.recipe)}
        />
      </div>

      {editing && (
        <IngredientForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
            setEditing(undefined)
          }}
          onSubmit={handleSubmit}
          onDelete={() => deleteIngredient(editing.id)}
          onMove={(loc) => moveIngredient(editing.id, loc)}
          initial={editing}
          defaultLocation={editing.location}
        />
      )}
    </div>
  )
}
