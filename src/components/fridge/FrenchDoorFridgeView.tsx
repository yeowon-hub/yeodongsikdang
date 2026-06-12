import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { FridgeInterior, getFridgeFrameStyle } from './FridgeInterior'
import { IngredientForm } from './IngredientForm'
import { CompartmentSwipeView } from '@/components/shared/CompartmentSwipeView'
import { StoragePageShell } from '@/components/storage/StoragePageShell'
import { useIngredients } from '@/hooks/useIngredients'
import type { ColdStorageLocation, FridgeUnitId, Ingredient } from '@/types'
import { FRIDGE_UNITS } from '@/types'

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

  const compartments = unit.compartments

  const slides = compartments.map((comp) => ({
    id: comp.location,
    label: comp.shortLabel,
    content: (
      <FridgeInterior
        unitId={unitId}
        location={comp.location}
        ingredients={byLocation[comp.location]}
        onIngredientClick={(ing) => {
          setEditing(ing)
          setFormOpen(true)
        }}
      />
    ),
  }))

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <StoragePageShell designId={unitId}>
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
          <CompartmentSwipeView
            initialIndex={activeCompartment}
            onIndexChange={setActiveCompartment}
            slides={slides}
            frameClassName="rounded-[22px] shadow-md"
            frameStyle={getFridgeFrameStyle(unitId)}
          />
        </div>
      </StoragePageShell>

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
