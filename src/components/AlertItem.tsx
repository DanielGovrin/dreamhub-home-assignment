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
  warning: { Icon: TriangleAlert, icon: 'text-warning', shell: 'border-l-warning bg-warning-soft/50' },
  error: { Icon: CircleX, icon: 'text-error', shell: 'border-l-error bg-error-soft/50' },
  success: { Icon: CircleCheck, icon: 'text-success', shell: 'border-l-success bg-success-soft/50' },
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export const AlertItem = memo(function AlertItem({ alert }: { alert: FeedItem }) {
  const { Icon, icon, shell } = TYPE_META[alert.type]
  const isQueued = alert.outbound === 'queued'
  const isFailed = alert.outbound === 'failed'

  return (
    <li
      className={clsx(
        'relative flex gap-3 rounded-md border border-line border-l-2 p-3 transition-opacity',
        shell,
        isQueued && 'opacity-60',
      )}
    >
      <Icon className={clsx('mt-0.5 size-4 shrink-0', icon)} aria-hidden />
      {/* Colour alone shouldn't carry meaning. */}
      <span className="sr-only">{alert.type}:</span>

      <div className="min-w-0 flex-1">
        <Markdown>{alert.text}</Markdown>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
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
})
