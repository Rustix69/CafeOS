import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from 'lucide-react'
import { cn } from '../../utils/formatters.js'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

const ICONS = { success: CheckCircle2, info: Info, warning: TriangleAlert, error: XCircle }
const TONES = { success: 'text-success', info: 'text-info', warning: 'text-warning', error: 'text-destructive' }

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const dismiss = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), [])
  const toast = useCallback((title, opts = {}) => {
    const id = Math.random().toString(36).slice(2)
    const t = { id, title, type: opts.type || 'success', desc: opts.desc }
    setItems((l) => [...l.slice(-3), t])
    setTimeout(() => dismiss(id), opts.duration || 3800)
  }, [dismiss])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {items.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <div key={t.id} className="anim-up pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-3 pr-2 shadow-lg">
              <Icon className={cn('mt-0.5 size-4.5 shrink-0', TONES[t.type])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded p-1 text-muted-foreground hover:bg-muted/60"><X className="size-3.5" /></button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}
