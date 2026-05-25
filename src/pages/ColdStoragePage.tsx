import { FrenchDoorFridgeView } from '@/components/fridge/FrenchDoorFridgeView'
import type { FridgeUnitId } from '@/types'

export function FrenchDoorFridgePage({ unitId }: { unitId: FridgeUnitId }) {
  return <FrenchDoorFridgeView unitId={unitId} />
}

/** @deprecated /fridge/general 사용 */
export function FridgePage() {
  return <FrenchDoorFridgeView unitId="general" />
}
