export const ALERT_TYPES = ['info', 'warning', 'error', 'success'] as const

export type AlertType = (typeof ALERT_TYPES)[number]

/** Payload shape emitted by the WebSocket server. Mirrors `server.js`. */
export interface Alert {
  id: string
  type: AlertType
  text: string
  timestamp: number
}

/**
 * Delivery state for messages originating from this client.
 * `queued` means the socket was down when the user hit send.
 */
export type OutboundStatus = 'queued' | 'sent' | 'failed'

/** An alert as rendered in the feed. */
export interface FeedItem extends Alert {
  /** Set only on messages this client sent; absent for server alerts. */
  outbound?: OutboundStatus
}
