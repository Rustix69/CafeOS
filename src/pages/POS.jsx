import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronUp, ClipboardPen, CookingPot, Minus, Pencil, Percent, Plus, Receipt, ReceiptText, Search, ShoppingBag, SlidersHorizontal, Trash2, UserRound, X, Users } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../components/common/Toast.jsx'
import Button from '../components/common/Button.jsx'
import ProductImage from '../components/common/ProductImage.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { Segmented, Select } from '../components/common/Form.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import ItemCustomizer from '../components/pos/ItemCustomizer.jsx'
import CustomerPicker from '../components/pos/CustomerPicker.jsx'
import DiscountModal from '../components/pos/DiscountModal.jsx'
import CheckoutModal from '../components/orders/CheckoutModal.jsx'
import ReceiptModal from '../components/orders/Receipt.jsx'
import { buildLine, ORDER_TYPES, recipeFor } from '../data/mockData.js'
import { cartTotals, lineKey, lineUnit } from '../utils/calculations.js'
import { cn, inr, inr2 } from '../utils/formatters.js'

const CART_KEY = 'cafeos-cart-v1'
const EMPTY = { lines: [], type: 'dine-in', table: '', guests: 2, customerId: null, discount: null, note: '' }
const loadCart = () => { try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(CART_KEY) || '{}') } } catch { return EMPTY } }

const Dot = ({ veg }) => <span className={cn('grid size-3.5 shrink-0 place-items-center rounded-[3px] border', veg ? 'border-primary' : 'border-destructive')}><span className={cn('size-1.5 rounded-full', veg ? 'bg-primary' : 'bg-destructive')} /></span>

export default function POS() {
  const { menu, categories, tables, customers, inventory, settings, actions, orders } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [cart, setCart] = useState(loadCart)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All Items')
  const [custom, setCustom] = useState(null) // {item, index?}
  const [pickCustomer, setPickCustomer] = useState(false)
  const [discOpen, setDiscOpen] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [done, setDone] = useState(null)
  const [clearAsk, setClearAsk] = useState(false)
  const [mobileCart, setMobileCart] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch { /* ignore */ } }, [cart])
  useEffect(() => {
    const t = params.get('table')
    if (t) { setCart((c) => ({ ...c, type: 'dine-in', table: t })); setParams({}, { replace: true }) }
  }, [params, setParams])
  useEffect(() => { if (!cart.lines.length) setMobileCart(false) }, [cart.lines.length])

  const patch = (p) => setCart((c) => ({ ...c, ...p }))
  const customer = customers.find((c) => c.id === cart.customerId) || null
  const totals = useMemo(() => cartTotals(cart.lines, cart.discount, settings), [cart.lines, cart.discount, settings])
  const freeTables = tables.filter((t) => t.status === 'available' || t.status === 'reserved' && false)

  const unavailable = (it) => !it.available || recipeFor(it).some(([id]) => { const g = inventory.find((x) => x.id === id); return g && g.stock <= 0 })
  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    return menu.filter((m) => (cat === 'All Items' || m.category === cat) && (!s || m.name.toLowerCase().includes(s) || m.category.toLowerCase().includes(s)))
  }, [menu, cat, q])
  const catCounts = useMemo(() => Object.fromEntries(categories.map((c) => [c, menu.filter((m) => m.category === c).length])), [menu, categories])

  const addLine = (item, opts = {}) => {
    const variant = opts.variant !== undefined ? opts.variant : item.variants?.find((v) => v.delta === 0) || item.variants?.[0] || null
    const line = buildLine(item, opts.qty || 1, variant, opts.addons || [], opts.note || '')
    const key = lineKey(line)
    setCart((c) => {
      const ex = c.lines.find((l) => lineKey(l) === key)
      return { ...c, lines: ex ? c.lines.map((l) => (l === ex ? { ...l, qty: l.qty + line.qty } : l)) : [...c.lines, line] }
    })
  }
  const setQty = (i, d) => setCart((c) => ({ ...c, lines: c.lines.map((l, j) => (j === i ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0) }))
  const remove = (i) => setCart((c) => ({ ...c, lines: c.lines.filter((_, j) => j !== i) }))
  const reset = () => { setCart({ ...EMPTY, type: settings.orders.defaultType }); setNoteOpen(false) }

  const onSearchKey = (e) => {
    if (e.key === 'Enter' && visible[0]) { const it = visible[0]; if (!unavailable(it)) { addLine(it); toast(`Added ${it.name}`, { duration: 1200 }); setQ('') } }
  }
  const needTable = cart.type === 'dine-in' && !cart.table
  const guard = () => {
    if (!cart.lines.length) { toast('Add items to the order first', { type: 'warning' }); return false }
    if (needTable) { toast('Select a table for this dine-in order', { type: 'warning' }); return false }
    return true
  }
  const place = (payment) => {
    const o = actions.createOrder({ items: cart.lines, type: cart.type, table: cart.table, customer, discount: cart.discount, payment, note: cart.note, guests: cart.guests })
    reset(); setCheckout(false); setMobileCart(false)
    if (payment) setDone(o)
  }
  const nextNo = settings.orders.nextOrder

  /* ------- cart panel ------- */
  const CartPanel = (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div><h2 className="text-[15px] font-extrabold tracking-tight">Current order</h2><p className="text-xs text-muted-foreground">{settings.orders.orderPrefix}-{nextNo} · {totals.itemCount} item{totals.itemCount !== 1 && 's'}</p></div>
        <div className="flex items-center gap-1">
          {cart.lines.length > 0 && <Button variant="ghost" size="sm" icon={Trash2} className="text-destructive hover:bg-destructive/10" onClick={() => setClearAsk(true)}>Clear</Button>}
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileCart(false)}><X className="size-4" /></Button>
        </div>
      </div>

      <div className="space-y-2.5 border-b px-4 py-3">
        <Segmented value={cart.type} onChange={(t) => patch({ type: t })} options={ORDER_TYPES} size="lg" className="w-full [&>button]:flex-1" />
        {cart.type === 'dine-in' && (
          <div className="flex gap-2">
            <div className="flex-1"><Select value={cart.table} onChange={(e) => { const t = tables.find((x) => x.id === e.target.value); patch({ table: e.target.value, guests: Math.min(cart.guests, t?.seats || 8) }) }} placeholder="Select table…">
              {freeTables.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.seats} seats · {t.area}</option>)}
            </Select></div>
            <div className="flex items-center gap-0.5 rounded-md border"><Button variant="ghost" size="icon-sm" onClick={() => patch({ guests: Math.max(1, cart.guests - 1) })}><Minus className="size-3.5" /></Button><span className="tnum flex w-9 items-center justify-center gap-1 text-[13px] font-bold"><Users className="size-3 text-muted-foreground" />{cart.guests}</span><Button variant="ghost" size="icon-sm" onClick={() => patch({ guests: cart.guests + 1 })}><Plus className="size-3.5" /></Button></div>
          </div>
        )}
        <button onClick={() => setPickCustomer(true)} className="flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition hover:bg-muted/40">
          <UserRound className="size-4 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{customer ? customer.name : 'Walk-in customer'}</span>
          {customer ? <span className="text-xs font-semibold text-primary">{customer.points} pts</span> : <span className="text-xs text-muted-foreground">Add customer</span>}
        </button>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {cart.lines.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No items yet" message="Tap a product to add it to this order. Press Enter in search to add the first match." />
        ) : (
          <ul className="divide-y">
            {cart.lines.map((l, i) => {
              const m = menu.find((x) => x.id === l.itemId)
              return (
                <li key={lineKey(l)} className="px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Dot veg={l.veg} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold leading-tight">{l.name}</p>
                      {(l.variant || l.addons.length > 0) && <p className="mt-0.5 text-xs text-muted-foreground">{[l.variant?.name, ...l.addons.map((a) => `+${a.name}`)].filter(Boolean).join(' · ')}</p>}
                      {l.note && <p className="mt-0.5 text-xs italic text-warning-foreground">“{l.note}”</p>}
                    </div>
                    <p className="tnum text-[13.5px] font-bold">{inr(lineUnit(l) * l.qty)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between pl-6">
                    <div className="flex items-center rounded-lg border">
                      <button onClick={() => setQty(i, -1)} className="grid size-9 place-items-center rounded-l-lg hover:bg-muted/60" aria-label="Decrease">{l.qty === 1 ? <Trash2 className="size-3.5 text-destructive" /> : <Minus className="size-3.5" />}</button>
                      <span className="tnum w-8 text-center text-sm font-extrabold">{l.qty}</span>
                      <button onClick={() => setQty(i, 1)} className="grid size-9 place-items-center rounded-r-lg hover:bg-muted/60" aria-label="Increase"><Plus className="size-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="tnum mr-1 text-xs text-muted-foreground">{inr(lineUnit(l))} each</span>
                      {m && (m.variants?.length > 0 || m.addons?.length > 0 || true) && <Button variant="ghost" size="icon-sm" title="Customise" onClick={() => setCustom({ item: m, index: i })}><Pencil className="size-3.5" /></Button>}
                      <Button variant="ghost" size="icon-sm" title="Remove" className="text-muted-foreground hover:text-destructive" onClick={() => remove(i)}><X className="size-4" /></Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t bg-muted/20 px-4 pb-4 pt-3">
        <div className="mb-2.5 flex gap-2">
          <Button variant="outline" size="sm" icon={Percent} className="flex-1" onClick={() => cart.lines.length ? setDiscOpen(true) : toast('Add items before applying a discount', { type: 'warning' })}>{cart.discount ? `Discount ${cart.discount.type === 'percent' ? cart.discount.value + '%' : inr(cart.discount.value)}` : 'Add discount'}</Button>
          <Button variant="outline" size="sm" icon={ClipboardPen} className="flex-1" onClick={() => setNoteOpen((o) => !o)}>{cart.note ? 'Edit note' : 'Order note'}</Button>
        </div>
        {noteOpen && <textarea value={cart.note} onChange={(e) => patch({ note: e.target.value })} rows={2} placeholder="Special instructions for the kitchen…" className="mb-2.5 w-full rounded-md border bg-card px-3 py-2 text-[13px] outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" />}
        <dl className="space-y-1 text-[13px]">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tnum font-semibold">{inr2(totals.subtotal)}</dd></div>
          {totals.discount > 0 && <div className="flex justify-between text-primary"><dt>Discount{cart.discount?.code && ` (${cart.discount.code})`}</dt><dd className="tnum font-semibold">−{inr2(totals.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted-foreground">CGST {settings.billing.inclusive ? '(incl.)' : ''}</dt><dd className="tnum">{inr2(totals.cgst)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">SGST {settings.billing.inclusive ? '(incl.)' : ''}</dt><dd className="tnum">{inr2(totals.sgst)}</dd></div>
          {Math.abs(totals.roundOff) > 0.004 && <div className="flex justify-between"><dt className="text-muted-foreground">Round off</dt><dd className="tnum">{totals.roundOff > 0 ? '+' : '−'}{Math.abs(totals.roundOff).toFixed(2)}</dd></div>}
        </dl>
        <div className="my-3 flex items-baseline justify-between border-t pt-3"><span className="text-sm font-bold">Grand total</span><span className="tnum text-2xl font-extrabold tracking-tight">{inr2(totals.total)}</span></div>
        <div className="flex gap-2">
          {cart.type === 'dine-in' && <Button variant="outline" size="xl" icon={CookingPot} className="flex-1" onClick={() => { if (!guard()) return; place(null); toast('Table order saved — pay later from Orders or Tables', { type: 'info' }) }}>Send KOT</Button>}
          <Button size="xl" icon={ReceiptText} className="flex-[1.6]" onClick={() => guard() && setCheckout(true)}>Charge {inr(totals.total)}</Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full">
      {/* menu */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="space-y-3 border-b bg-card/60 px-4 pb-3 pt-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
              <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onSearchKey} placeholder="Search menu — press Enter to add" className="h-11 w-full rounded-lg border bg-card pl-10 pr-9 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" />
              {q && <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>}
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">{visible.length} items</p>
            <Button variant="outline" size="lg" icon={ClipboardPen} className="ml-auto hidden sm:inline-flex" onClick={() => nav('/orders')}>Recent orders ({orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status)).length} live)</Button>
          </div>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {['All Items', ...categories].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn('flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-bold transition', cat === c ? 'border-primary bg-primary text-primary-foreground shadow-xs' : 'bg-card hover:bg-muted/60')}>
                {c}<span className={cn('tnum rounded-full px-1.5 text-[11px]', cat === c ? 'bg-white/25' : 'bg-muted text-muted-foreground')}>{c === 'All Items' ? menu.length : catCounts[c]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4 pb-24 sm:p-5 lg:pb-5">
          {visible.length === 0 ? <EmptyState icon={Search} title="No items found" message="Try a different search term or category." action={<Button variant="outline" onClick={() => { setQ(''); setCat('All Items') }}>Reset filters</Button>} /> : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visible.map((it) => {
                const out = unavailable(it)
                const inCart = cart.lines.filter((l) => l.itemId === it.id).reduce((s, l) => s + l.qty, 0)
                const hasOpts = it.variants?.length > 0 || it.addons?.length > 0
                return (
                  <div key={it.id} className={cn('group relative overflow-hidden rounded-xl border bg-card shadow-xs transition', out ? 'opacity-60' : 'hover:border-primary/50 hover:shadow-md active:scale-[0.985]', inCart > 0 && 'border-primary ring-2 ring-primary/20')}>
                    <button disabled={out} onClick={() => addLine(it)} className="block w-full text-left" aria-label={`Add ${it.name}`}>
                      <div className="relative">
                        <ProductImage item={it} className="aspect-[4/3] w-full" />
                        <span className="absolute left-2 top-2 rounded bg-white/90 p-0.5 shadow-xs"><Dot veg={it.veg} /></span>
                        {out && <span className="absolute inset-0 grid place-items-center bg-card/70 text-xs font-extrabold uppercase tracking-wider text-destructive">Unavailable</span>}
                        {inCart > 0 && <span className="tnum absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground shadow">{inCart}</span>}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-[13.5px] font-bold leading-tight">{it.name}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="tnum text-[15px] font-extrabold">{inr(it.price)}</span>
                          <span className={cn('flex items-center gap-1 text-[11px] font-semibold', out ? 'text-destructive' : 'text-primary')}><span className={cn('size-1.5 rounded-full', out ? 'bg-destructive' : 'bg-primary')} />{out ? 'Out' : 'Available'}</span>
                        </div>
                      </div>
                    </button>
                    {hasOpts && !out && <button onClick={() => setCustom({ item: it })} title="Customise" className="absolute bottom-[3.1rem] right-2 grid size-8 place-items-center rounded-full border bg-card shadow-sm transition hover:bg-primary hover:text-primary-foreground"><SlidersHorizontal className="size-3.5" /></button>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* desktop cart */}
      <aside className="hidden w-[390px] shrink-0 border-l lg:block xl:w-[420px]">{CartPanel}</aside>

      {/* mobile/tablet cart */}
      {mobileCart && <div className="fixed inset-0 z-40 lg:hidden"><div className="anim-fade absolute inset-0 bg-foreground/40" onClick={() => setMobileCart(false)} /><div className="anim-drawer absolute inset-y-0 right-0 w-full max-w-md shadow-xl">{CartPanel}</div></div>}
      {!mobileCart && (
        <button onClick={() => setMobileCart(true)} className="fixed inset-x-4 bottom-4 z-30 flex h-14 items-center justify-between rounded-xl bg-primary px-5 text-primary-foreground shadow-lg lg:hidden">
          <span className="flex items-center gap-2.5 font-bold"><ShoppingBag className="size-5" />{totals.itemCount} item{totals.itemCount !== 1 && 's'}<ChevronUp className="size-4 opacity-70" /></span>
          <span className="tnum text-lg font-extrabold">{inr(totals.total)}</span>
        </button>
      )}

      {custom && <ItemCustomizer item={custom.item} initial={custom.index !== undefined ? cart.lines[custom.index] : null} onClose={() => setCustom(null)}
        onSave={(o) => {
          if (custom.index !== undefined) setCart((c) => ({ ...c, lines: c.lines.map((l, j) => (j === custom.index ? { ...l, ...o } : l)) }))
          else { addLine(custom.item, o); toast(`Added ${custom.item.name}`, { duration: 1200 }) }
          setCustom(null)
        }} />}
      <CustomerPicker open={pickCustomer} onClose={() => setPickCustomer(false)} selectedId={cart.customerId} onSelect={(c) => patch({ customerId: c?.id || null })} />
      <DiscountModal open={discOpen} onClose={() => setDiscOpen(false)} current={cart.discount} subtotal={totals.subtotal} onApply={(d) => { patch({ discount: d }); toast(d ? 'Discount applied' : 'Discount removed', { type: d ? 'success' : 'info' }) }} />
      <CheckoutModal open={checkout} onClose={() => setCheckout(false)} total={totals.total} subtitle={`${cart.type === 'dine-in' ? 'Table ' + cart.table : cart.type} · ${totals.itemCount} items${customer ? ' · ' + customer.name : ''}`} onConfirm={(p) => place(p)} />
      <ReceiptModal order={done} open={!!done} onClose={() => setDone(null)} />
      <ConfirmDialog open={clearAsk} onClose={() => setClearAsk(false)} title="Clear current order?" message="All items, discount and notes on this order will be removed." confirmLabel="Clear order" onConfirm={reset} />
    </div>
  )
}
