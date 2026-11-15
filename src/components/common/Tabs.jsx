import { cn } from '../../utils/formatters.js'

export default function Tabs({ value, onChange, tabs, className }) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b', className)}>
      {tabs.map((t) => {
        const v = typeof t === 'string' ? t : t.value
        const l = typeof t === 'string' ? t : t.label
        const Icon = t.icon
        return (
          <button key={v} onClick={() => onChange(v)}
            className={cn('-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors', value === v ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {Icon && <Icon className="size-4" />}{l}{t.count !== undefined && <span className="rounded-full bg-muted px-1.5 text-[11px]">{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
