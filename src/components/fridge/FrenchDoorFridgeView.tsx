import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getFridgeFrameStyle } from './FridgeInterior'
import { getFridgeUnitTheme } from '@/lib/mainTabs'
import { IngredientForm } from './IngredientForm'
import { LevelStackInterior } from '@/components/shared/LevelStackInterior'
import { StoragePageShell } from '@/components/storage/StoragePageShell'
import { useSuppressGlobalAddFab } from '@/contexts/GlobalAddFabContext'
import { useIngredients } from '@/hooks/useIngredients'
import type { ColdStorageLocation, FridgeUnitId, Ingredient } from '@/types'
import { FRIDGE_UNITS } from '@/types'
import { parseCompartmentIndex, parseLevelIndex } from '@/lib/navigation'
import { requestIngredientRecipes } from '@/lib/ingredientActions'

interface FrenchDoorFridgeViewProps {
  unitId: FridgeUnitId
}

export function FrenchDoorFridgeView({ unitId }: FrenchDoorFridgeViewProps) {
  const unit = FRIDGE_UNITS.find((u) => u.id === unitId)!
  const compartments = unit.compartments
  const freezerLoc = compartments[0].location
  const fridgeLoc = compartments[1].location

  const [searchParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | undefined>()
  useSuppressGlobalAddFab(formOpen)
  const [activeCompartment, setActiveCompartment] = useState<number>(() => {
    return parseCompartmentIndex(searchParams.get('compartment')) ?? 1
  })
  const focusLevel = parseLevelIndex(searchParams.get('level'))
  const focusIngredientId = searchParams.get('ingredient') ?? undefined

  const { ingredients, addIngredient, updateIngredient, deleteIngredient, moveIngredient, moveIngredientToLevel } =
    useIngredients()

  useEffect(() => {
    const fromParam = parseCompartmentIndex(searchParams.get('compartment'))
    if (fromParam !== null) {
      setActiveCompartment(fromParam)
      return
    }

    if (!focusIngredientId) return
    const target = ingredients.find((i) => i.id === focusIngredientId)
    if (!target) return
    const idx = compartments.findIndex((c) => c.location === target.location)
    if (idx >= 0) setActiveCompartment(idx)
  }, [searchParams, unitId, focusIngredientId, ingredients, compartments])

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

  const handleBatchSubmit = async (items: Parameters<typeof addIngredient>[0][]) => {
    for (const item of items) {
      await addIngredient(item)
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
              onIngredientLongPress={(ing) => requestIngredientRecipes(ing.id)}
              onIngredientMoveToLevel={(id, level) => moveIngredientToLevel(id, level)}
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
              focusLevel={focusLevel}
              focusIngredientId={focusIngredientId}
              emptyMessage={`${activeLabel}이 비어있어요.\n추가하기 버튼으로 재료를 추가해보세요!`}
              dividerVariant="metal"
            />
          </div>
        </div>
      </StoragePageShell>

      <IngredientForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(undefined)
        }}
        onSubmit={handleSubmit}
        onSubmitBatch={handleBatchSubmit}
        onDelete={editing ? () => deleteIngredient(editing.id) : undefined}
        onMove={editing ? (loc) => moveIngredient(editing.id, loc) : undefined}
        initial={editing}
        defaultLocation={editing?.location ?? defaultAddLocation}
      />
    </div>
  )
}
