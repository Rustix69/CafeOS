import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/formatters.js'

const base = 'h-9 w-full rounded-md border bg-card px-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60'

export function Field({ label, hint, error, children, className, required }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-1.5 block text-[13px] font-semibold">{label}{required && <span className="text-destructive"> *</span>}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}
export const Input = ({ className, ...p }) => <input className={cn(base, className)} {...p} />
export const Textarea = ({ className, ...p }) => <textarea className={cn(base, 'h-auto min-h-20 py-2', className)} {...p} />
export function Select({ className, options, children, placeholder, ...p }) {
  return (
    <div className="relative">
      <select className={cn(base, 'appearance-none pr-8', className)} {...p}>
        {placeholder && <option value="">{placeholder}</option>}
        {options ? options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)) : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
export function Toggle({ checked, onChange, label, desc, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || desc) && <div><p className="text-sm font-semibold">{label}</p>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>}
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn('relative h-5.5 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-primary' : 'bg-input')}>
        <span className={cn('absolute left-0.5 top-0.5 size-4.5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4.5')} />
      </button>
    </div>
  )
}
export function Segmented({ value, onChange, options, size = 'md', className }) {
  return (
    <div className={cn('inline-flex rounded-lg border bg-muted/40 p-0.5', className)}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return (
          <button key={v} onClick={() => onChange(v)}
            className={cn('rounded-md font-semibold transition', size === 'lg' ? 'h-10 px-4 text-sm' : 'h-7 px-3 text-[13px]', value === v ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}>
            {l}
          </button>
        )
      })}
    </div>
  )
}
export const Card = ({ className, children, ...p }) => <div className={cn('rounded-xl border bg-card shadow-xs', className)} {...p}>{children}</div>
export function CardHeader({ title, desc, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-4 pt-4 sm:px-5', className)}>
      <div><h3 className="text-sm font-bold tracking-tight">{title}</h3>{desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}</div>
      {action}
    </div>
  )
}
