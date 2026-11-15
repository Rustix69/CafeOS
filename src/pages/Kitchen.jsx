import { useMemo, useRef, useState, useEffect } from 'react'
import { AlertTriangle, ArrowRight, Bell, BellOff, CheckCheck, ChefHat, Clock, Flame, Maximize2, Minimize2, Play, Utensils, Armchair, ShoppingBag, Bike, Undo2 } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import useNow from '../hooks/useNow.js'
import Button from '../components/common/Button.jsx'
import { cn, fmtTime, mmss } from '../utils/formatters.js'

const COLS = [
  { key: 'pending', title: 'New orders', icon: Bell, accent: 'bg-warning', next: 'preparing', cta: 'Start preparing', ctaIcon: Play },
  { key: 'preparing', title: 'Preparing', icon: Flame, accent: 'bg-secondary', next: 'ready', cta: 'Mark ready', ctaIcon: ArrowRight },
  { key: 'ready', title: 'Ready to serve', icon: CheckCheck, accent: 'bg-primary', next: 'completed', cta: 'Served / picked up', ctaIcon: CheckCheck },
]
const TYPE_ICON = { 'dine-in': Armchair, takeaway: ShoppingBag, delivery: Bike }

export default function Kitchen() {
  const { orders, settings, actions } = useStore()
  const now = useNow(1000)
  const root = useRef(null)
  const [full, setFull] = useState(false)
  const [sound, setSound] = useState(settings.orders.soundAlerts)
  const alertMs = settings.orders.kdsAlertMinutes * 60000
  const target = settings.orders.prepTime * 60000

  useEffect(() => { const h = () => setFull(!!document.fullscreenElement); document.addEventListener('fullscreenchange', h); return () => document.removeEventListener('fullscreenchange', h) }, [])
  const toggleFull = () => { if (document.fullscreenElement) document.exitFullscreen(); else root.current?.requestFullscreen?.() }

  const active = useMemo(() => orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status)).sort((a, b) => a.createdAt - b.createdAt), [orders])
  const lastDone = useMemo(() => orders.filter((o) => o.status === 'completed').sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4), [orders])
  const late = active.filter((o) => o.status !== 'ready' && now - o.createdAt > alertMs).length
  const completedToday = orders.filter((o) => o.status === 'completed').length

  return (
    <div ref={root} className="flex h-full flex-col bg-background text-foreground">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><ChefHat className="size-5" /></span><div><h1 className="text-lg font-extrabold tracking-tight">Kitchen Display</h1><p className="text-xs text-muted-foreground">{active.length} active · {completedToday} served today</p></div></div>
        <div className="flex flex-wrap gap-2">
          {COLS.map((c) => <span key={c.key} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-[13px] font-semibold"><span className={cn('size-2 rounded-full', c.accent)} />{c.title.split(' ')[0]} <b className="tnum text-base">{active.filter((o) => o.status === c.key).length}</b></span>)}
          {late > 0 && <span className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[13px] font-bold text-destructive"><AlertTriangle className="size-4" />{late} delayed</span>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" icon={sound ? Bell : BellOff} onClick={() => { setSound(!sound); actions.updateSettings('orders', { soundAlerts: !sound }, true) }}>{sound ? 'Alerts on' : 'Muted'}</Button>
          <Button variant="outline" icon={full ? Minimize2 : Maximize2} onClick={toggleFull}>{full ? 'Exit full screen' : 'Full screen'}</Button>
        </div>
      </div>

      <div className="scroll-thin grid min-h-0 flex-1 gap-4 overflow-auto p-4 sm:p-6 lg:grid-cols-3">
        {COLS.map((col) => {
          const list = active.filter((o) => o.status === col.key)
          return (
            <section key={col.key} className="flex min-h-[260px] flex-col rounded-xl bg-muted/25 p-2.5 lg:min-h-0">
              <div className="mb-2.5 flex items-center justify-between px-1.5"><h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider"><col.icon className="size-4" />{col.title}</h2><span className="tnum rounded-full bg-card px-2.5 py-0.5 text-sm font-bold">{list.length}</span></div>
              <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
                {list.length === 0 && <div className="grid h-40 place-items-center rounded-lg border border-dashed text-[13px] text-muted-foreground"><div className="text-center"><Utensils className="mx-auto mb-2 size-5 opacity-60" />Nothing here</div></div>}
                {list.map((o) => {
                  const age = now - o.createdAt
                  const urgent = col.key !== 'ready' && age > alertMs
                  const warn = col.key !== 'ready' && !urgent && age > target
                  const TIcon = TYPE_ICON[o.type]
                  const priority = urgent ? 'High' : o.type === 'delivery' || warn ? 'Medium' : 'Normal'
                  return (
                    <article key={o.id} className={cn('overflow-hidden rounded-xl border-2 bg-card shadow-sm', urgent ? 'border-destructive/70' : warn ? 'border-warning/70' : 'border-border')}>
                      <div className={cn('flex items-center justify-between px-3.5 py-2.5', urgent ? 'bg-destructive/12' : warn ? 'bg-warning/15' : 'bg-muted/40')}>
                        <div className="flex items-center gap-2.5"><span className="text-lg font-extrabold tracking-tight">{o.id.replace('ORD-', '#')}</span><span className="flex items-center gap-1 rounded-md bg-card/70 px-2 py-0.5 text-xs font-bold capitalize"><TIcon className="size-3.5" />{o.table || o.type}</span></div>
                        <div className="text-right"><p className={cn('tnum flex items-center justify-end gap-1.5 text-xl font-extrabold leading-none', urgent && 'text-destructive anim-pulse', warn && 'text-warning-foreground')}><Clock className="size-4" />{mmss(age)}</p><p className="mt-1 text-[11px] text-muted-foreground">Placed {fmtTime(o.createdAt)}</p></div>
                      </div>
                      <ul className="divide-y px-3.5">
                        {o.items.map((l, i) => (
                          <li key={i} className="py-2.5">
                            <div className="flex items-baseline gap-3"><span className="tnum text-xl font-extrabold text-primary">{l.qty}×</span><span className="text-[15px] font-bold leading-snug">{l.name}</span></div>
                            {(l.variant || l.addons?.length > 0) && <p className="ml-9 mt-0.5 text-[13px] text-muted-foreground">{[l.variant?.name, ...(l.addons || []).map((a) => `+ ${a.name}`)].filter(Boolean).join(' · ')}</p>}
                            {l.note && <p className="ml-9 mt-1 inline-block rounded bg-warning/18 px-2 py-0.5 text-[13px] font-semibold text-warning-foreground">⚠ {l.note}</p>}
                          </li>
                        ))}
                      </ul>
                      {o.note && !o.items.some((l) => l.note === o.note) && <p className="mx-3.5 mb-2 rounded bg-warning/18 px-2.5 py-1.5 text-[13px] font-semibold text-warning-foreground">Note: {o.note}</p>}
                      <div className="flex items-center gap-2 border-t bg-muted/20 p-2.5">
                        <span className={cn('rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide', priority === 'High' ? 'bg-destructive/12 text-destructive' : priority === 'Medium' ? 'bg-warning/18 text-warning-foreground' : 'bg-muted text-muted-foreground')}>{priority}</span>
                        {col.key !== 'pending' && <Button variant="ghost" size="icon" title="Move back" onClick={() => actions.updateOrderStatus(o.id, col.key === 'ready' ? 'preparing' : 'pending', true)}><Undo2 className="size-4" /></Button>}
                        <Button size="lg" icon={col.ctaIcon} className="ml-auto h-12 flex-1 text-[15px]" onClick={() => actions.updateOrderStatus(o.id, col.next, true)}>{col.cta}</Button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
      {lastDone.length > 0 && (
        <div className="no-scrollbar flex items-center gap-3 overflow-x-auto border-t px-4 py-2.5 text-xs sm:px-6">
          <span className="shrink-0 font-bold uppercase tracking-wider text-muted-foreground">Recently served</span>
          {lastDone.map((o) => <span key={o.id} className="flex shrink-0 items-center gap-2 rounded-md border bg-card px-2.5 py-1.5"><CheckCheck className="size-3.5 text-primary" /><b>{o.id}</b><span className="text-muted-foreground">{o.items.length} item(s)</span><button onClick={() => actions.updateOrderStatus(o.id, 'ready', true)} className="font-semibold text-primary hover:underline">Recall</button></span>)}
        </div>
      )}
    </div>
  )
}
