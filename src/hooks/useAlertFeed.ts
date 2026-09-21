import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_ATTEMPTS, reconnectDelay } from '@/lib/backoff'
import { parseAlert } from '@/lib/parseAlert'
import type { ConnectionStatus, FeedItem } from '@/lib/types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'

/**
 * Longest silence tolerated on an open socket. The server emits every 2s, so
 * anything beyond this means the peer is gone even though no close frame
 * arrived. (The browser WebSocket API can't send protocol-level pings, so a
 * real deployment would agree an application-level ping instead.)
 */
const SILENCE_TIMEOUT_MS = 10_000

/**
 * How long a connection must survive before it counts as successful. Without
 * this, a server that accepts and immediately drops would reset the backoff on
 * every cycle and we'd hammer it at the base delay forever.
 */
const STABLE_AFTER_MS = 3_000

interface QueuedMessage {
  id: string
  text: string
}

export function useAlertFeed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [attempt, setAttempt] = useState(0)

  const socketRef = useRef<WebSocket | null>(null)

  /**
   * Messages the user sent while the socket was down, oldest first.
   * A ref rather than state: flushing is a side effect, and the visible
   * `queued` status already lives on the feed item itself.
   */
  const pendingRef = useRef<QueuedMessage[]>([])

  /** Bumped to force the connect effect to run again on manual retry. */
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    let attemptCount = 0
    let retryTimer: number | undefined
    let stableTimer: number | undefined
    let silenceTimer: number | undefined

    const clearTimers = () => {
      window.clearTimeout(retryTimer)
      window.clearTimeout(stableTimer)
      window.clearTimeout(silenceTimer)
    }

    function flushPending(socket: WebSocket) {
      const queued = pendingRef.current
      if (queued.length === 0) return
      pendingRef.current = []

      for (const message of queued) socket.send(message.text)

      const flushedIds = new Set(queued.map((message) => message.id))
      setItems((prev) =>
        prev.map((item) =>
          flushedIds.has(item.id) ? { ...item, outbound: 'sent' as const } : item,
        ),
      )
    }

    function scheduleRetry() {
      if (cancelled) return
      clearTimers()
      socketRef.current = null

      if (attemptCount >= MAX_ATTEMPTS) {
        setStatus('closed')
        return
      }

      attemptCount += 1
      setAttempt(attemptCount)
      setStatus('reconnecting')
      retryTimer = window.setTimeout(connect, reconnectDelay(attemptCount))
    }

    function connect() {
      const socket = new WebSocket(WS_URL)
      socketRef.current = socket

      const detach = () => {
        socket.onopen = null
        socket.onclose = null
        socket.onmessage = null
      }

      // Restarted on every inbound frame; firing means the connection went
      // silent.
      const armSilenceTimer = () => {
        window.clearTimeout(silenceTimer)
        silenceTimer = window.setTimeout(() => {
          // A frozen peer never completes the closing handshake, so `close()`
          // leaves the socket in CLOSING and `onclose` may never fire. Abandon
          // this socket and retry without waiting for it.
          detach()
          socket.close()
          scheduleRetry()
        }, SILENCE_TIMEOUT_MS)
      }

      socket.onopen = () => {
        if (cancelled) return
        setStatus('open')
        flushPending(socket)
        armSilenceTimer()

        stableTimer = window.setTimeout(() => {
          attemptCount = 0
          setAttempt(0)
        }, STABLE_AFTER_MS)
      }

      socket.onmessage = (event) => {
        if (cancelled) return
        armSilenceTimer()

        const alert = parseAlert(event.data)
        if (alert) setItems((prev) => [...prev, alert])
      }

      // `onerror` is always followed by `onclose`, so retries live in one place.
      socket.onclose = () => {
        detach()
        scheduleRetry()
      }
    }

    /**
     * Regaining the network is better evidence than any backoff timer, so skip
     * the remaining wait — including when we'd already given up.
     */
    const handleOnline = () => {
      if (cancelled) return

      const readyState = socketRef.current?.readyState
      if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) return

      clearTimers()
      attemptCount = 0
      setAttempt(0)
      setStatus('connecting')
      connect()
    }

    window.addEventListener('online', handleOnline)

    setStatus('connecting')
    connect()

    return () => {
      cancelled = true
      clearTimers()
      window.removeEventListener('online', handleOnline)

      const socket = socketRef.current
      socketRef.current = null
      if (socket) {
        // Detach before closing: otherwise StrictMode's remount sees `onclose`
        // for the socket we are deliberately discarding and starts retrying it.
        socket.onopen = null
        socket.onclose = null
        socket.onmessage = null
        socket.close()
      }
    }
  }, [retryToken])

  const send = useCallback((text: string) => {
    const trimmed = text.trim()
    if (trimmed === '') return

    const socket = socketRef.current
    const openSocket = socket?.readyState === WebSocket.OPEN ? socket : null
    const id = crypto.randomUUID()

    // Local echo: the server replies with a *new* `You said: …` alert rather
    // than returning this message, so the feed has to show it itself.
    setItems((prev) => [
      ...prev,
      {
        id,
        type: 'info',
        text: trimmed,
        timestamp: Date.now(),
        outbound: openSocket ? 'sent' : 'queued',
      },
    ])

    if (openSocket) {
      openSocket.send(trimmed)
    } else {
      pendingRef.current.push({ id, text: trimmed })
    }
  }, [])

  /** Restart the connect cycle after the automatic retries gave up. */
  const reconnect = useCallback(() => setRetryToken((token) => token + 1), [])

  return { items, status, attempt, send, reconnect }
}
