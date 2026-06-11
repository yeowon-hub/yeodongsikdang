import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { FridgeInterior, getFridgeFrameStyle } from './FridgeInterior'
import { IngredientForm } from './IngredientForm'
import { CompartmentSwipeView } from '@/components/shared/CompartmentSwipeView'
import { useIngredients } from '@/hooks/useIngredients'
import type { ColdStorageLocation, FridgeUnitId, Ingredient } from '@/types'
import { FRIDGE_UNITS, STORAGE_META } from '@/types'

const PAGE_BG: Record<FridgeUnitId, string> = {
  general: 'bg-fridge',
  kimchi: 'bg-gradient-to-b from-amber-50/90 to-orange-50/50',
}

interface FrenchDoorFridgeViewProps {
  unitId: FridgeUnitId
}

export function FrenchDoorFridgeView({ unitId }: FrenchDoorFridgeViewProps) {
  const unit = FRIDGE_UNITS.find((u) => u.id === unitId)!
  const freezerLoc = unit.compartments[0].location
  const fridgeLoc = unit.compartments[1].location

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | undefined>()
  const [activeCompartment, setActiveCompartment] = useState(0)

  const { ingredients, addIngredient, updateIngredient, deleteIngredient, moveIngredient } =
    useIngredients()

  const byLocation = useMemo(() => {
    const items = ingredients.filter(
      (i) => i.location === freezerLoc || i.location === fridgeLoc,
    )
    return {
      [freezerLoc]: items.filter((i) => i.location === freezerLoc),
      [fridgeLoc]: items.filter((i) => i.location === fridgeLoc),
    } as Record<ColdStorageLocation, Ingredient[]>
  }, [ingredients, freezerLoc, fridgeLoc])

  const handleSubmit = async (data: Parameters<typeof addIngredient>[0]) => {
    if (editing) {
      await updateIngredient(editing.id, data)
    } else {
      await addIngredient(data)
    }
    setEditing(undefined)
  }

  const defaultAddLocation: ColdStorageLocation =
    activeCompartment === 0 ? freezerLoc : fridgeLoc

  const compartments = unit.compartments.map((comp) => ({
    ...comp,
    kind: STORAGE_META[comp.location].kind as 'fridge' | 'freezer',
  }))

  const slides = compartments.map((comp) => ({
    id: comp.location,
    label: comp.shortLabel,
    content: (
      <FridgeInterior
        location={comp.location}
        ingredients={byLocation[comp.location]}
        onIngredientClick={(ing) => {
          setEditing(ing)
          setFormOpen(true)
        }}
      />
    ),
  }))

  const activeKind = compartments[activeCompartment]?.kind ?? 'fridge'

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${PAGE_BG[unitId]}`}>
      <div className="shrink-0 px-4 pb-2 pt-2">
        <h2 className="text-base font-bold text-gray-800">{unit.label}</h2>
        <p className="text-[11px] text-gray-500">좌우로 밀어 냉동실·냉장실을 바꿔요</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        <CompartmentSwipeView
          initialIndex={activeCompartment}
          onIndexChange={setActiveCompartment}
          slides={slides}
          frameStyle={getFridgeFrameStyle(activeKind)}
        />
      </div>

      {!formOpen && (
        <button
          type="button"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:bg-brand-dark active:scale-95"
          aria-label="재료 추가"
        >
          <Plus size={28} />
        </button>
      )}

      <IngredientForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(undefined)
        }}
        onSubmit={handleSubmit}
        onDelete={editing ? () => deleteIngredient(editing.id) : undefined}
        onMove={editing ? (loc) => moveIngredient(editing.id, loc) : undefined}
        initial={editing}
        defaultLocation={editing?.location ?? defaultAddLocation}
      />
    </div>
  )
}
