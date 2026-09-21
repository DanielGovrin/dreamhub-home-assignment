import { expect, test } from '@playwright/test'
import { countByType, filterAlerts } from '../src/lib/filterAlerts'
import { ALERT_TYPES, type FeedItem } from '../src/lib/types'

const items: FeedItem[] = [
  { id: '1', type: 'info', text: 'Deployment to production completed', timestamp: 1 },
  { id: '2', type: 'error', text: 'API request returned 500', timestamp: 2 },
  { id: '3', type: 'warning', text: 'High memory on worker-3', timestamp: 3 },
  { id: '4', type: 'success', text: 'Deployment finished', timestamp: 4 },
]

const allTypes = () => new Set(ALERT_TYPES)

test.describe('filterAlerts', () => {
  test('returns the same reference when nothing narrows the feed', () => {
    // Memoised consumers rely on this to skip re-rendering on every message.
    expect(filterAlerts(items, { types: allTypes(), searchQuery: '' })).toBe(items)
    expect(filterAlerts(items, { types: allTypes(), searchQuery: '   ' })).toBe(items)
  })

  test('filters by type', () => {
    const result = filterAlerts(items, { types: new Set(['error'] as const), searchQuery: '' })
    expect(result.map((i) => i.id)).toEqual(['2'])
  })

  test('search is case-insensitive', () => {
    const result = filterAlerts(items, { types: allTypes(), searchQuery: 'DEPLOYMENT' })
    expect(result.map((i) => i.id)).toEqual(['1', '4'])
  })

  test('type and search intersect rather than union', () => {
    const result = filterAlerts(items, {
      types: new Set(['success'] as const),
      searchQuery: 'deployment',
    })
    expect(result.map((i) => i.id)).toEqual(['4'])
  })

  test('no matches yields an empty list, not everything', () => {
    expect(filterAlerts(items, { types: allTypes(), searchQuery: 'zzz' })).toEqual([])
    expect(filterAlerts(items, { types: new Set(), searchQuery: '' })).toEqual([])
  })
})

test('countByType counts every type, including zeroes', () => {
  expect(countByType(items)).toEqual({ info: 1, warning: 1, error: 1, success: 1 })
  expect(countByType([])).toEqual({ info: 0, warning: 0, error: 0, success: 0 })
})
