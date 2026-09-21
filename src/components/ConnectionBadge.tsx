import clsx from 'clsx'
import type { ConnectionStatus } from '@/lib/types'

const STATUS: Record<ConnectionStatus, { label: string; dot: string; text: string; pulse: boolean }> = {
  connecting: { label: 'Connecting…', dot: 'bg-warning', text: 'text-warning', pulse: true },
  open: { label: 'Connected', dot: 'bg-success', text: 'text-success', pulse: false },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-warning', text: 'text-warning', pulse: true },
  closed: { label: 'Disconnected', dot: 'bg-error', text: 'text-error', pulse: false },
}

interface ConnectionBadgeProps {
  status: ConnectionStatus
  /** Retry number, shown only while reconnecting. */
  attempt?: number
  /** Offered once the automatic retries have given up. */
  onRetry?: () => void
}

export function ConnectionBadge({ status, attempt, onRetry }: ConnectionBadgeProps) {
  const { label, dot, text, pulse } = STATUS[status]
  const suffix = status === 'reconnecting' && attempt ? ` (attempt ${attempt})` : ''

  return (
    <div className="flex items-center gap-2">
      {/* role=status announces changes without stealing focus. */}
      <span role="status" className={clsx('flex items-center gap-2 text-xs font-medium', text)}>
        <span className="relative flex size-2">
          {pulse && (
            <span className={clsx('absolute inline-flex size-full animate-ping rounded-full opacity-75', dot)} />
          )}
          <span className={clsx('relative inline-flex size-2 rounded-full', dot)} />
        </span>
        {label}
        {suffix}
      </span>

      {status === 'closed' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-line px-1.5 py-0.5 text-xs text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Retry
        </button>
      )}
    </div>
  )
}
