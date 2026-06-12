import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseLevelIndex } from '@/lib/navigation'
import { Plus } from 'lucide-react'
import { IngredientForm } from '@/components/fridge/IngredientForm'
import { DryStorageView } from '@/components/storage/DryStorageView'
import { useIngredients } from '@/hooks/useIngredients'
import type { Ingredient } from '@/types'

export function PantryPage() {
  const [searchParams] = useSearchParams()
  const focusLevel = parseLevelIndex(searchParams.get('level'))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | undefined>()
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, moveIngredient } =
    useIngredients('pantry')

  const handleSubmit = async (data: Parameters<typeof addIngredient>[0]) => {
    if (editing) {
      await updateIngredient(editing.id, data)
    } else {
      await addIngredient(data)
    }
    setEditing(undefined)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <DryStorageView
        designId="pantry"
        ingredients={ingredients}
        onIngredientClick={(ing) => {
          setEditing(ing)
          setFormOpen(true)
        }}
        focusLevel={focusLevel}
        emptyMessage={'펜트리가 비어있어요.\n+ 버튼으로 재료를 추가해보세요!'}
      />

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
        defaultLocation="pantry"
      />
    </div>
  )
}
