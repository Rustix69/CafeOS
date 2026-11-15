import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, ChevronsUpDown, Coffee, Check, CircleHelp, LogOut, Moon, Sun, UserCog, X } from 'lucide-react'
import { NAV } from '../../nav.js'
import { cn } from '../../utils/formatters.js'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../common/Toast.jsx'
import Dropdown, { MenuItem, MenuLabel, MenuSep } from '../common/Dropdown.jsx'
import Avatar from '../common/Avatar.jsx'
import HelpModal from './HelpModal.jsx'

function Tip({ tip, children }) {
  const [pos, setPos] = useState(null)
  return (
    <div onMouseEnter={(e) => { if (!tip) return; const r = e.currentTarget.getBoundingClientRect(); setPos({ x: r.right + 10, y: r.top + r.height / 2 }) }} onMouseLeave={() => setPos(null)}>
      {children}
      {pos && <div style={{ left: pos.x, top: pos.y }} className="anim-fade pointer-events-none fixed z-[60] -translate-y-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background shadow-lg">{tip}</div>}
    </div>
  )
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { orders, me, staff, settings, actions } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [help, setHelp] = useState(false)
  const counts = {
    orders: orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status)).length,
    kitchen: orders.filter((o) => o.status === 'pending').length,
  }
  const isCollapsed = collapsed && !mobileOpen
  const dark = settings.system.theme === 'dark'

  return (
    <>
      {mobileOpen && <div className="anim-fade fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 lg:static lg:translate-x-0',
        isCollapsed ? 'w-[68px]' : 'w-64', mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      )}>
        {/* brand */}
        <div className={cn('flex h-14 shrink-0 items-center border-b', isCollapsed ? 'justify-center' : 'justify-between px-4')}>
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs"><Coffee className="size-4.5" /></div>
            {!isCollapsed && <div className="leading-tight"><p className="text-[15px] font-extrabold tracking-tight">CafeOS</p><p className="text-[10.5px] font-medium text-muted-foreground">Smart Cafe Operations</p></div>}
          </div>
          {mobileOpen && <button onClick={() => setMobileOpen(false)} className="rounded p-1.5 hover:bg-muted/60 lg:hidden"><X className="size-4" /></button>}
        </div>

        {/* outlet */}
        <div className={cn('shrink-0 p-3', isCollapsed && 'px-2')}>
          <Dropdown align="left" width="w-60" className="w-full" trigger={
            <Tip tip={isCollapsed ? settings.business.name : null}>
              <button className={cn('flex w-full items-center gap-2.5 rounded-lg border bg-card p-2 text-left shadow-xs transition hover:bg-muted/40', isCollapsed && 'justify-center')}>
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary/15 text-xs font-extrabold text-secondary">TC</span>
                {!isCollapsed && <><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold">{settings.business.name}</span><span className="block truncate text-[11px] text-muted-foreground">Bandra West, Mumbai</span></span><ChevronsUpDown className="size-4 text-muted-foreground" /></>}
              </button>
            </Tip>
          }>
            <MenuLabel>Outlets</MenuLabel>
            <MenuItem icon={Check} className="bg-muted/50 font-bold">The Coffee House · Bandra</MenuItem>
            <MenuItem onClick={() => toast('Multi-outlet view is part of the CafeOS Chain plan', { type: 'info' })} className="pl-9 text-muted-foreground">The Coffee House · Powai</MenuItem>
            <MenuItem onClick={() => toast('Multi-outlet view is part of the CafeOS Chain plan', { type: 'info' })} className="pl-9 text-muted-foreground">The Coffee House · Koregaon Park</MenuItem>
          </Dropdown>
        </div>

        {/* nav */}
        <nav className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {NAV.map((sec) => (
            <div key={sec.section} className="mb-3">
              {!isCollapsed ? <p className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted-foreground/80">{sec.section}</p> : <div className="mx-2 mb-2 h-px bg-border" />}
              <ul className="space-y-0.5">
                {sec.items.map((it) => {
                  const Icon = it.icon
                  const count = it.badge ? counts[it.badge] : 0
                  return (
                    <li key={it.path}>
                      <Tip tip={isCollapsed ? it.label : null}>
                        <NavLink to={it.path} end={it.path === '/'} onClick={() => setMobileOpen(false)}
                          className={({ isActive }) => cn('group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-[13.5px] font-semibold transition-colors', isCollapsed && 'justify-center px-0',
                            isActive ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground/75 hover:bg-muted/60 hover:text-sidebar-foreground')}>
                          {({ isActive }) => (<>
                            {isActive && <span className="absolute -left-3 top-1.5 h-6 w-[3px] rounded-r bg-primary" />}
                            <Icon className="size-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.9} />
                            {!isCollapsed && <span className="flex-1 truncate">{it.label}</span>}
                            {!isCollapsed && count > 0 && <span className={cn('tnum rounded-full px-1.5 py-px text-[11px] font-bold', it.badge === 'kitchen' ? 'bg-warning/20 text-warning-foreground' : 'bg-muted text-muted-foreground')}>{count}</span>}
                            {isCollapsed && count > 0 && <span className="absolute right-2 top-1.5 size-2 rounded-full bg-warning ring-2 ring-sidebar" />}
                          </>)}
                        </NavLink>
                      </Tip>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* bottom */}
        <div className={cn('shrink-0 space-y-1 border-t p-3', isCollapsed && 'px-2')}>
          <Tip tip={isCollapsed ? 'Help & Support' : null}>
            <button onClick={() => setHelp(true)} className={cn('flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-[13.5px] font-semibold text-sidebar-foreground/75 transition-colors hover:bg-muted/60 hover:text-sidebar-foreground', isCollapsed && 'justify-center px-0')}>
              <CircleHelp className="size-[18px]" />{!isCollapsed && 'Help & Support'}
            </button>
          </Tip>
          <Dropdown align="up" width="w-60" className="w-full" trigger={
            <button className={cn('flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-muted/60', isCollapsed && 'justify-center')}>
              <Avatar name={me.name} size="sm" />
              {!isCollapsed && <><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold">{me.name}</span><span className="block truncate text-[11px] text-muted-foreground">{me.role}</span></span><ChevronsUpDown className="size-4 text-muted-foreground" /></>}
            </button>
          }>
            <MenuLabel>Signed in as</MenuLabel>
            <div className="px-2.5 pb-2 text-[13px]"><p className="font-bold">{me.name}</p><p className="text-xs text-muted-foreground">{me.email}</p></div>
            <MenuSep />
            <MenuItem icon={UserCog} onClick={() => nav('/settings')}>Account settings</MenuItem>
            <MenuItem icon={dark ? Sun : Moon} onClick={() => actions.updateSettings('system', { theme: dark ? 'light' : 'dark' }, true)}>{dark ? 'Light mode' : 'Dark mode'}</MenuItem>
            <MenuLabel>Switch user (demo)</MenuLabel>
            {staff.filter((s) => s.active).slice(0, 4).map((s) => <MenuItem key={s.id} onClick={() => { actions.switchUser(s.id); toast(`Switched to ${s.name}`, { type: 'info' }) }}>{s.name}<span className="ml-auto text-[11px] text-muted-foreground">{s.role}</span></MenuItem>)}
            <MenuSep />
            <MenuItem icon={LogOut} danger onClick={() => toast('Signed out (demo) — refresh to continue', { type: 'info' })}>Sign out</MenuItem>
          </Dropdown>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden h-8 w-full items-center justify-center gap-2 rounded-md text-xs font-semibold text-muted-foreground transition hover:bg-muted/60 lg:flex">
            {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" />Collapse</>}
          </button>
        </div>
      </aside>
      <HelpModal open={help} onClose={() => setHelp(false)} />
    </>
  )
}
