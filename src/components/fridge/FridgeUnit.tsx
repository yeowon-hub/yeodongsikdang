import type { Ingredient, ColdStorageLocation, FridgeUnitId } from '@/types'
import { FRIDGE_UNITS } from '@/types'
import { FridgeSection } from './FridgeSection'

const UNIT_ACCENT: Record<FridgeUnitId, string> = {
  general: 'ring-fridge-dark/30',
  kimchi: 'ring-amber-600/25',
}

interface FridgeUnitProps {
  unitId: FridgeUnitId
  byLocation: Record<ColdStorageLocation, Ingredient[]>
  activeLocation: ColdStorageLocation
  onActivate: (location: ColdStorageLocation) => void
  onIngredientClick: (location: ColdStorageLocation, ingredient: Ingredient) => void
}

export function FridgeUnit({
  unitId,
  byLocation,
  activeLocation,
  onActivate,
  onIngredientClick,
}: FridgeUnitProps) {
  const unit = FRIDGE_UNITS.find((u) => u.id === unitId)!
  const unitActive = unit.compartments.some((c) => c.location === activeLocation)

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col rounded-xl bg-white/50 p-1.5 ${
        unitActive ? `ring-2 ${UNIT_ACCENT[unitId]}` : ''
      }`}
    >
      <h3 className="mb-1 shrink-0 px-1 text-center text-[11px] font-bold text-gray-700">
        {unit.label}
      </h3>
      <div className="flex min-h-0 flex-1 flex-row gap-1">
        {unit.compartments.map(({ location }) => (
          <FridgeSection
            key={location}
            location={location}
            ingredients={byLocation[location]}
            isActive={activeLocation === location}
            onActivate={() => onActivate(location)}
            onIngredientClick={(ing) => onIngredientClick(location, ing)}
          />
        ))}
      </div>
    </div>
  )
}
