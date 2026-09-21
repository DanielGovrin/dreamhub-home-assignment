import { expect, test } from '@playwright/test'
import { BASE_DELAY_MS, MAX_DELAY_MS, reconnectDelay } from '../src/lib/backoff'

// `random` is injectable so the jitter band can be asserted exactly.
const noJitter = () => 1
const fullJitter = () => 0

test.describe('reconnectDelay', () => {
  test('starts at the base delay and doubles', () => {
    expect(reconnectDelay(1, noJitter)).toBe(BASE_DELAY_MS)
    expect(reconnectDelay(2, noJitter)).toBe(BASE_DELAY_MS * 2)
    expect(reconnectDelay(3, noJitter)).toBe(BASE_DELAY_MS * 4)
  })

  test('caps rather than growing without bound', () => {
    expect(reconnectDelay(20, noJitter)).toBe(MAX_DELAY_MS)
    expect(reconnectDelay(100, noJitter)).toBe(MAX_DELAY_MS)
  })

  test('jitter spans half the delay, never more', () => {
    // Without this spread every client reconnects in lockstep and stampedes a
    // server that has just come back.
    expect(reconnectDelay(3, fullJitter)).toBe((BASE_DELAY_MS * 4) / 2)
    expect(reconnectDelay(3, noJitter)).toBe(BASE_DELAY_MS * 4)
  })

  test('stays within the jitter band for real randomness', () => {
    for (let attempt = 1; attempt <= 12; attempt += 1) {
      const ceiling = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS)
      for (let i = 0; i < 50; i += 1) {
        const delay = reconnectDelay(attempt)
        expect(delay).toBeGreaterThanOrEqual(Math.floor(ceiling / 2))
        expect(delay).toBeLessThanOrEqual(ceiling)
      }
    }
  })
})
