import { ALERT_TYPES, type AlertType, type FeedItem } from './types'

export interface FeedFilters {
  /** Types currently visible. */
  types: Set<AlertType>
  /** Free-text query matched against the message body. */
  searchQuery: string
}


export function filterAlerts(items: FeedItem[], { types, searchQuery }: FeedFilters): FeedItem[] {
  const needle = searchQuery.trim().toLowerCase()

  if (types.size === ALERT_TYPES.length && needle === '') return items
  
  return items.filter(
    (item) =>
      types.has(item.type) && (needle === '' || item.text.toLowerCase().includes(needle)),
  )
}

/** Per-type totals for the filter chips, computed over the unfiltered feed. */
export function countByType(items: FeedItem[]): Record<AlertType, number> {
  const counts = { info: 0, warning: 0, error: 0, success: 0 }
  for (const item of items) counts[item.type] += 1
  return counts
}
