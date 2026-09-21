import { ALERT_TYPES, type AlertType } from '@/lib/types'
import { FilterChip } from './FilterChip'

interface FilterBarProps {
  active: Set<AlertType>
  counts: Record<AlertType, number>
  onToggle: (type: AlertType) => void
}

export function FilterBar({ active, counts, onToggle }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by alert type">
      {ALERT_TYPES.map((type) => (
        <FilterChip
          key={type}
          type={type}
          count={counts[type]}
          active={active.has(type)}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
