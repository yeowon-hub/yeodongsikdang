import type { ReactNode } from 'react'
import {
  getStorageDesign,
  STORAGE_CARD_INSET,
  STORAGE_CARD_RADIUS,
  STORAGE_CARD_SHADOW_FLEX,
  STORAGE_CARD_SHADOW_GRADIENT,
  STORAGE_SUBNAV_FLEX,
  type StorageDesignId,
} from '@/lib/storageDesignSpec'
import { StoragePageShell } from './StoragePageShell'

interface DesignStoragePageProps {
  designId: StorageDesignId
  subnav?: ReactNode
  children: ReactNode
}

const cardInsetStyle = {
  width: `${STORAGE_CARD_INSET.width}%`,
  marginLeft: 'auto',
  marginRight: 'auto',
} as const

export function DesignStoragePage({ designId, subnav, children }: DesignStoragePageProps) {
  const theme = getStorageDesign(designId)

  return (
    <StoragePageShell designId={designId}>
      {subnav ? (
        <div
          className="flex shrink-0 items-center px-4 pb-1"
          style={{ minHeight: STORAGE_SUBNAV_FLEX }}
        >
          {subnav}
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col px-0 pb-3">
        <div
          className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden"
          style={{
            ...cardInsetStyle,
            borderRadius: STORAGE_CARD_RADIUS,
            border: `3px solid ${theme.cardBorder}`,
            backgroundColor: theme.cardBg,
          }}
        >
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

          <div
            className="shrink-0"
            style={{
              height: STORAGE_CARD_SHADOW_FLEX,
              background: STORAGE_CARD_SHADOW_GRADIENT,
            }}
          />
        </div>
      </div>
    </StoragePageShell>
  )
}
