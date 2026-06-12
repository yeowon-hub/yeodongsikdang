import type { ReactNode } from 'react'
import { getStorageDesign, type StorageDesignId } from '@/lib/storageDesignSpec'

interface StoragePageShellProps {
  designId: StorageDesignId
  children: ReactNode
}

export function StoragePageShell({ designId, children }: StoragePageShellProps) {
  const theme = getStorageDesign(designId)

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col"
      style={{ backgroundColor: theme.pageBg }}
    >
      <div className="shrink-0 px-4 pb-2 pt-3">
        <img
          src={theme.titleWordSrc}
          alt={theme.titleAlt}
          className="h-9 w-auto max-w-[72%] object-contain object-left"
          draggable={false}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
