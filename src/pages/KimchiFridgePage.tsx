import { FrenchDoorFridgeView } from '@/components/fridge/FrenchDoorFridgeView'

export function KimchiFridgePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <FrenchDoorFridgeView unitId="kimchi" />
    </div>
  )
}
