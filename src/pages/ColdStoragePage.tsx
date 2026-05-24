import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { FridgeSection } from '@/components/fridge/FridgeSection'
import { IngredientForm } from '@/components/fridge/IngredientForm'
import { useIngredients } from '@/hooks/useIngredients'
import type { ColdStorageLocation, Ingredient } from '@/types'
import { COLD_STORAGE_LOCATIONS } from '@/types'

export function FridgePage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | undefined>()
  const [activeLocation, setActiveLocation] = useState<ColdStorageLocation>('fridge1')
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, moveIngredient } =
    useIngredients()

  const byLocation = useMemo(() => {
    const map: Record<ColdStorageLocation, Ingredient[]> = {
      fridge1: [],
      fridge2: [],
      freezer: [],
    }
    for (const item of ingredients) {
      if (item.location in map) {
        map[item.location as ColdStorageLocation].push(item)
      }
    }
    return map
  }, [ingredients])

  const handleSubmit = async (data: Parameters<typeof addIngredient>[0]) => {
    if (editing) {
      await updateIngredient(editing.id, data)
    } else {
      await addIngredient(data)
    }
    setEditing(undefined)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-fridge">
      <div className="shrink-0 px-3 pb-1 pt-2">
        <h2 className="text-sm font-semibold text-fridge-dark">냉장고</h2>
        <p className="text-[11px] leading-snug text-gray-500">
          칸을 탭한 뒤 + 로 재료를 추가하세요
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-2 pb-2">
        {COLD_STORAGE_LOCATIONS.map((location) => (
          <FridgeSection
            key={location}
            location={location}
            ingredients={byLocation[location]}
            isActive={activeLocation === location}
            onActivate={() => setActiveLocation(location)}
            onIngredientClick={(ing) => {
              setActiveLocation(location)
              setEditing(ing)
              setFormOpen(true)
            }}
          />
        ))}
      </div>

      {!formOpen && (
        <button
          type="button"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:bg-brand-dark active:scale-95"
          aria-label="냉장고 재료 추가"
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
        defaultLocation={editing?.location ?? activeLocation}
      />
    </div>
  )
}
