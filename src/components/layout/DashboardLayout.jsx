import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

const FULL = ['/pos', '/kitchen']

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { const v = localStorage.getItem('cafeos-sidebar'); if (v !== null) return v === '1' } catch { /* ignore */ }
    return typeof window !== 'undefined' && window.innerWidth < 1280
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => { try { localStorage.setItem('cafeos-sidebar', collapsed ? '1' : '0') } catch { /* ignore */ } }, [collapsed])
  useEffect(() => { setMobileOpen(false) }, [loc.pathname])
  const full = FULL.includes(loc.pathname)

  return (
    <div className="flex h-full bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className={full ? 'min-h-0 flex-1 overflow-hidden' : 'scroll-thin min-h-0 flex-1 overflow-y-auto'}>
          {full ? <Outlet /> : <div key={loc.pathname} className="anim-up mx-auto w-full max-w-[1500px] p-4 sm:p-6"><Outlet /></div>}
        </main>
      </div>
    </div>
  )
}
