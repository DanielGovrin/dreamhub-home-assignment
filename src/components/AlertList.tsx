import type { FeedItem } from '@/lib/types'
import { AlertItem } from './AlertItem'

interface AlertListProps {
  items: FeedItem[]
  /** True when filters/search are narrowing the feed, so an empty result
   *  means "nothing matched" rather than "nothing has arrived yet". */
  isFiltered: boolean
}

export function AlertList({ items, isFiltered }: AlertListProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted">
        {isFiltered ? 'No alerts match the current filters.' : 'Waiting for alerts…'}
      </div>
    )
  }

  return (
    <ul
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Alert feed"
      className="flex flex-col gap-2 p-3"
    >
      {items.map((item) => (
        <AlertItem key={item.id} alert={item} />
      ))}
    </ul>
  )
}
