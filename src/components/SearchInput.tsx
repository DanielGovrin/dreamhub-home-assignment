import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search messages…"
        aria-label="Search messages"
        className="w-full rounded-md border border-line bg-surface py-2 pr-8 pl-8 text-sm outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
