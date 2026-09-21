import { expect, test } from '@playwright/test'
import { parseAlert } from '../src/lib/parseAlert'

const valid = JSON.stringify({
  id: 'abc',
  type: 'error',
  text: 'API returned 500',
  timestamp: 1_700_000_000_000,
})

test.describe('parseAlert', () => {
  test('accepts a well-formed payload', () => {
    expect(parseAlert(valid)).toEqual({
      id: 'abc',
      type: 'error',
      text: 'API returned 500',
      timestamp: 1_700_000_000_000,
    })
  })

  // A socket can deliver anything; one bad frame must not take down the feed.
  test('rejects malformed input without throwing', () => {
    expect(parseAlert('not json')).toBeNull()
    expect(parseAlert('')).toBeNull()
    expect(parseAlert('null')).toBeNull()
    expect(parseAlert('[1,2,3]')).toBeNull()
    expect(parseAlert(new ArrayBuffer(8))).toBeNull()
    expect(parseAlert(undefined)).toBeNull()
  })

  test('rejects payloads missing required fields', () => {
    expect(parseAlert(JSON.stringify({ type: 'info', text: 'x' }))).toBeNull()
    expect(parseAlert(JSON.stringify({ id: 'a', text: 'x' }))).toBeNull()
    expect(parseAlert(JSON.stringify({ id: 'a', type: 'info' }))).toBeNull()
    expect(parseAlert(JSON.stringify({ id: 1, type: 'info', text: 'x' }))).toBeNull()
  })

  test('rejects a type outside the known set', () => {
    expect(parseAlert(JSON.stringify({ id: 'a', type: 'critical', text: 'x' }))).toBeNull()
  })

  test('falls back to now when the timestamp is missing or wrong', () => {
    const before = Date.now()
    const parsed = parseAlert(JSON.stringify({ id: 'a', type: 'info', text: 'x' }))
    expect(parsed).not.toBeNull()
    expect(parsed!.timestamp).toBeGreaterThanOrEqual(before)

    const bad = parseAlert(JSON.stringify({ id: 'a', type: 'info', text: 'x', timestamp: 'soon' }))
    expect(bad!.timestamp).toBeGreaterThanOrEqual(before)
  })
})
