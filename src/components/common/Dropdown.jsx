import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/formatters.js'

export default function Dropdown({ trigger, children, align = 'right', width = 'w-56', className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const k = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [open])
  return (
    <div ref={ref} className={cn('relative', className)}>
      <div onClick={() => setOpen((o) => !o)}>{typeof trigger === 'function' ? trigger(open) : trigger}</div>
      {open && (
        <div className={cn('anim-pop absolute z-40 mt-1.5 rounded-lg border bg-popover p-1 shadow-lg', width, align === 'right' ? 'right-0' : align === 'up' ? 'bottom-full left-0 mb-1.5 mt-0' : 'left-0')} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  )
}
export function MenuItem({ icon: Icon, children, danger, onClick, className }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors', danger ? 'text-destructive hover:bg-destructive/10' : 'hover:bg-muted/70', className)}>
      {Icon && <Icon className="size-4 shrink-0 opacity-80" />}{children}
    </button>
  )
}
export const MenuLabel = ({ children }) => <p className="px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{children}</p>
export const MenuSep = () => <div className="my-1 h-px bg-border" />
