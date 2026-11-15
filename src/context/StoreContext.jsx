import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createSeed, recipeFor, buildHistory } from '../data/mockData.js'
import { calcTotals, lineUnit } from '../utils/calculations.js'
import { isoDay, uid } from '../utils/formatters.js'
import { useToast } from '../components/common/Toast.jsx'

const KEY = 'cafeos-demo-v4'
const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.version === 3 && s.seedDay === isoDay(Date.now())) return s
    }
  } catch { /* ignore */ }
  return { ...createSeed(), seedDay: isoDay(Date.now()) }
}

const ACTIVE = ['pending', 'preparing', 'ready']

export function StoreProvider({ children }) {
  const toast = useToast()
  const [state, setState] = useState(load)
  const ref = useRef(state)
  const history = useMemo(() => buildHistory(Date.now(), state.menu.length ? state.menu : undefined), []) // eslint-disable-line

  const commit = useCallback((fn) => {
    const next = fn(ref.current)
    ref.current = next
    setState(next)
    return next
  }, [])

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota */ }
  }, [state])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.system.theme === 'dark')
  }, [state.settings.system.theme])

  const me = state.staff.find((s) => s.id === state.currentUserId) || state.staff[0]
  const notify = (s, n) => ({ ...s, notifications: [{ id: uid('n'), at: Date.now(), read: false, ...n }, ...s.notifications].slice(0, 40) })

  /* free a table once its order is settled */
  const maybeFreeTable = (s, order) => {
    if (!order?.table) return s
    if (order.status === 'cancelled' || (order.status === 'completed' && order.payment.status === 'paid')) {
      return { ...s, tables: s.tables.map((t) => (t.id === order.table && t.orderId === order.id ? { ...t, status: 'available', orderId: null, guests: 0, since: null } : t.mergedInto === order.table ? { ...t, status: 'available', mergedInto: null, guests: 0, since: null } : t)) }
    }
    return s
  }

  const actions = useMemo(() => {
    const a = {}

    /* ---- orders ---- */
    a.createOrder = ({ items, type, table, customer, discount, payment, note, guests }) => {
      let created
      commit((s) => {
        const billing = s.settings.billing
        const totals = calcTotals(items.map((l) => ({ unit: lineUnit(l), qty: l.qty, gst: l.gst })), discount, { inclusive: billing.inclusive })
        const seq = s.settings.orders.nextOrder
        const now = Date.now()
        created = {
          id: `${s.settings.orders.orderPrefix}-${seq}`, seq, createdAt: now, updatedAt: now,
          customerId: customer?.id || null, customerName: customer?.name || 'Walk-in', type, table: type === 'dine-in' ? table : null,
          items, note: note || '', discount: discount && discount.value > 0 ? discount : null, totals,
          payment: payment ? { ...payment, status: 'paid' } : { method: null, status: 'unpaid', splits: [] },
          status: 'pending', staffId: s.currentUserId, invoiceNo: `${billing.invoicePrefix}-${String(billing.invoiceStart + (seq - 1150)).padStart(5, '0')}`,
          history: [{ status: 'pending', at: now }],
        }
        let next = { ...s, orders: [created, ...s.orders], settings: { ...s.settings, orders: { ...s.settings.orders, nextOrder: seq + 1 } } }
        /* table */
        if (created.table) next = { ...next, tables: next.tables.map((t) => (t.id === created.table ? { ...t, status: 'occupied', orderId: created.id, guests: guests || t.guests || 2, since: now } : t)) }
        /* customer */
        if (customer) next = { ...next, customers: next.customers.map((c) => (c.id === customer.id ? { ...c, totalOrders: c.totalOrders + 1, spend: c.spend + totals.total, points: c.points + Math.floor(totals.total / 20), lastOrder: now } : c)) }
        /* inventory */
        const use = {}
        items.forEach((l) => {
          const m = next.menu.find((x) => x.id === l.itemId)
          if (m) recipeFor(m).forEach(([ing, q]) => { use[ing] = (use[ing] || 0) + q * l.qty })
        })
        const mv = []
        const lowNow = []
        const inventory = next.inventory.map((ing) => {
          if (!use[ing.id]) return ing
          const stock = Math.max(0, +(ing.stock - use[ing.id]).toFixed(3))
          mv.push({ id: uid('mv'), at: now, ingredientId: ing.id, type: 'usage', qty: -+use[ing.id].toFixed(3), note: `Order ${created.id}`, by: 'System' })
          if (ing.stock > ing.min && stock <= ing.min) lowNow.push(ing.name)
          return { ...ing, stock, updated: now }
        })
        next = { ...next, inventory, movements: [...mv, ...next.movements] }
        lowNow.forEach((n) => { next = notify(next, { type: 'stock', title: `Low stock: ${n}`, body: 'Stock dropped below the minimum level.' }) })
        if (s.settings.notifications.newOrder) next = notify(next, { type: 'order', title: `New order ${created.id}`, body: `${type} · ₹${totals.total} · ${items.length} item(s)` })
        return next
      })
      toast(`Order ${created.id} created`, { desc: payment ? 'Payment received. KOT sent to kitchen.' : 'KOT sent to kitchen. Payment pending.' })
      return created
    }

    a.updateOrderStatus = (id, status, silent) => {
      commit((s) => {
        const orders = s.orders.map((o) => (o.id === id ? { ...o, status, updatedAt: Date.now(), history: [...(o.history || []), { status, at: Date.now() }] } : o))
        return maybeFreeTable({ ...s, orders }, orders.find((o) => o.id === id))
      })
      if (!silent) toast(`Order ${id} marked ${status}`)
    }

    a.payOrder = (id, payment) => {
      commit((s) => {
        const orders = s.orders.map((o) => (o.id === id ? { ...o, payment: { ...payment, status: 'paid' }, updatedAt: Date.now() } : o))
        return maybeFreeTable({ ...s, orders }, orders.find((o) => o.id === id))
      })
      toast(`Payment recorded for ${id}`)
    }

    a.cancelOrder = (id, reason) => {
      commit((s) => {
        const orders = s.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled', cancelReason: reason, payment: { ...o.payment, status: o.payment.status === 'paid' ? 'refunded' : 'unpaid' }, updatedAt: Date.now(), history: [...(o.history || []), { status: 'cancelled', at: Date.now() }] } : o))
        return maybeFreeTable({ ...s, orders }, orders.find((o) => o.id === id))
      })
      toast(`Order ${id} cancelled`, { type: 'warning' })
    }

    /* ---- tables ---- */
    const patchTable = (id, patch) => commit((s) => ({ ...s, tables: s.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
    a.seatTable = (id, guests) => { patchTable(id, { status: 'occupied', guests, since: Date.now(), reservedFor: null }); toast(`Table ${id} seated`, { desc: `${guests} guests` }) }
    a.reserveTable = (id, name, guests, minutes) => { patchTable(id, { status: 'reserved', reservedFor: name, guests, reservedAt: Date.now() + minutes * 60000 }); toast(`Table ${id} reserved for ${name}`) }
    a.markAvailable = (id) => {
      commit((s) => ({ ...s, tables: s.tables.map((t) => (t.id === id || t.mergedInto === id ? { ...t, status: 'available', orderId: null, guests: 0, since: null, reservedFor: null, reservedAt: null, mergedInto: null } : t)) }))
      toast(`Table ${id} is now available`)
    }
    a.assignOrder = (tableId, orderId) => {
      commit((s) => {
        const o = s.orders.find((x) => x.id === orderId)
        return { ...s, orders: s.orders.map((x) => (x.id === orderId ? { ...x, table: tableId, type: 'dine-in' } : x)), tables: s.tables.map((t) => (t.id === tableId ? { ...t, status: 'occupied', orderId, guests: t.guests || 2, since: o?.createdAt || Date.now(), reservedFor: null } : t)) }
      })
      toast(`Order ${orderId} assigned to ${tableId}`)
    }
    a.transferTable = (from, to) => {
      commit((s) => {
        const src = s.tables.find((t) => t.id === from)
        return {
          ...s,
          orders: s.orders.map((o) => (o.id === src.orderId ? { ...o, table: to } : o)),
          tables: s.tables.map((t) => (t.id === to ? { ...t, status: 'occupied', orderId: src.orderId, guests: src.guests, since: src.since, reservedFor: null } : t.id === from ? { ...t, status: 'available', orderId: null, guests: 0, since: null } : t)),
        }
      })
      toast(`Table ${from} transferred to ${to}`)
    }
    a.mergeTables = (primary, others) => {
      commit((s) => {
        const guests = [primary, ...others].reduce((n, id) => n + (s.tables.find((t) => t.id === id)?.guests || 0), 0)
        return { ...s, tables: s.tables.map((t) => (t.id === primary ? { ...t, guests, status: 'occupied', since: t.since || Date.now() } : others.includes(t.id) ? { ...t, status: 'occupied', mergedInto: primary, guests: 0, since: null, orderId: null } : t)) }
      })
      toast(`Merged ${others.join(', ')} into ${primary}`)
    }
    a.addTable = ({ name, seats, area }) => {
      commit((s) => ({ ...s, tables: [...s.tables, { id: name, name, seats: +seats, area, status: 'available', guests: 0, orderId: null, since: null }] }))
      toast(`Table ${name} created`)
    }
    a.deleteTable = (id) => { commit((s) => ({ ...s, tables: s.tables.filter((t) => t.id !== id) })); toast(`Table ${id} removed`, { type: 'warning' }) }

    /* ---- menu ---- */
    a.saveMenuItem = (item) => {
      commit((s) => {
        const exists = s.menu.some((m) => m.id === item.id)
        return { ...s, menu: exists ? s.menu.map((m) => (m.id === item.id ? item : m)) : [{ ...item, pop: 5 }, ...s.menu] }
      })
      toast(`${item.name} saved`)
    }
    a.deleteMenuItem = (id) => { commit((s) => ({ ...s, menu: s.menu.filter((m) => m.id !== id) })); toast('Menu item deleted', { type: 'warning' }) }
    a.toggleAvailability = (id) => commit((s) => ({ ...s, menu: s.menu.map((m) => (m.id === id ? { ...m, available: !m.available } : m)) }))
    a.addCategory = (name) => { commit((s) => ({ ...s, categories: [...s.categories, name] })); toast(`Category "${name}" added`) }
    a.renameCategory = (from, to) => { commit((s) => ({ ...s, categories: s.categories.map((c) => (c === from ? to : c)), menu: s.menu.map((m) => (m.category === from ? { ...m, category: to } : m)) })); toast('Category renamed') }
    a.deleteCategory = (name) => { commit((s) => ({ ...s, categories: s.categories.filter((c) => c !== name) })); toast(`Category "${name}" deleted`, { type: 'warning' }) }

    /* ---- customers ---- */
    a.saveCustomer = (c) => {
      commit((s) => {
        const exists = s.customers.some((x) => x.id === c.id)
        return { ...s, customers: exists ? s.customers.map((x) => (x.id === c.id ? { ...x, ...c } : x)) : [{ totalOrders: 0, spend: 0, points: 0, lastOrder: null, joined: Date.now(), tier: 'Bronze', ...c }, ...s.customers] }
      })
      toast(`Customer ${c.name} saved`)
    }
    a.deleteCustomer = (id) => { commit((s) => ({ ...s, customers: s.customers.filter((c) => c.id !== id) })); toast('Customer removed', { type: 'warning' }) }
    a.adjustPoints = (id, pts) => { commit((s) => ({ ...s, customers: s.customers.map((c) => (c.id === id ? { ...c, points: Math.max(0, c.points + pts) } : c)) })); toast(`${pts > 0 ? 'Added' : 'Deducted'} ${Math.abs(pts)} loyalty points`) }

    /* ---- staff ---- */
    a.saveStaff = (st) => {
      commit((s) => {
        const exists = s.staff.some((x) => x.id === st.id)
        return { ...s, staff: exists ? s.staff.map((x) => (x.id === st.id ? { ...x, ...st } : x)) : [{ active: true, joined: isoDay(Date.now()), activity: [{ text: 'Account created', at: Date.now() }], ...st }, ...s.staff] }
      })
      toast(`${st.name} saved`)
    }
    a.toggleStaff = (id) => {
      commit((s) => ({ ...s, staff: s.staff.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) }))
      toast('Account status updated')
    }
    a.deleteStaff = (id) => { commit((s) => ({ ...s, staff: s.staff.filter((x) => x.id !== id) })); toast('Employee removed', { type: 'warning' }) }
    a.switchUser = (id) => commit((s) => ({ ...s, currentUserId: id }))

    /* ---- inventory ---- */
    const log = (s, ingredientId, type, qty, note) => ({ ...s, movements: [{ id: uid('mv'), at: Date.now(), ingredientId, type, qty, note, by: s.staff.find((x) => x.id === s.currentUserId)?.name || 'System' }, ...s.movements] })
    a.saveIngredient = (ing) => {
      commit((s) => {
        const exists = s.inventory.some((x) => x.id === ing.id)
        const row = { ...ing, updated: Date.now() }
        let next = { ...s, inventory: exists ? s.inventory.map((x) => (x.id === ing.id ? row : x)) : [row, ...s.inventory] }
        if (!exists && row.stock) next = log(next, row.id, 'opening', row.stock, 'Opening stock')
        return next
      })
      toast(`${ing.name} saved`)
    }
    a.deleteIngredient = (id) => { commit((s) => ({ ...s, inventory: s.inventory.filter((x) => x.id !== id) })); toast('Ingredient deleted', { type: 'warning' }) }
    a.adjustStock = (id, qty, type, note) => {
      commit((s) => {
        const next = { ...s, inventory: s.inventory.map((x) => (x.id === id ? { ...x, stock: Math.max(0, +(x.stock + qty).toFixed(3)), updated: Date.now() } : x)) }
        return log(next, id, type, qty, note)
      })
      toast('Stock updated')
    }
    a.addWastage = ({ ingredientId, qty, reason }) => {
      commit((s) => {
        let next = { ...s, wastage: [{ id: uid('w'), date: Date.now(), ingredientId, qty, reason, by: s.staff.find((x) => x.id === s.currentUserId)?.name }, ...s.wastage], inventory: s.inventory.map((x) => (x.id === ingredientId ? { ...x, stock: Math.max(0, +(x.stock - qty).toFixed(3)), updated: Date.now() } : x)) }
        next = log(next, ingredientId, 'wastage', -qty, reason)
        return next
      })
      toast('Wastage recorded', { type: 'warning' })
    }
    a.addPurchase = ({ supplierId, invoice, items, date }) => {
      commit((s) => {
        const total = items.reduce((n, i) => n + i.qty * i.cost, 0)
        let next = { ...s, purchases: [{ id: uid('p'), date: date || Date.now(), supplierId, invoice, items, total, status: 'received' }, ...s.purchases], suppliers: s.suppliers.map((x) => (x.id === supplierId ? { ...x, lastOrder: 0 } : x)) }
        items.forEach((i) => {
          next = { ...next, inventory: next.inventory.map((x) => (x.id === i.ingredientId ? { ...x, stock: +(x.stock + i.qty).toFixed(3), cost: i.cost, updated: Date.now() } : x)) }
          next = log(next, i.ingredientId, 'purchase', i.qty, `PO ${invoice}`)
        })
        return next
      })
      toast('Purchase entry recorded', { desc: 'Stock levels updated.' })
    }
    a.saveSupplier = (sp) => {
      commit((s) => {
        const exists = s.suppliers.some((x) => x.id === sp.id)
        return { ...s, suppliers: exists ? s.suppliers.map((x) => (x.id === sp.id ? sp : x)) : [...s.suppliers, { lastOrder: 0, ...sp }] }
      })
      toast(`Supplier ${sp.name} saved`)
    }
    a.deleteSupplier = (id) => { commit((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) })); toast('Supplier removed', { type: 'warning' }) }

    /* ---- expenses ---- */
    a.saveExpense = (e) => {
      commit((s) => {
        const exists = s.expenses.some((x) => x.id === e.id)
        return { ...s, expenses: exists ? s.expenses.map((x) => (x.id === e.id ? e : x)) : [e, ...s.expenses] }
      })
      toast('Expense saved')
    }
    a.deleteExpense = (id) => { commit((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) })); toast('Expense deleted', { type: 'warning' }) }

    /* ---- settings / misc ---- */
    a.updateSettings = (section, patch, silent) => {
      commit((s) => ({ ...s, settings: { ...s.settings, [section]: { ...s.settings[section], ...patch } } }))
      if (!silent) toast('Settings saved')
    }
    a.setPermission = (role, module, v) => commit((s) => ({ ...s, settings: { ...s.settings, permissions: { ...s.settings.permissions, [role]: { ...s.settings.permissions[role], [module]: v } } } }))
    a.markAllRead = () => commit((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
    a.readNotification = (id) => commit((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
    a.clearNotifications = () => commit((s) => ({ ...s, notifications: [] }))
    a.resetDemo = () => {
      try { localStorage.removeItem(KEY) } catch { /* ignore */ }
      commit(() => ({ ...createSeed(), seedDay: isoDay(Date.now()) }))
      toast('Demo data reset', { type: 'info' })
    }
    return a
  }, [commit, toast])

  const value = useMemo(() => ({ ...state, me, history, actions, activeStatuses: ACTIVE }), [state, history, actions, me])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
