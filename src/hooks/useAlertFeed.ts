import { useCallback, useEffect, useRef, useState } from 'react'
import { parseAlert } from '@/lib/parseAlert'
import type { FeedItem } from '@/lib/types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'

export function useAlertFeed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const socketRef = useRef<WebSocket | null>(null)

  const pendingRef = useRef<{ id: string; text: string }[]>([])

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socketRef.current = socket

    socket.onmessage = (event) => {
      const alert = parseAlert(event.data)
      if (alert) setItems((prev) => [...prev, alert])
    }

    return () => {
      socketRef.current = null
      socket.close()
    }
  }, [])

  const send = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const socket = socketRef.current
    const openSocket = socket?.readyState === WebSocket.OPEN ? socket : null
    const id = crypto.randomUUID()

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

  return { items, send }
}
