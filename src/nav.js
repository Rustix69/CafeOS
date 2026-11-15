import { BarChart3, ChefHat, ClipboardList, Contact, LayoutDashboard, Package, Receipt, ScanLine, Settings, Table2, Users, UtensilsCrossed } from 'lucide-react'

export const NAV = [
  { section: 'Main', items: [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/pos', label: 'Point of Sale', icon: ScanLine },
    { path: '/orders', label: 'Orders', icon: ClipboardList, badge: 'orders' },
    { path: '/tables', label: 'Tables', icon: Table2 },
    { path: '/kitchen', label: 'Kitchen Display', icon: ChefHat, badge: 'kitchen' },
  ] },
  { section: 'Management', items: [
    { path: '/menu', label: 'Menu Management', icon: UtensilsCrossed },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/customers', label: 'Customers', icon: Contact },
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
  ] },
  { section: 'Analytics', items: [{ path: '/reports', label: 'Reports', icon: BarChart3 }] },
  { section: 'System', items: [{ path: '/settings', label: 'Settings', icon: Settings }] },
]
export const ALL_ITEMS = NAV.flatMap((s) => s.items)
