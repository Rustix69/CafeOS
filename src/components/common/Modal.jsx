import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/formatters.js'

const WIDTH = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

export default function Modal({ open, onClose, title, description, size = 'md', children, footer, className }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', h)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = prev }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="anim-fade absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn('anim-pop relative flex max-h-[94vh] w-full flex-col rounded-t-xl border bg-card shadow-xl sm:max-h-[90vh] sm:rounded-xl', WIDTH[size], className)}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div>
              <h2 className="text-base font-bold tracking-tight">{title}</h2>
              {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" className="-mr-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted/60"><X className="size-4" /></button>
          </div>
        )}
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-muted/20 px-5 py-3 sm:rounded-b-xl">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
