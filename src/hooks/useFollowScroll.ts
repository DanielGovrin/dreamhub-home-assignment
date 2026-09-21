import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { FeedItem } from '@/lib/types'

/**
 * Fractional scroll heights mean `scrollTop + clientHeight` rarely equals
 * `scrollHeight` exactly, so "at the bottom" needs a tolerance.
 */
const BOTTOM_TOLERANCE_PX = 48

/**
 * Keeps a feed pinned to its newest item while the user is at the live edge,
 * and counts what arrived after they scrolled away.
 *
 * `items` should be the *filtered* list: counting alerts the current filters
 * hide would produce a pill that jumps you to the bottom and changes nothing.
 */
export function useFollowScroll(items: FeedItem[]) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  /**
   * Newest item the user has been shown. A ref rather than state: it only
   * changes while pinned to the bottom, where a re-render is already happening
   * for the new item anyway.
   */
  const lastSeenIdRef = useRef<string | null>(null)

  const newestId = items.length > 0 ? items[items.length - 1].id : null

  const handleScroll = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight
    setIsAtBottom(distanceFromBottom <= BOTTOM_TOLERANCE_PX)
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const element = scrollRef.current
    if (!element) return
    element.scrollTo({ top: element.scrollHeight, behavior })
  }, [])

  // Layout effect so the scroll happens before paint — otherwise the feed
  // visibly jumps after each new message.
  useLayoutEffect(() => {
    if (!isAtBottom) return
    lastSeenIdRef.current = newestId
    scrollToBottom('auto')
  }, [newestId, isAtBottom, scrollToBottom])

  /**
   * Derived rather than accumulated, so it stays correct when filters change
   * — there is no counter that can drift.
   */
  const unseenCount = (() => {
    if (isAtBottom) return 0

    const marker = lastSeenIdRef.current
    if (marker === null) return 0

    const index = items.findIndex((item) => item.id === marker)
    // Marker aged out of the list (or was filtered away): treat all as unseen.
    return index === -1 ? items.length : items.length - index - 1
  })()

  const jumpToLatest = useCallback(() => {
    // Deliberately does *not* set `isAtBottom` — that would fire the follow
    // effect's instant scroll and cancel the animation. The scroll events the
    // smooth scroll emits flip the flag once it actually arrives.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollToBottom(prefersReducedMotion ? 'auto' : 'smooth')
  }, [scrollToBottom])

  return { scrollRef, handleScroll, isAtBottom, unseenCount, jumpToLatest }
}
