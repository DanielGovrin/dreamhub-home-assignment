import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { AlertList } from '@/components/AlertList'
import { Composer } from '@/components/Composer'
import { ConnectionBadge } from '@/components/ConnectionBadge'
import { FilterBar } from '@/components/FilterBar'
import { NewMessagesPill } from '@/components/NewMessagesPill'
import { SearchInput } from '@/components/SearchInput'
import { useAlertFeed } from '@/hooks/useAlertFeed'
import { useFollowScroll } from '@/hooks/useFollowScroll'
import { countByType, filterAlerts } from '@/lib/filterAlerts'
import { loadVisibleTypes, saveVisibleTypes } from '@/lib/persistedFilters'
import { ALERT_TYPES, type AlertType } from '@/lib/types'

function App() {
  const { items, status, attempt, send, reconnect } = useAlertFeed()

  const [visibleTypes, setVisibleTypes] = useState<Set<AlertType>>(loadVisibleTypes)
  const [searchQuery, setSearchQuery] = useState('')

  const deferredQuery = useDeferredValue(searchQuery)
  const isStale = searchQuery !== deferredQuery

  useEffect(() => {
    saveVisibleTypes(visibleTypes)
  }, [visibleTypes])

  const toggleType = useCallback((type: AlertType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev)
      if (!next.delete(type)) next.add(type)
      return next
    })
  }, [])

  const counts = useMemo(() => countByType(items), [items])
  const visible = useMemo(
    () => filterAlerts(items, { types: visibleTypes, searchQuery: deferredQuery }),
    [items, visibleTypes, deferredQuery],
  )

  const isFiltered = visibleTypes.size !== ALERT_TYPES.length || deferredQuery.trim() !== ''

  const { scrollRef, handleScroll, unseenCount, jumpToLatest } = useFollowScroll(visible)

  return (
    <div className="mx-auto flex h-svh max-w-4xl flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center gap-2">
        <div className="min-w-48 flex-1">
          <SearchInput value={searchQuery} onChange={setSearchQuery} />
        </div>
        <FilterBar active={visibleTypes} counts={counts} onToggle={toggleType} />
      </header>

      {/* `relative` anchors the absolutely-positioned pill to this panel. */}
      <section className="relative flex min-h-0 flex-1 flex-col rounded-lg border border-line bg-surface">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2">
          <ConnectionBadge status={status} attempt={attempt} onRetry={reconnect} />
          <span className="text-xs tabular-nums text-muted">
            {isFiltered ? `${visible.length} of ${items.length}` : `${items.length}`} messages
          </span>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={clsx(
            'min-h-0 flex-1 overflow-y-auto transition-opacity',
            isStale && 'opacity-60',
          )}
        >
          <AlertList items={visible} isFiltered={isFiltered} />
        </div>

        {unseenCount > 0 && <NewMessagesPill count={unseenCount} onClick={jumpToLatest} />}
      </section>

      <Composer onSend={send} />
    </div>
  )
}

export default App
