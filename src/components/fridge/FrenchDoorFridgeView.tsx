import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { getFridgeFrameStyle } from './FridgeInterior'
import { getFridgeUnitTheme } from '@/lib/mainTabs'
import { IngredientForm } from './IngredientForm'
import { LevelStackInterior } from '@/components/shared/LevelStackInterior'
import { StoragePageShell } from '@/components/storage/StoragePageShell'
import { useIngredients } from '@/hooks/useIngredients'
import type { ColdStorageLocation, FridgeUnitId, Ingredient } from '@/types'
import { FRIDGE_UNITS } from '@/types'

interface FrenchDoorFridgeViewProps {
  unitId: FridgeUnitId
}

export function FrenchDoorFridgeView({ unitId }: FrenchDoorFridgeViewProps) {
  const unit = FRIDGE_UNITS.find((u) => u.id === unitId)!
  const compartments = unit.compartments
  const freezerLoc = compartments[0].location
  const fridgeLoc = compartments[1].location

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

  const activeLocation = compartments[activeCompartment].location
  const activeIngredients = byLocation[activeLocation]
  const activeLabel = activeCompartment === 0 ? '냉동' : '냉장'

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

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <StoragePageShell designId={unitId}>
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] shadow-md"
            style={getFridgeFrameStyle(unitId)}
          >
            <LevelStackInterior
              ingredients={activeIngredients}
              onIngredientClick={(ing) => {
                setEditing(ing)
                setFormOpen(true)
              }}
              theme={getFridgeUnitTheme(unitId)}
              levelLabel="단"
              topSelector={{
                options: [
                  { value: 0, label: '냉동' },
                  { value: 1, label: '냉장' },
                ],
                value: activeCompartment,
                onChange: setActiveCompartment,
              }}
              emptyMessage={`${activeLabel}이 비어있어요.\n+ 버튼으로 재료를 추가해보세요!`}
              dividerVariant="metal"
            />
          </div>
        </div>
      </StoragePageShell>

      {!formOpen && (
        <button
          type="button"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-header text-header-text shadow-lg hover:bg-header-dark active:scale-95"
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
