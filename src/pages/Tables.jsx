import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, Armchair, CalendarClock, Combine, Eye, Link2, Plus, ReceiptText, Timer, Trash2, Users, UtensilsCrossed, Minus } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import useNow from '../hooks/useNow.js'
import PageHeader from '../components/common/PageHeader.jsx'
import Button from '../components/common/Button.jsx'
import Modal from '../components/common/Modal.jsx'
import Drawer from '../components/common/Drawer.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import { Field, Input, Select, Segmented } from '../components/common/Form.jsx'
import OrderDrawer from '../components/orders/OrderDrawer.jsx'
import { cn, duration, fmtTime, inr } from '../utils/formatters.js'

const RING = { available: 'border-primary/30 hover:border-primary/60', occupied: 'border-secondary/40 hover:border-secondary', reserved: 'border-warning/50 hover:border-warning' }
const BAR = { available: 'bg-primary', occupied: 'bg-secondary', reserved: 'bg-warning' }

export default function Tables() {
  const { tables, orders, actions } = useStore()
  const nav = useNavigate()
  const now = useNow(15000)
  const [area, setArea] = useState('All')
  const [sel, setSel] = useState(null)
  const [modal, setModal] = useState(null) // create | transfer | merge | assign | reserve | seat
  const [orderOpen, setOrderOpen] = useState(null)
  const [freeAsk, setFreeAsk] = useState(false)
  const [delAsk, setDelAsk] = useState(false)
  const [form, setForm] = useState({})

  const areas = ['All', ...new Set(tables.map((t) => t.area))]
  const shown = tables.filter((t) => area === 'All' || t.area === area)
  const orderOf = (t) => orders.find((o) => o.id === t.orderId)
  const table = tables.find((t) => t.id === sel)
  const order = table && orderOf(table)
  const counts = useMemo(() => ({
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied' && !t.mergedInto).length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
    seats: tables.reduce((s, t) => s + t.seats, 0),
    guests: tables.filter((t) => t.status === 'occupied').reduce((s, t) => s + t.guests, 0),
  }), [tables])
  const unassigned = orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status) && !o.table && o.payment.status === 'unpaid')
  const open = (m, f = {}) => { setForm(f); setModal(m) }
  const byArea = [...new Set(shown.map((t) => t.area))]

  return (
    <>
      <PageHeader title="Tables" description="Live floor view of your cafe — seat guests, move orders and free up tables."
        actions={<Button icon={Plus} onClick={() => open('create', { name: `T${String(tables.length + 1).padStart(2, '0')}`, seats: 4, area: tables[0]?.area || 'Main Hall' })}>Create table</Button>} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Available', counts.available, 'bg-primary'], ['Occupied', counts.occupied, 'bg-secondary'], ['Reserved', counts.reserved, 'bg-warning']].map(([l, n, c]) => (
          <div key={l} className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-xs"><span className={cn('h-9 w-1.5 rounded-full', c)} /><div><p className="tnum text-xl font-extrabold leading-none">{n}</p><p className="mt-1 text-xs text-muted-foreground">{l}</p></div></div>
        ))}
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-xs"><Users className="size-5 text-muted-foreground" /><div><p className="tnum text-xl font-extrabold leading-none">{counts.guests}<span className="text-sm font-semibold text-muted-foreground">/{counts.seats}</span></p><p className="mt-1 text-xs text-muted-foreground">Guests seated</p></div></div>
      </div>

      <div className="mb-4"><Segmented value={area} onChange={setArea} options={areas} /></div>

      <div className="space-y-6">
        {byArea.map((a) => (
          <section key={a}>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">{a}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shown.filter((t) => t.area === a).map((t) => {
                const o = orderOf(t)
                return (
                  <button key={t.id} onClick={() => setSel(t.id)} className={cn('group relative overflow-hidden rounded-xl border-2 bg-card p-4 text-left shadow-xs transition hover:shadow-md active:scale-[0.99]', RING[t.status], t.mergedInto && 'border-dashed')}>
                    <span className={cn('absolute inset-x-0 top-0 h-1', BAR[t.status])} />
                    <div className="flex items-start justify-between">
                      <div><p className="text-lg font-extrabold leading-none tracking-tight">{t.name}</p><p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground"><Armchair className="size-3.5" />{t.seats} seats</p></div>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="mt-4 min-h-[3.25rem] text-[13px]">
                      {t.mergedInto && <p className="flex items-center gap-1.5 font-semibold text-muted-foreground"><Link2 className="size-3.5" />Merged with {t.mergedInto}</p>}
                      {t.status === 'occupied' && !t.mergedInto && (<>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-muted-foreground"><Users className="size-3.5" />{t.guests} guest{t.guests !== 1 && 's'}</span><span className="flex items-center gap-1.5 font-semibold text-muted-foreground"><Timer className="size-3.5" />{duration(now - (t.since || now))}</span></div>
                        <p className="tnum mt-1.5 text-lg font-extrabold">{o ? inr(o.totals.total) : '—'}<span className="ml-1.5 text-xs font-medium text-muted-foreground">{o ? o.id : 'no order yet'}</span></p>
                      </>)}
                      {t.status === 'reserved' && <><p className="font-bold">{t.reservedFor}</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" />{fmtTime(t.reservedAt)} · {t.guests} guests</p></>}
                      {t.status === 'available' && <p className="text-xs text-muted-foreground">Ready for walk-ins</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* details */}
      <Drawer open={!!table} onClose={() => setSel(null)} title={table && <span className="flex items-center gap-2.5">Table {table.name}<StatusBadge status={table.status} /></span>} subtitle={table && `${table.area} · ${table.seats} seats`}
        footer={table && table.status === 'available' && <Button variant="ghost" className="text-destructive" icon={Trash2} onClick={() => setDelAsk(true)}>Delete table</Button>}>
        {table && (<div className="space-y-5">
          {table.mergedInto && <div className="rounded-lg border border-dashed p-4 text-[13px]"><p className="font-semibold">Merged into {table.mergedInto}</p><p className="mt-1 text-muted-foreground">This table is part of a larger group. Free it from the primary table.</p><Button className="mt-3" variant="outline" size="sm" onClick={() => setSel(table.mergedInto)}>Go to {table.mergedInto}</Button></div>}
          {table.status === 'occupied' && !table.mergedInto && (<>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              {[['Guests', table.guests], ['Seated', duration(now - (table.since || now))], ['Bill', order ? inr(order.totals.total) : '—']].map(([k, v]) => <div key={k} className="rounded-lg border p-3"><p className="tnum text-lg font-extrabold">{v}</p><p className="text-xs text-muted-foreground">{k}</p></div>)}
            </div>
            {order ? (
              <div className="rounded-lg border">
                <div className="flex items-center justify-between border-b px-3.5 py-2.5"><p className="text-sm font-bold">{order.id}</p><div className="flex gap-1.5"><StatusBadge status={order.status} /><StatusBadge status={order.payment.status} /></div></div>
                <ul className="divide-y text-[13px]">{order.items.map((l, i) => <li key={i} className="flex justify-between px-3.5 py-2"><span><b className="tnum">{l.qty}×</b> {l.name}</span></li>)}</ul>
                <div className="flex gap-2 border-t p-3"><Button size="sm" variant="outline" icon={Eye} onClick={() => setOrderOpen(order.id)}>Order details</Button><Button size="sm" icon={ReceiptText} onClick={() => setOrderOpen(order.id)}>Settle bill</Button></div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-[13px]"><p className="font-semibold">No order attached</p><p className="mt-1 text-muted-foreground">Start a new order or assign an existing one.</p></div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {!order && <Button icon={UtensilsCrossed} onClick={() => nav(`/pos?table=${table.id}`)}>New order</Button>}
              {!order && <Button variant="outline" icon={Link2} onClick={() => open('assign', { orderId: unassigned[0]?.id || '' })}>Assign order</Button>}
              <Button variant="outline" icon={ArrowRightLeft} onClick={() => open('transfer', { to: tables.find((t) => t.status === 'available')?.id || '' })}>Transfer table</Button>
              <Button variant="outline" icon={Combine} onClick={() => open('merge', { ids: [] })}>Merge tables</Button>
            </div>
            <Button variant="danger-soft" className="w-full" onClick={() => (order && !(order.status === 'completed' && order.payment.status === 'paid') ? setFreeAsk(true) : actions.markAvailable(table.id))}>Mark as available</Button>
          </>)}
          {table.status === 'available' && (<div className="grid gap-2">
            <Button size="lg" icon={UtensilsCrossed} onClick={() => nav(`/pos?table=${table.id}`)}>Start new order</Button>
            <Button size="lg" variant="outline" icon={Link2} disabled={!unassigned.length} onClick={() => open('assign', { orderId: unassigned[0]?.id || '' })}>Assign existing order {unassigned.length ? `(${unassigned.length})` : ''}</Button>
            <Button size="lg" variant="outline" icon={Users} onClick={() => open('seat', { guests: Math.min(2, table.seats) })}>Seat guests</Button>
            <Button size="lg" variant="outline" icon={CalendarClock} onClick={() => open('reserve', { name: '', guests: 2, mins: 30 })}>Reserve table</Button>
          </div>)}
          {table.status === 'reserved' && (<>
            <div className="rounded-lg border p-4"><p className="text-base font-bold">{table.reservedFor}</p><p className="mt-1 text-[13px] text-muted-foreground">{table.guests} guests · arriving {fmtTime(table.reservedAt)}</p></div>
            <div className="grid gap-2"><Button size="lg" icon={Users} onClick={() => { actions.seatTable(table.id, table.guests) }}>Guests arrived — seat now</Button><Button size="lg" variant="danger-soft" onClick={() => actions.markAvailable(table.id)}>Cancel reservation</Button></div>
          </>)}
        </div>)}
      </Drawer>

      {/* modals */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} size="sm" title="Create table" footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button disabled={!form.name || tables.some((t) => t.id === form.name)} onClick={() => { actions.addTable(form); setModal(null) }}>Create</Button></>}>
        <div className="space-y-3.5">
          <Field label="Table name" error={tables.some((t) => t.id === form.name) ? 'A table with this name exists' : ''}><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })} /></Field>
          <Field label="Seats"><Input type="number" min="1" max="20" value={form.seats || ''} onChange={(e) => setForm({ ...form, seats: e.target.value })} /></Field>
          <Field label="Area"><Input list="areas" value={form.area || ''} onChange={(e) => setForm({ ...form, area: e.target.value })} /><datalist id="areas">{areas.slice(1).map((a) => <option key={a} value={a} />)}</datalist></Field>
        </div>
      </Modal>
      <Modal open={modal === 'transfer'} onClose={() => setModal(null)} size="sm" title={`Transfer ${table?.name}`} description="Move guests and their order to another table."
        footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button disabled={!form.to} onClick={() => { actions.transferTable(table.id, form.to); setModal(null); setSel(form.to) }}>Transfer</Button></>}>
        <Field label="Destination table"><Select value={form.to || ''} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="Choose an available table">{tables.filter((t) => t.status === 'available').map((t) => <option key={t.id} value={t.id}>{t.name} · {t.seats} seats · {t.area}</option>)}</Select></Field>
      </Modal>
      <Modal open={modal === 'merge'} onClose={() => setModal(null)} size="sm" title={`Merge into ${table?.name}`} description="Combine tables for a larger party. Selected tables will be linked to this one."
        footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button disabled={!form.ids?.length} onClick={() => { actions.mergeTables(table.id, form.ids); setModal(null) }}>Merge {form.ids?.length || ''}</Button></>}>
        <div className="grid grid-cols-3 gap-2">{tables.filter((t) => t.id !== table?.id && t.status === 'available').map((t) => { const on = form.ids?.includes(t.id); return (
          <button key={t.id} onClick={() => setForm({ ...form, ids: on ? form.ids.filter((x) => x !== t.id) : [...(form.ids || []), t.id] })} className={cn('rounded-lg border p-2.5 text-left text-[13px] transition', on ? 'border-primary bg-primary/8 ring-2 ring-primary/20' : 'hover:bg-muted/50')}><p className="font-bold">{t.name}</p><p className="text-xs text-muted-foreground">{t.seats} seats</p></button>) })}</div>
      </Modal>
      <Modal open={modal === 'assign'} onClose={() => setModal(null)} size="sm" title={`Assign order to ${table?.name}`} description="Attach an open order that has no table yet."
        footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button disabled={!form.orderId} onClick={() => { actions.assignOrder(table.id, form.orderId); setModal(null) }}>Assign</Button></>}>
        {unassigned.length === 0 ? <p className="py-6 text-center text-[13px] text-muted-foreground">No unassigned open orders right now.</p> : <div className="space-y-2">{unassigned.map((o) => (
          <label key={o.id} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-[13px]', form.orderId === o.id && 'border-primary bg-primary/6')}><input type="radio" checked={form.orderId === o.id} onChange={() => setForm({ ...form, orderId: o.id })} className="accent-[var(--primary)]" /><span className="flex-1"><b>{o.id}</b> · {o.customerName}<span className="block text-xs text-muted-foreground">{o.items.map((l) => `${l.qty}× ${l.name}`).join(', ')}</span></span><b className="tnum">{inr(o.totals.total)}</b></label>))}</div>}
      </Modal>
      <Modal open={modal === 'seat'} onClose={() => setModal(null)} size="sm" title={`Seat guests at ${table?.name}`} footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => { actions.seatTable(table.id, form.guests); setModal(null) }}>Seat guests</Button></>}>
        <div className="flex items-center justify-center gap-5 py-4"><Button variant="outline" size="icon" onClick={() => setForm({ ...form, guests: Math.max(1, form.guests - 1) })}><Minus className="size-4" /></Button><div className="text-center"><p className="tnum text-4xl font-extrabold">{form.guests}</p><p className="text-xs text-muted-foreground">of {table?.seats} seats</p></div><Button variant="outline" size="icon" onClick={() => setForm({ ...form, guests: Math.min(table.seats, form.guests + 1) })}><Plus className="size-4" /></Button></div>
      </Modal>
      <Modal open={modal === 'reserve'} onClose={() => setModal(null)} size="sm" title={`Reserve ${table?.name}`} footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button disabled={!form.name?.trim()} onClick={() => { actions.reserveTable(table.id, form.name.trim(), +form.guests, +form.mins); setModal(null) }}>Reserve</Button></>}>
        <div className="space-y-3.5"><Field label="Guest / party name"><Input autoFocus value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mehta family" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Guests"><Input type="number" min="1" value={form.guests || ''} onChange={(e) => setForm({ ...form, guests: e.target.value })} /></Field><Field label="Arriving in"><Select value={form.mins} onChange={(e) => setForm({ ...form, mins: e.target.value })} options={[{ value: 15, label: '15 minutes' }, { value: 30, label: '30 minutes' }, { value: 60, label: '1 hour' }, { value: 120, label: '2 hours' }]} /></Field></div></div>
      </Modal>
      <ConfirmDialog open={freeAsk} onClose={() => setFreeAsk(false)} title={`Free ${table?.name}?`} message="This table has an open bill. Marking it available detaches the order from the table, but the order itself stays active." confirmLabel="Mark available" onConfirm={() => actions.markAvailable(table.id)} />
      <ConfirmDialog open={delAsk} onClose={() => setDelAsk(false)} title={`Delete table ${table?.name}?`} message="The table will be removed from your floor plan." confirmLabel="Delete table" onConfirm={() => { actions.deleteTable(table.id); setSel(null) }} />
      <OrderDrawer orderId={orderOpen} onClose={() => setOrderOpen(null)} />
    </>
  )
}
