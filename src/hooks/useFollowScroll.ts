import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { FeedItem } from '@/lib/types'

/** Only wide enough to absorb fractional scroll heights. */
const BOTTOM_TOLERANCE_PX = 16

/**
 * Pins a feed to its newest item while the user is at the live edge, and
 * counts what arrived after they scrolled away.
 *
 * Pass the *filtered* list — counting hidden alerts would show a pill that
 * jumps to the bottom and changes nothing.
 */
export function useFollowScroll(items: FeedItem[]) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  /** Newest item the user has been shown. State, not a ref: it is read during
   *  render to size the pill. */
  const [lastSeenId, setLastSeenId] = useState<string | null>(null)
  const isJumpingRef = useRef(false)
  const prevScrollTopRef = useRef(0)

  const newestId = items.length > 0 ? items[items.length - 1].id : null

  const handleScroll = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const { scrollTop, scrollHeight, clientHeight } = element
    const atBottom = scrollHeight - scrollTop - clientHeight <= BOTTOM_TOLERANCE_PX

    // A jump only scrolls downward, so upward movement means the user took
    // over. Direction covers every input; a `wheel` listener missed keyboard
    // and scrollbar drags.
    if (atBottom || (isJumpingRef.current && scrollTop < prevScrollTopRef.current)) {
      isJumpingRef.current = false
    }

    prevScrollTopRef.current = scrollTop
    setIsAtBottom(atBottom)
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const element = scrollRef.current
    if (!element) return
    element.scrollTo({ top: element.scrollHeight, behavior })
  }, [])

  // Layout effect so the scroll lands before paint, not as a visible jump.
  useLayoutEffect(() => {
    if (!isAtBottom && !isJumpingRef.current) return

    setLastSeenId(newestId)
    // Mid-jump, re-aim at the grown bottom rather than the target `scrollTo`
    // fixed when the button was clicked.
    scrollToBottom(isJumpingRef.current ? 'smooth' : 'auto')
  }, [newestId, isAtBottom, scrollToBottom])

  // Derived rather than accumulated, so filter changes can't leave it drifting.
  const unseenCount = (() => {
    if (isAtBottom) return 0

    if (lastSeenId === null) return 0

    const index = items.findIndex((item) => item.id === lastSeenId)
    // Marker aged out of the capped list, or was filtered away.
    return index === -1 ? items.length : items.length - index - 1
  })()

  const jumpToLatest = useCallback(() => {
    isJumpingRef.current = true
    // Setting `isAtBottom` here would trigger the effect's instant scroll and
    // cancel the animation; the scroll events flip it on arrival instead.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollToBottom(prefersReducedMotion ? 'auto' : 'smooth')
  }, [scrollToBottom])

  return { scrollRef, handleScroll, isAtBottom, unseenCount, jumpToLatest }
}
