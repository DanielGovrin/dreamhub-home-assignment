export const BASE_DELAY_MS = 500
export const MAX_DELAY_MS = 8_000

/** Retries before giving up and waiting for the user to ask again. */
export const MAX_ATTEMPTS = 8

/**
 * Exponential backoff with jitter.
 *
 * `random` is injectable so the pacing can be tested deterministically.
 * Jitter matters when a server restarts: without it every client reconnects
 * in lockstep and stampedes the socket the moment it comes back.
 */
export function reconnectDelay(attempt: number, random: () => number = Math.random): number {
  const capped = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS)
  return Math.round(capped * (0.5 + random() * 0.5))
}
