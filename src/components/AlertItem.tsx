import { memo } from 'react'
import clsx from 'clsx'
import { CircleCheck, CircleX, Clock, Info, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AlertType, FeedItem } from '@/lib/types'
import { Markdown } from './Markdown'

/**
 * Tailwind only emits classes it can see as literal strings, so per-type
 * styling is a static lookup rather than an interpolated class name.
 */
const TYPE_META: Record<AlertType, { Icon: LucideIcon; icon: string; shell: string }> = {
  info: { Icon: Info, icon: 'text-info', shell: 'border-l-info bg-info-soft/50' },
  warning: {
    Icon: TriangleAlert,
    icon: 'text-warning',
    shell: 'border-l-warning bg-warning-soft/50',
  },
  error: { Icon: CircleX, icon: 'text-error', shell: 'border-l-error bg-error-soft/50' },
  success: {
    Icon: CircleCheck,
    icon: 'text-success',
    shell: 'border-l-success bg-success-soft/50',
  },
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export const AlertItem = memo(function AlertItem({ alert }: { alert: FeedItem }) {
  const isQueued = alert.outbound === 'queued'
  const isFailed = alert.outbound === 'failed'

  /**
   * Messages this client sent get their own lane. The server replies with a
   * separate `You said: …` alert rather than echoing the original, so without
   * a visual distinction the feed shows what looks like a duplicate.
   */
  if (alert.outbound) {
    return (
      <li
        className={clsx(
          'relative flex max-w-[85%] gap-3 self-end rounded-md border border-line border-r-2 border-r-fg/40 bg-fg/5 p-3 transition-opacity',
          isQueued && 'opacity-60',
        )}
      >
        <span className="sr-only">You sent:</span>

        <div className="min-w-0 flex-1">
          <Markdown>{alert.text}</Markdown>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs font-medium text-muted">You</span>
          <time
            dateTime={new Date(alert.timestamp).toISOString()}
            className="text-xs tabular-nums text-muted"
          >
            {timeFormat.format(alert.timestamp)}
          </time>
          {isQueued && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Clock className="size-3" aria-hidden />
              queued
            </span>
          )}
          {isFailed && <span className="text-xs text-error">failed</span>}
        </div>
      </li>
    )
  }

  const { Icon, icon, shell } = TYPE_META[alert.type]
  const stamp = timeFormat.format(alert.timestamp)
  const iso = new Date(alert.timestamp).toISOString()

  return (
    // `relative` matters: the sr-only span below is absolutely positioned, and
    // without a positioned ancestor it escapes the scroll container and
    // stretches the page instead.
    <li className={clsx('relative flex gap-3 rounded-md border border-line border-l-2 p-3', shell)}>
      <Icon className={clsx('mt-0.5 size-4 shrink-0', icon)} aria-hidden />
      {/* Colour alone shouldn't carry meaning. */}
      <span className="sr-only">{alert.type}:</span>

      <div className="min-w-0 flex-1">
        <Markdown>{alert.text}</Markdown>
        {/* Narrow screens can't spare a fixed column for the timestamp, so it
            drops below the text instead of squeezing it. */}
        <time
          dateTime={iso}
          className="mt-1 block text-right text-xs tabular-nums text-muted sm:hidden"
        >
          {stamp}
        </time>
      </div>

      <time dateTime={iso} className="hidden shrink-0 text-xs tabular-nums text-muted sm:block">
        {stamp}
      </time>
    </li>
  )
})
