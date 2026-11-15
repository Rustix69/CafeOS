import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '../../utils/formatters.js'

export default function StatCard({ label, value, icon: Icon, change, hint, tone = 'primary', children }) {
  const up = change >= 0
  const tones = { primary: 'bg-primary/10 text-primary', secondary: 'bg-secondary/12 text-secondary', warning: 'bg-warning/18 text-warning-foreground', danger: 'bg-destructive/10 text-destructive', accent: 'bg-accent/30 text-accent-foreground' }
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon && <span className={cn('grid size-8 place-items-center rounded-lg', tones[tone])}><Icon className="size-4" /></span>}
      </div>
      <p className="tnum mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {change !== undefined && change !== null && (
          <span className={cn('inline-flex items-center gap-0.5 font-bold', up ? 'text-primary' : 'text-destructive')}>
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
