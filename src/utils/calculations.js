export const lineUnit = (it) =>
  (Number(it.price) || 0) + (Number(it.variant?.delta) || 0) + (it.addons || []).reduce((s, a) => s + (Number(a.price) || 0), 0)

export const lineKey = (it) =>
  [it.itemId, it.variant?.name || '', (it.addons || []).map((a) => a.name).sort().join('+'), it.note || ''].join('|')

/**
 * lines: [{ unit, qty, gst }]
 * discount: { type: 'percent' | 'flat', value }
 * opts.inclusive: menu prices already include GST
 */
export function calcTotals(lines, discount, opts = {}) {
  const inclusive = !!opts.inclusive
  const gross = lines.reduce((s, l) => s + l.unit * l.qty, 0)
  let disc = 0
  if (discount && Number(discount.value) > 0) {
    disc = discount.type === 'percent' ? (gross * Math.min(100, discount.value)) / 100 : Math.min(gross, Number(discount.value))
  }
  const ratio = gross > 0 ? (gross - disc) / gross : 0
  let taxable = 0
  let tax = 0
  const byRate = {}
  for (const l of lines) {
    const net = l.unit * l.qty * ratio
    const base = inclusive ? net / (1 + l.gst / 100) : net
    const t = inclusive ? net - base : (net * l.gst) / 100
    taxable += base
    tax += t
    byRate[l.gst] = byRate[l.gst] || { taxable: 0, tax: 0 }
    byRate[l.gst].taxable += base
    byRate[l.gst].tax += t
  }
  const exact = taxable + tax
  const total = Math.round(exact)
  return {
    subtotal: gross,
    discount: disc,
    taxable,
    tax,
    cgst: tax / 2,
    sgst: tax / 2,
    byRate,
    roundOff: total - exact,
    total,
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
  }
}

export const cartTotals = (cart, discount, settings) =>
  calcTotals(cart.map((c) => ({ unit: lineUnit(c), qty: c.qty, gst: c.gst })), discount, { inclusive: settings?.billing?.inclusive })

export const orderTotals = (order) => order.totals
