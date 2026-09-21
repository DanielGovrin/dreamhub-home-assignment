import { expect, type Page, type WebSocketRoute } from '@playwright/test'
import type { AlertType } from '../../src/lib/types'

let nextId = 0

export function alert(type: AlertType, text: string, timestamp = Date.now()) {
  nextId += 1
  return { id: `test-${nextId}`, type, text, timestamp }
}

/**
 * Intercepts the app's WebSocket so the feed is driven by the test rather than
 * by a server pushing every 2 seconds. Must be installed before `page.goto`.
 */
export async function mockFeed(page: Page) {
  const state = {
    socket: null as WebSocketRoute | null,
    connections: 0,
    /** Payloads the app sent us, in order. */
    received: [] as string[],
  }

  await page.routeWebSocket(/:8080/, (ws) => {
    state.socket = ws
    state.connections += 1
    ws.onMessage((message) => state.received.push(String(message)))
  })

  const api = {
    get connections() {
      return state.connections
    },
    get received() {
      return state.received
    },

    async waitForConnection(count = 1) {
      await expect.poll(() => state.connections, { timeout: 10_000 }).toBeGreaterThanOrEqual(count)
    },

    /** Push alerts to the page. */
    async push(...alerts: ReturnType<typeof alert>[]) {
      await api.waitForConnection()
      for (const payload of alerts) state.socket!.send(JSON.stringify(payload))
    },

    /** Drop the connection so the app's reconnect path runs. */
    async drop() {
      await api.waitForConnection()
      state.socket!.close({ code: 1006 })
    },
  }

  return api
}
