import clsx from 'clsx'
import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AlertType } from '@/lib/types'

/** Tailwind needs literal class strings, so active styles are a static map. */
const CHIP: Record<AlertType, { Icon: LucideIcon; active: string }> = {
  info: { Icon: Info, active: 'border-info bg-info-soft text-info' },
  warning: { Icon: TriangleAlert, active: 'border-warning bg-warning-soft text-warning' },
  error: { Icon: CircleX, active: 'border-error bg-error-soft text-error' },
  success: { Icon: CircleCheck, active: 'border-success bg-success-soft text-success' },
}

interface FilterChipProps {
  type: AlertType
  count: number
  active: boolean
  onToggle: (type: AlertType) => void
}

export function FilterChip({ type, count, active, onToggle }: FilterChipProps) {
  const { Icon, active: activeClass } = CHIP[type]

  return (
    <button
      type="button"
      // aria-pressed is what makes this a toggle to assistive tech; the colour
      // change alone wouldn't communicate state.
      aria-pressed={active}
      onClick={() => onToggle(type)}
      className={clsx(
        'flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium capitalize transition-colors sm:gap-1.5 sm:px-2.5',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active ? activeClass : 'border-line text-muted hover:text-fg',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {type}
      <span className={clsx('tabular-nums', !active && 'opacity-60')}>{count}</span>
    </button>
  )
}
