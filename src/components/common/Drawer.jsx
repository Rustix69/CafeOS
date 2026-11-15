import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/formatters.js'

export default function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="anim-fade absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className={cn('anim-drawer absolute inset-y-0 right-0 flex w-full flex-col border-l bg-card shadow-xl', width)}>
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold tracking-tight">{title}</h2>
            {subtitle && <div className="mt-1 text-[13px] text-muted-foreground">{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted/60"><X className="size-4" /></button>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-5 py-3">{footer}</div>}
      </aside>
    </div>,
    document.body
  )
}
