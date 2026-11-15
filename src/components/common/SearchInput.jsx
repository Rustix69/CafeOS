import { Search, X } from 'lucide-react'
import { cn } from '../../utils/formatters.js'

export default function SearchInput({ value, onChange, placeholder = 'Search…', className, autoFocus }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        className="h-9 w-full rounded-md border bg-card pl-9 pr-8 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-ring focus:ring-3 focus:ring-ring/20" />
      {value && <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>}
    </div>
  )
}
