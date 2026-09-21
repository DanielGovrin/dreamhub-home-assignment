import { ArrowDown } from 'lucide-react'

interface NewMessagesPillProps {
  count: number
  onClick: () => void
}

export function NewMessagesPill({ count, onClick }: NewMessagesPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-medium shadow-lg transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowDown className="size-3.5" aria-hidden />
      {count} new {count === 1 ? 'message' : 'messages'}
    </button>
  )
}
