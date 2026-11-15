import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ChefHat, ChevronRight, ClipboardList, Contact, Menu, Package, Search, Store, UtensilsCrossed, Info, CheckCheck, Trash2 } from 'lucide-react'
import { ALL_ITEMS } from '../../nav.js'
import { useStore } from '../../context/StoreContext.jsx'
import { cn, fmtDate, fmtTime, timeAgo } from '../../utils/formatters.js'
import Dropdown from '../common/Dropdown.jsx'
import Avatar from '../common/Avatar.jsx'
import Button from '../common/Button.jsx'

const N_ICON = { stock: Package, order: ClipboardList, kitchen: ChefHat, system: Info }

function GlobalSearch() {
  const { orders, customers, menu } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const input = useRef(null)
  useEffect(() => {
    const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus() } }
    const c = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('keydown', k); document.addEventListener('mousedown', c)
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('mousedown', c) }
  }, [])
  const res = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 1) return []
    const out = []
    ALL_ITEMS.filter((p) => p.label.toLowerCase().includes(s)).slice(0, 3).forEach((p) => out.push({ k: 'p' + p.path, icon: p.icon, title: p.label, sub: 'Go to page', go: p.path }))
    orders.filter((o) => o.id.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s)).slice(0, 4).forEach((o) => out.push({ k: o.id, icon: ClipboardList, title: o.id, sub: `${o.customerName} · ${o.status}`, go: `/orders?q=${o.id}` }))
    customers.filter((c) => c.name.toLowerCase().includes(s) || c.phone.replace(/\s/g, '').includes(s.replace(/\s/g, ''))).slice(0, 3).forEach((c) => out.push({ k: c.id, icon: Contact, title: c.name, sub: c.phone, go: `/customers?q=${encodeURIComponent(c.name)}` }))
    menu.filter((m) => m.name.toLowerCase().includes(s)).slice(0, 3).forEach((m) => out.push({ k: m.id, icon: UtensilsCrossed, title: m.name, sub: `${m.category} · ₹${m.price}`, go: `/menu?q=${encodeURIComponent(m.name)}` }))
    return out
  }, [q, orders, customers, menu])
  const go = (r) => { nav(r.go); setOpen(false); setQ('') }
  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={(e) => e.key === 'Enter' && res[0] && go(res[0])}
        placeholder="Search orders, customers, menu…" className="h-9 w-full rounded-md border bg-muted/30 pl-9 pr-12 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-ring focus:bg-card focus:ring-3 focus:ring-ring/20" />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border bg-card px-1.5 font-mono text-[10px] text-muted-foreground sm:block">Ctrl K</kbd>
      {open && q && (
        <div className="anim-pop absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border bg-popover shadow-lg">
          {res.length === 0 ? <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">No results for “{q}”</p> : (
            <ul className="scroll-thin max-h-80 overflow-y-auto p-1">
              {res.map((r) => { const I = r.icon; return (
                <li key={r.k}><button onClick={() => go(r)} className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-muted/70">
                  <span className="grid size-8 place-items-center rounded-md bg-muted/70 text-muted-foreground"><I className="size-4" /></span>
                  <span className="min-w-0"><span className="block truncate text-[13px] font-semibold">{r.title}</span><span className="block truncate text-xs capitalize text-muted-foreground">{r.sub}</span></span>
                </button></li>
              ) })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function Header({ onMenu }) {
  const { notifications, me, settings, actions } = useStore()
  const loc = useLocation()
  const nav = useNavigate()
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t) }, [])
  const page = ALL_ITEMS.find((i) => (i.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(i.path)))
  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card/80 px-3 backdrop-blur sm:px-5">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="size-5" /></Button>
      <div className="hidden min-w-0 items-center gap-1.5 text-[13px] md:flex">
        <span className="text-muted-foreground">CafeOS</span><ChevronRight className="size-3.5 text-muted-foreground/60" />
        <span className="truncate font-bold">{page?.label || 'Overview'}</span>
      </div>
      <div className="flex flex-1 justify-center md:px-4"><GlobalSearch /></div>
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <div className="hidden items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs xl:flex">
          <Store className="size-3.5 text-muted-foreground" /><span className="font-semibold">{settings.business.name}</span>
          <span className="size-1 rounded-full bg-primary" /><span className="text-muted-foreground">Open</span>
        </div>
        <div className="hidden items-center gap-2 text-xs leading-tight lg:flex">
          <CalendarDays className="size-4 text-muted-foreground" />
          <div><p className="font-semibold">{fmtDate(now)}</p><p className="tnum text-muted-foreground">{fmtTime(now)}</p></div>
        </div>
        <Dropdown width="w-[min(92vw,380px)]" trigger={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-[18px]" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-card">{unread}</span>}
          </Button>
        }>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-2.5 py-2">
              <p className="text-sm font-bold">Notifications {unread > 0 && <span className="ml-1 rounded-full bg-destructive/10 px-1.5 text-xs text-destructive">{unread} new</span>}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="xs" icon={CheckCheck} onClick={actions.markAllRead}>Read all</Button>
                <Button variant="ghost" size="xs" icon={Trash2} onClick={actions.clearNotifications}>Clear</Button>
              </div>
            </div>
            <ul className="scroll-thin max-h-96 overflow-y-auto">
              {notifications.length === 0 && <li className="px-4 py-10 text-center text-[13px] text-muted-foreground">You're all caught up.</li>}
              {notifications.map((n) => { const I = N_ICON[n.type] || Info; return (
                <li key={n.id}><button onClick={() => { actions.readNotification(n.id); nav(n.type === 'stock' ? '/inventory' : n.type === 'order' ? '/orders' : n.type === 'kitchen' ? '/kitchen' : '/reports') }}
                  className={cn('flex w-full gap-3 rounded-md px-2.5 py-2.5 text-left hover:bg-muted/60', !n.read && 'bg-primary/5')}>
                  <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-md', n.type === 'stock' ? 'bg-warning/18 text-warning-foreground' : 'bg-secondary/12 text-secondary')}><I className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[13px] font-semibold">{n.title}{!n.read && <span className="size-1.5 rounded-full bg-primary" />}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span><span className="mt-1 block text-[11px] text-muted-foreground/80">{timeAgo(n.at)}</span></span>
                </button></li>
              ) })}
            </ul>
          </div>
        </Dropdown>
        <Dropdown width="w-52" trigger={<button className="flex items-center gap-2 rounded-full p-0.5 pr-0 transition hover:ring-2 hover:ring-muted sm:rounded-md sm:py-1 sm:pl-1 sm:pr-2"><Avatar name={me.name} size="sm" /><span className="hidden text-left text-xs leading-tight sm:block"><span className="block font-bold">{me.name.split(' ')[0]}</span><span className="text-muted-foreground">{me.role}</span></span></button>}>
          <div className="px-2.5 py-2"><p className="text-[13px] font-bold">{me.name}</p><p className="text-xs text-muted-foreground">{me.email}</p></div>
          <div className="my-1 h-px bg-border" />
          <button onClick={() => nav('/staff')} className="w-full rounded-md px-2.5 py-2 text-left text-[13px] font-medium hover:bg-muted/70">My profile &amp; activity</button>
          <button onClick={() => nav('/settings')} className="w-full rounded-md px-2.5 py-2 text-left text-[13px] font-medium hover:bg-muted/70">Settings</button>
        </Dropdown>
      </div>
    </header>
  )
}
