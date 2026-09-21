import { ALERT_TYPES, type AlertType } from './types'

const STORAGE_KEY = 'alert-feed:visible-types'

export function loadVisibleTypes(): Set<AlertType> {
  const showAll = () => new Set(ALERT_TYPES)

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return showAll()

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return showAll()

    const valid = parsed.filter((value): value is AlertType =>
      ALERT_TYPES.includes(value as AlertType),
    )

    // An empty stored array is a real choice (everything hidden), but an array
    // that had entries and lost them all to validation is corrupt.
    if (parsed.length > 0 && valid.length === 0) return showAll()

    return new Set(valid)
  } catch {
    // Safari private mode, blocked site data, malformed JSON. Persistence is a
    // nicety — never let it take down the feed.
    return showAll()
  }
}

export function saveVisibleTypes(types: Set<AlertType>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...types]))
  } catch {
    // Storage full or unavailable; the app works fine without persistence.
  }
}
