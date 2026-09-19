import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'

export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Send a message…"
        aria-label="Message to send"
        className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="submit"
        disabled={value.trim() === ''}
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-fg px-3 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <Send className="size-4" aria-hidden />
        Send
      </button>
    </form>
  )
}
