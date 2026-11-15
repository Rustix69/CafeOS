import { cn } from '../../utils/formatters.js'

const TONES = {
  pending: 'bg-warning/15 text-warning-foreground',
  preparing: 'bg-secondary/15 text-secondary',
  ready: 'bg-accent/30 text-accent-foreground',
  completed: 'bg-primary/12 text-primary',
  cancelled: 'bg-destructive/10 text-destructive',
  paid: 'bg-primary/12 text-primary',
  unpaid: 'bg-warning/15 text-warning-foreground',
  refunded: 'bg-destructive/10 text-destructive',
  available: 'bg-primary/12 text-primary',
  occupied: 'bg-secondary/15 text-secondary',
  reserved: 'bg-warning/15 text-warning-foreground',
  active: 'bg-primary/12 text-primary',
  inactive: 'bg-muted text-muted-foreground',
  'in-stock': 'bg-primary/12 text-primary',
  low: 'bg-warning/15 text-warning-foreground',
  out: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-secondary/15 text-secondary',
  Gold: 'bg-warning/20 text-warning-foreground',
  Silver: 'bg-muted text-foreground/70',
  Bronze: 'bg-destructive/10 text-destructive',
}
const DOT = {
  pending: 'bg-warning', preparing: 'bg-secondary', ready: 'bg-accent', completed: 'bg-primary', cancelled: 'bg-destructive',
  paid: 'bg-primary', unpaid: 'bg-warning', refunded: 'bg-destructive', available: 'bg-primary', occupied: 'bg-secondary', reserved: 'bg-warning',
  active: 'bg-primary', inactive: 'bg-muted-foreground', 'in-stock': 'bg-primary', low: 'bg-warning', out: 'bg-destructive',
}
const LABEL = { 'in-stock': 'In stock', out: 'Out of stock', low: 'Low stock' }

export default function StatusBadge({ status, label, className, dot = true }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold capitalize', TONES[status] || TONES.neutral, className)}>
      {dot && DOT[status] && <span className={cn('size-1.5 rounded-full', DOT[status])} />}
      {label || LABEL[status] || status}
    </span>
  )
}
