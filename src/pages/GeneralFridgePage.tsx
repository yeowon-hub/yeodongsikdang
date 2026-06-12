import { FrenchDoorFridgeView } from '@/components/fridge/FrenchDoorFridgeView'

export function GeneralFridgePage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <FrenchDoorFridgeView unitId="general" />
    </div>
  )
}
