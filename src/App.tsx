import { AlertList } from '@/components/AlertList'
import { Composer } from '@/components/Composer'
import { useAlertFeed } from '@/hooks/useAlertFeed'

function App() {
  const { items, send } = useAlertFeed()

  return (
    <div className="mx-auto flex h-svh max-w-2xl flex-col gap-3 p-4">
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-line bg-surface">
        <AlertList items={items} isFiltered={false} />
      </div>
      <Composer onSend={send} />
    </div>
  )
}

export default App
