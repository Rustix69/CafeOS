import { DAY, isoDay, startOfDay } from './formatters.js'
import { lineUnit } from './calculations.js'

export const isToday = (t) => startOfDay(t) === startOfDay(Date.now())

export function dayAggregate(orders, date = Date.now()) {
  const d = {
    date: isoDay(date), ts: startOfDay(date), revenue: 0, orders: 0, dineIn: 0, takeaway: 0, delivery: 0,
    payments: { upi: 0, cash: 0, card: 0, split: 0 }, tax: 0, discounts: 0, refunds: 0,
    hourly: Array(24).fill(0), hourlyOrders: Array(24).fill(0), byProduct: {}, byCategory: {},
  }
  for (const o of orders) {
    if (o.status === 'cancelled') { if (o.payment.status === 'refunded') d.refunds += o.totals.total; continue }
    d.revenue += o.totals.total
    d.orders += 1
    if (o.type === 'dine-in') d.dineIn++; else if (o.type === 'takeaway') d.takeaway++; else d.delivery++
    d.tax += o.totals.tax
    d.discounts += o.totals.discount
    const h = new Date(o.createdAt).getHours()
    d.hourly[h] += o.totals.total
    d.hourlyOrders[h] += 1
    if (o.payment.status === 'paid') {
      const k = o.payment.splits?.length > 1 ? 'split' : o.payment.method || 'cash'
      d.payments[k] = (d.payments[k] || 0) + o.totals.total
    }
    for (const l of o.items) {
      d.byProduct[l.itemId] = (d.byProduct[l.itemId] || 0) + l.qty
      d.byCategory[l.category] = (d.byCategory[l.category] || 0) + lineUnit(l) * l.qty
    }
  }
  return d
}

export function rangeBounds(range, custom) {
  const today = startOfDay()
  switch (range) {
    case 'today': return [today, today]
    case 'yesterday': return [today - DAY, today - DAY]
    case '7d': return [today - 6 * DAY, today]
    case '30d': return [today - 29 * DAY, today]
    case 'custom': return [startOfDay(new Date(custom.start || Date.now())), startOfDay(new Date(custom.end || Date.now()))]
    default: return [today - 6 * DAY, today]
  }
}

/** Day aggregates for [start,end] using history + live orders for today */
export function daysInRange(start, end, history, orders) {
  const out = []
  const today = startOfDay()
  const todayAgg = dayAggregate(orders.filter((o) => isToday(o.createdAt)))
  for (let t = start; t <= end; t += DAY) {
    if (t === today) out.push(todayAgg)
    else { const h = history.find((x) => x.ts === t); if (h) out.push(h) }
  }
  return out
}

export function sumDays(days) {
  const s = { revenue: 0, orders: 0, dineIn: 0, takeaway: 0, delivery: 0, tax: 0, discounts: 0, refunds: 0, payments: { upi: 0, cash: 0, card: 0, split: 0 }, hourly: Array(24).fill(0), hourlyOrders: Array(24).fill(0), byProduct: {}, byCategory: {} }
  for (const d of days) {
    ;['revenue', 'orders', 'dineIn', 'takeaway', 'delivery', 'tax', 'discounts', 'refunds'].forEach((k) => (s[k] += d[k]))
    Object.keys(s.payments).forEach((k) => (s.payments[k] += d.payments[k] || 0))
    d.hourly.forEach((v, i) => (s.hourly[i] += v))
    d.hourlyOrders.forEach((v, i) => (s.hourlyOrders[i] += v))
    Object.entries(d.byProduct).forEach(([k, v]) => (s.byProduct[k] = (s.byProduct[k] || 0) + v))
    Object.entries(d.byCategory).forEach(([k, v]) => (s.byCategory[k] = (s.byCategory[k] || 0) + v))
  }
  s.aov = s.orders ? s.revenue / s.orders : 0
  return s
}

export const topProducts = (byProduct, menu, n = 5) =>
  Object.entries(byProduct)
    .map(([id, qty]) => { const m = menu.find((x) => x.id === id); return m ? { id, name: m.name, category: m.category, qty, revenue: qty * m.price, veg: m.veg } : null })
    .filter(Boolean).sort((a, b) => b.qty - a.qty).slice(0, n)
