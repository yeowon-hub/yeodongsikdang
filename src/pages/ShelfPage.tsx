import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ShelfView } from '@/components/shelf/ShelfView'
import { IngredientForm } from '@/components/fridge/IngredientForm'
import { useIngredients } from '@/hooks/useIngredients'
import type { Ingredient } from '@/types'

export function ShelfPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | undefined>()
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, moveIngredient } =
    useIngredients('shelf')

  const handleSubmit = async (data: Parameters<typeof addIngredient>[0]) => {
    if (editing) {
      await updateIngredient(editing.id, data)
    } else {
      await addIngredient(data)
    }
    setEditing(undefined)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-shelf">
      <ShelfView
        ingredients={ingredients}
        onIngredientClick={(ing) => {
          setEditing(ing)
          setFormOpen(true)
        }}
      />

      <button
        type="button"
        onClick={() => {
          setEditing(undefined)
          setFormOpen(true)
        }}
        className="fixed bottom-[4.5rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:bg-brand-dark active:scale-95"
        aria-label="재료 추가"
      >
        <Plus size={28} />
      </button>

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
        defaultLocation="shelf"
      />
    </div>
  )
}
