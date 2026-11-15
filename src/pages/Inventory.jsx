import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDownUp, Boxes, ClipboardCheck, Eye, History, IndianRupee, Mail, MoreHorizontal, Pencil, Phone, PackageX, Plus, Trash2, Truck, Warehouse, ShoppingCart, Flame } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../components/common/Toast.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import StatCard from '../components/common/StatCard.jsx'
import SearchInput from '../components/common/SearchInput.jsx'
import DataTable from '../components/common/DataTable.jsx'
import Button from '../components/common/Button.jsx'
import Modal from '../components/common/Modal.jsx'
import Tabs from '../components/common/Tabs.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import Dropdown, { MenuItem, MenuSep } from '../components/common/Dropdown.jsx'
import { Field, Input, Select, Segmented, Card } from '../components/common/Form.jsx'
import { cn, fmtDate, fmtDateTime, inr, inr2, timeAgo, uid } from '../utils/formatters.js'

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs']
const CATS = ['Coffee & Tea', 'Dairy', 'Bakery', 'Produce', 'Meat', 'Grocery', 'Packaging']
const statusOf = (i) => (i.stock <= 0 ? 'out' : i.stock <= i.min ? 'low' : 'in-stock')
const MV_TONE = { purchase: 'text-primary', opening: 'text-primary', usage: 'text-muted-foreground', wastage: 'text-destructive', adjustment: 'text-warning-foreground' }
const fq = (n) => (Math.round(n * 100) / 100).toString()

export default function Inventory() {
  const { inventory, suppliers, purchases, movements, wastage, actions, staff, currentUserId } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('stock')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [st, setSt] = useState('all')
  const [modal, setModal] = useState(null) // {type, item?}
  const [f, setF] = useState({})
  const [del, setDel] = useState(null)
  const [mvType, setMvType] = useState('all')
  const supplier = (id) => suppliers.find((s) => s.id === id)
  const ing = (id) => inventory.find((i) => i.id === id)

  const kpi = useMemo(() => ({
    total: inventory.length, low: inventory.filter((i) => statusOf(i) === 'low').length, out: inventory.filter((i) => statusOf(i) === 'out').length,
    value: inventory.reduce((s, i) => s + i.stock * i.cost, 0),
  }), [inventory])
  const rows = useMemo(() => inventory.filter((i) => (cat === 'all' || i.category === cat) && (st === 'all' || statusOf(i) === st) && (!q || i.name.toLowerCase().includes(q.toLowerCase()))), [inventory, q, cat, st])
  const alerts = inventory.filter((i) => statusOf(i) !== 'in-stock').sort((a, b) => a.stock / a.min - b.stock / b.min)
  const open = (type, item, init = {}) => { setF(init); setModal({ type, item }) }
  const close = () => setModal(null)
  const me = staff.find((s) => s.id === currentUserId)

  /* ---- forms ---- */
  const saveIng = () => {
    if (!f.name?.trim() || !(+f.min >= 0)) return
    actions.saveIngredient({ id: f.id || uid('i'), name: f.name.trim(), category: f.category, unit: f.unit, stock: +f.stock || 0, min: +f.min || 0, cost: +f.cost || 0, supplierId: f.supplierId || suppliers[0]?.id })
    close()
  }
  const submitStock = () => {
    const v = +f.qty; if (!v || v < 0) return
    const it = modal.item
    if (f.mode === 'set') actions.adjustStock(it.id, v - it.stock, 'adjustment', f.note || 'Physical stock count')
    else actions.adjustStock(it.id, f.mode === 'remove' ? -v : v, f.mode === 'remove' ? 'adjustment' : 'purchase', f.note || (f.mode === 'remove' ? 'Manual deduction' : 'Manual stock in'))
    close()
  }
  const submitPurchase = () => {
    const items = (f.rows || []).filter((r) => r.ingredientId && +r.qty > 0).map((r) => ({ ingredientId: r.ingredientId, qty: +r.qty, cost: +r.cost || ing(r.ingredientId)?.cost || 0 }))
    if (!f.supplierId || !items.length) { toast('Pick a supplier and at least one item', { type: 'warning' }); return }
    actions.addPurchase({ supplierId: f.supplierId, invoice: f.invoice || `PO-${Math.floor(1000 + Math.random() * 8999)}`, items, date: f.date ? new Date(f.date).getTime() : Date.now() })
    close()
  }
  const submitWaste = () => { if (!f.ingredientId || !(+f.qty > 0)) return; actions.addWastage({ ingredientId: f.ingredientId, qty: +f.qty, reason: f.reason }); close() }
  const saveSupplier = () => { if (!f.name?.trim()) return; actions.saveSupplier({ id: f.id || uid('s'), name: f.name.trim(), contact: f.contact || '', phone: f.phone || '', email: f.email || '', category: f.category || '' }); close() }

  const stockCols = [
    { key: 'name', header: 'Ingredient', render: (i) => <div><p className="font-bold">{i.name}</p><p className="text-xs text-muted-foreground">{supplier(i.supplierId)?.name || '—'}</p></div> },
    { key: 'category', header: 'Category', hideBelow: 'md', render: (i) => <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{i.category}</span> },
    { key: 'stock', header: 'Current stock', align: 'right', render: (i) => (
      <div className="ml-auto w-32"><p className={cn('tnum text-right font-bold', statusOf(i) === 'out' && 'text-destructive', statusOf(i) === 'low' && 'text-warning-foreground')}>{fq(i.stock)}</p>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', statusOf(i) === 'out' ? 'bg-destructive' : statusOf(i) === 'low' ? 'bg-warning' : 'bg-primary')} style={{ width: `${Math.min(100, (i.stock / (i.min * 2.5 || 1)) * 100)}%` }} /></div></div>) },
    { key: 'unit', header: 'Unit', hideBelow: 'md', render: (i) => <span className="text-muted-foreground">{i.unit}</span> },
    { key: 'min', header: 'Min. stock', hideBelow: 'lg', align: 'right', render: (i) => <span className="tnum text-muted-foreground">{fq(i.min)}</span> },
    { key: 'status', header: 'Status', sortValue: (i) => statusOf(i), render: (i) => <StatusBadge status={statusOf(i)} /> },
    { key: 'updated', header: 'Last updated', hideBelow: 'xl', render: (i) => <span className="text-muted-foreground">{timeAgo(i.updated)}</span> },
    { key: 'actions', header: '', sortable: false, align: 'right', render: (i) => (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="soft" size="xs" onClick={() => open('stock', i, { mode: 'add', qty: '', note: '' })}>Update</Button>
        <Dropdown width="w-48" trigger={<Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>}>
          <MenuItem icon={Eye} onClick={() => open('detail', i)}>View details</MenuItem>
          <MenuItem icon={ClipboardCheck} onClick={() => open('stock', i, { mode: 'set', qty: String(i.stock), note: '' })}>Stock adjustment</MenuItem>
          <MenuItem icon={Flame} onClick={() => open('waste', i, { ingredientId: i.id, qty: '', reason: 'Spoiled' })}>Record wastage</MenuItem>
          <MenuItem icon={Pencil} onClick={() => open('ingredient', i, { ...i })}>Edit</MenuItem><MenuSep />
          <MenuItem icon={Trash2} danger onClick={() => setDel(i)}>Delete</MenuItem>
        </Dropdown>
      </div>) },
  ]

  return (
    <>
      <PageHeader title="Inventory" description="Track ingredient stock, purchases, suppliers and wastage. Stock is auto-deducted when orders are placed."
        actions={<><Button variant="outline" icon={ShoppingCart} onClick={() => open('purchase', null, { supplierId: suppliers[0]?.id, invoice: '', date: new Date().toISOString().slice(0, 10), rows: [{ ingredientId: '', qty: '', cost: '' }] })}>Purchase entry</Button><Button icon={Plus} onClick={() => open('ingredient', null, { name: '', category: CATS[0], unit: 'kg', stock: '', min: '', cost: '', supplierId: suppliers[0]?.id })}>Add ingredient</Button></>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Ingredients" value={kpi.total} icon={Boxes} tone="secondary" hint={`${CATS.length} categories`} />
        <StatCard label="Low Stock Items" value={kpi.low} icon={AlertTriangle} tone="warning" hint="below minimum level" />
        <StatCard label="Out of Stock" value={kpi.out} icon={PackageX} tone="danger" hint="needs reorder now" />
        <StatCard label="Inventory Value" value={inr(kpi.value)} icon={IndianRupee} hint="at last purchase cost" />
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 rounded-xl border border-warning/40 bg-warning/8 p-3.5">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-bold"><AlertTriangle className="size-4 text-warning-foreground" />Low-stock alerts ({alerts.length})</p>
          <div className="flex flex-wrap gap-2">{alerts.slice(0, 8).map((i) => (
            <button key={i.id} onClick={() => open('stock', i, { mode: 'add', qty: '', note: '' })} className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold transition hover:border-primary"><span className={cn('size-1.5 rounded-full', statusOf(i) === 'out' ? 'bg-destructive' : 'bg-warning')} />{i.name}<span className="tnum text-muted-foreground">{fq(i.stock)} {i.unit}</span></button>))}</div>
        </div>
      )}

      <Tabs className="mb-4 mt-5" value={tab} onChange={setTab} tabs={[{ value: 'stock', label: 'Stock', icon: Warehouse }, { value: 'purchases', label: 'Purchases', icon: ShoppingCart }, { value: 'suppliers', label: 'Suppliers', icon: Truck }, { value: 'history', label: 'Stock history', icon: History }, { value: 'wastage', label: 'Wastage', icon: Flame }]} />

      {tab === 'stock' && (<>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search ingredients…" className="w-full sm:w-72" />
          <div className="w-44"><Select value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...CATS.map((c) => ({ value: c, label: c }))]} /></div>
          <div className="w-40"><Select value={st} onChange={(e) => setSt(e.target.value)} options={[{ value: 'all', label: 'All status' }, { value: 'in-stock', label: 'In stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }]} /></div>
        </div>
        <DataTable columns={stockCols} rows={rows} pageSize={12} onRowClick={(i) => open('detail', i)} />
      </>)}

      {tab === 'purchases' && <DataTable pageSize={10} rows={purchases} columns={[
        { key: 'invoice', header: 'Invoice', render: (p) => <span className="font-bold">{p.invoice}</span> },
        { key: 'date', header: 'Date', render: (p) => <span className="text-muted-foreground">{fmtDate(p.date)}</span> },
        { key: 'supplier', header: 'Supplier', sortValue: (p) => supplier(p.supplierId)?.name, render: (p) => supplier(p.supplierId)?.name || '—' },
        { key: 'items', header: 'Items', sortable: false, hideBelow: 'md', render: (p) => <span className="text-muted-foreground">{p.items.map((i) => `${fq(i.qty)} ${ing(i.ingredientId)?.unit || ''} ${ing(i.ingredientId)?.name || ''}`).join(', ')}</span> },
        { key: 'total', header: 'Total', align: 'right', render: (p) => <span className="tnum font-bold">{inr2(p.total)}</span> },
        { key: 'status', header: 'Status', render: (p) => <StatusBadge status="completed" label="Received" /> },
      ]} />}

      {tab === 'suppliers' && (<>
        <div className="mb-3 flex justify-end"><Button variant="outline" icon={Plus} onClick={() => open('supplier', null, { name: '', contact: '', phone: '+91 ', email: '', category: '' })}>Add supplier</Button></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{suppliers.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-start justify-between"><div><h3 className="font-bold">{s.name}</h3><p className="text-xs text-muted-foreground">{s.category}</p></div>
              <div className="flex"><Button variant="ghost" size="icon-sm" onClick={() => open('supplier', s, { ...s })}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDel(s)}><Trash2 className="size-4" /></Button></div></div>
            <div className="mt-3 space-y-1.5 text-[13px] text-muted-foreground"><p className="font-semibold text-foreground">{s.contact}</p><p className="flex items-center gap-2"><Phone className="size-3.5" />{s.phone}</p><p className="flex items-center gap-2"><Mail className="size-3.5" />{s.email}</p></div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs"><span className="text-muted-foreground">{inventory.filter((i) => i.supplierId === s.id).length} ingredients · last order {s.lastOrder ? `${s.lastOrder}d ago` : 'today'}</span><Button size="xs" variant="soft" onClick={() => open('purchase', null, { supplierId: s.id, invoice: '', date: new Date().toISOString().slice(0, 10), rows: [{ ingredientId: '', qty: '', cost: '' }] })}>Order</Button></div>
          </Card>))}</div>
      </>)}

      {tab === 'history' && (<>
        <div className="mb-4"><Segmented value={mvType} onChange={setMvType} options={['all', 'purchase', 'usage', 'wastage', 'adjustment']} /></div>
        <DataTable pageSize={12} rows={movements.filter((m) => mvType === 'all' || m.type === mvType)} columns={[
          { key: 'at', header: 'When', render: (m) => <span className="whitespace-nowrap text-muted-foreground">{fmtDateTime(m.at)}</span> },
          { key: 'ing', header: 'Ingredient', sortValue: (m) => ing(m.ingredientId)?.name, render: (m) => <span className="font-semibold">{ing(m.ingredientId)?.name || 'Deleted item'}</span> },
          { key: 'type', header: 'Type', render: (m) => <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold capitalize">{m.type}</span> },
          { key: 'qty', header: 'Quantity', align: 'right', render: (m) => <span className={cn('tnum font-bold', MV_TONE[m.type])}>{m.qty > 0 ? '+' : ''}{fq(m.qty)} {ing(m.ingredientId)?.unit}</span> },
          { key: 'note', header: 'Note', hideBelow: 'md', render: (m) => <span className="text-muted-foreground">{m.note}</span> },
          { key: 'by', header: 'By', hideBelow: 'lg', render: (m) => m.by },
        ]} /></>)}

      {tab === 'wastage' && (<>
        <div className="mb-3 flex items-center justify-between"><p className="text-[13px] text-muted-foreground">Wastage this month: <b className="tnum text-foreground">{inr(wastage.reduce((s, w) => s + w.qty * (ing(w.ingredientId)?.cost || 0), 0))}</b></p><Button icon={Plus} variant="outline" onClick={() => open('waste', null, { ingredientId: inventory[0]?.id, qty: '', reason: 'Spoiled' })}>Record wastage</Button></div>
        <DataTable pageSize={10} rows={wastage} columns={[
          { key: 'date', header: 'Date', render: (w) => <span className="text-muted-foreground">{fmtDateTime(w.date)}</span> },
          { key: 'ing', header: 'Ingredient', sortValue: (w) => ing(w.ingredientId)?.name, render: (w) => <span className="font-semibold">{ing(w.ingredientId)?.name}</span> },
          { key: 'qty', header: 'Quantity', align: 'right', render: (w) => <span className="tnum">{fq(w.qty)} {ing(w.ingredientId)?.unit}</span> },
          { key: 'cost', header: 'Loss', align: 'right', sortValue: (w) => w.qty * (ing(w.ingredientId)?.cost || 0), render: (w) => <span className="tnum font-bold text-destructive">{inr(w.qty * (ing(w.ingredientId)?.cost || 0))}</span> },
          { key: 'reason', header: 'Reason', render: (w) => <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{w.reason}</span> },
          { key: 'by', header: 'Logged by', hideBelow: 'md', render: (w) => w.by },
        ]} /></>)}

      {/* modals */}
      <Modal open={modal?.type === 'ingredient'} onClose={close} size="md" title={modal?.item ? 'Edit ingredient' : 'Add ingredient'} footer={<><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={saveIng}>Save ingredient</Button></>}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Name" required className="sm:col-span-2"><Input value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
          <Field label="Category"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} options={CATS} /></Field>
          <Field label="Unit"><Select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} options={UNITS} /></Field>
          <Field label={modal?.item ? 'Current stock' : 'Opening stock'}><Input type="number" value={f.stock ?? ''} onChange={(e) => setF({ ...f, stock: e.target.value })} /></Field>
          <Field label="Minimum stock" hint="Alert triggers at or below this level"><Input type="number" value={f.min ?? ''} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
          <Field label="Cost per unit (₹)"><Input type="number" value={f.cost ?? ''} onChange={(e) => setF({ ...f, cost: e.target.value })} /></Field>
          <Field label="Preferred supplier"><Select value={f.supplierId} onChange={(e) => setF({ ...f, supplierId: e.target.value })}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        </div>
      </Modal>

      <Modal open={modal?.type === 'stock'} onClose={close} size="sm" title={f.mode === 'set' ? 'Stock adjustment' : 'Update stock'} description={modal?.item && `${modal.item.name} · currently ${fq(modal.item.stock)} ${modal.item.unit}`} footer={<><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={submitStock}>Update stock</Button></>}>
        <Segmented value={f.mode} onChange={(m) => setF({ ...f, mode: m, qty: m === 'set' ? String(modal.item.stock) : '' })} options={[{ value: 'add', label: 'Stock in' }, { value: 'remove', label: 'Stock out' }, { value: 'set', label: 'Set count' }]} className="mb-3.5 w-full [&>button]:flex-1" />
        <div className="space-y-3.5"><Field label={f.mode === 'set' ? `New physical count (${modal?.item?.unit})` : `Quantity (${modal?.item?.unit})`}><Input autoFocus type="number" min="0" value={f.qty ?? ''} onChange={(e) => setF({ ...f, qty: e.target.value })} className="h-11 text-lg font-bold" /></Field>
          {modal?.item && f.qty !== '' && <p className="rounded-lg bg-muted/50 px-3 py-2 text-[13px]">New stock level: <b className="tnum">{fq(f.mode === 'set' ? +f.qty : Math.max(0, modal.item.stock + (f.mode === 'remove' ? -1 : 1) * (+f.qty || 0)))} {modal.item.unit}</b></p>}
          <Field label="Note (optional)"><Input value={f.note || ''} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Delivery from supplier" /></Field></div>
      </Modal>

      <Modal open={modal?.type === 'waste'} onClose={close} size="sm" title="Record wastage" footer={<><Button variant="outline" onClick={close}>Cancel</Button><Button variant="danger" onClick={submitWaste}>Record wastage</Button></>}>
        <div className="space-y-3.5"><Field label="Ingredient"><Select value={f.ingredientId} onChange={(e) => setF({ ...f, ingredientId: e.target.value })}>{inventory.map((i) => <option key={i.id} value={i.id}>{i.name} ({fq(i.stock)} {i.unit})</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label={`Quantity (${ing(f.ingredientId)?.unit || ''})`}><Input type="number" min="0" value={f.qty ?? ''} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field><Field label="Reason"><Select value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} options={['Spoiled', 'Expired', 'Spilled', 'Preparation error', 'Returned']} /></Field></div></div>
      </Modal>

      <Modal open={modal?.type === 'purchase'} onClose={close} size="lg" title="Purchase entry" description="Record goods received — stock levels and costs update automatically." footer={<><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={submitPurchase}>Save purchase · {inr((f.rows || []).reduce((s, r) => s + (+r.qty || 0) * (+r.cost || ing(r.ingredientId)?.cost || 0), 0))}</Button></>}>
        <div className="grid gap-3.5 sm:grid-cols-3"><Field label="Supplier"><Select value={f.supplierId} onChange={(e) => setF({ ...f, supplierId: e.target.value })}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field label="Invoice no."><Input value={f.invoice || ''} onChange={(e) => setF({ ...f, invoice: e.target.value })} placeholder="Auto-generated if empty" /></Field><Field label="Date"><Input type="date" value={f.date || ''} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field></div>
        <div className="mt-4 space-y-2">{(f.rows || []).map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_90px_100px_36px] items-center gap-2"><Select value={r.ingredientId} onChange={(e) => { const g = ing(e.target.value); setF({ ...f, rows: f.rows.map((x, j) => (j === i ? { ...x, ingredientId: e.target.value, cost: g?.cost ?? '' } : x)) }) }} placeholder="Select ingredient">{inventory.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.unit})</option>)}</Select>
            <Input type="number" placeholder="Qty" value={r.qty} onChange={(e) => setF({ ...f, rows: f.rows.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)) })} /><Input type="number" placeholder="₹ / unit" value={r.cost} onChange={(e) => setF({ ...f, rows: f.rows.map((x, j) => (j === i ? { ...x, cost: e.target.value } : x)) })} />
            <Button variant="ghost" size="icon-sm" disabled={f.rows.length === 1} onClick={() => setF({ ...f, rows: f.rows.filter((_, j) => j !== i) })}><Trash2 className="size-4" /></Button></div>))}
          <Button variant="ghost" size="sm" icon={Plus} onClick={() => setF({ ...f, rows: [...f.rows, { ingredientId: '', qty: '', cost: '' }] })}>Add line</Button></div>
      </Modal>

      <Modal open={modal?.type === 'supplier'} onClose={close} size="sm" title={modal?.item ? 'Edit supplier' : 'Add supplier'} footer={<><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={saveSupplier}>Save supplier</Button></>}>
        <div className="space-y-3.5"><Field label="Business name" required><Input value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field><Field label="Contact person"><Input value={f.contact || ''} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Phone"><Input value={f.phone || ''} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label="Supplies"><Input value={f.category || ''} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="e.g. Dairy" /></Field></div><Field label="Email"><Input type="email" value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field></div>
      </Modal>

      <Modal open={modal?.type === 'detail'} onClose={close} size="md" title={modal?.item?.name} description={modal?.item && `${modal.item.category} · ${supplier(modal.item.supplierId)?.name || 'No supplier'}`} footer={modal?.item && <><Button variant="outline" icon={Pencil} onClick={() => open('ingredient', modal.item, { ...modal.item })}>Edit</Button><Button variant="outline" icon={ArrowDownUp} onClick={() => open('stock', modal.item, { mode: 'add', qty: '', note: '' })}>Update stock</Button></>}>
        {modal?.item && (() => { const i = ing(modal.item.id) || modal.item; const hist = movements.filter((m) => m.ingredientId === i.id).slice(0, 6); return (<>
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">{[['Current stock', `${fq(i.stock)} ${i.unit}`], ['Minimum', `${fq(i.min)} ${i.unit}`], ['Unit cost', inr2(i.cost)], ['Stock value', inr(i.stock * i.cost)]].map(([k, v]) => <div key={k} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="tnum mt-0.5 font-bold">{v}</p></div>)}</div>
          <div className="mb-4 flex items-center gap-3"><StatusBadge status={statusOf(i)} /><span className="text-xs text-muted-foreground">Updated {timeAgo(i.updated)}</span></div>
          <h4 className="mb-2 text-sm font-bold">Recent movements</h4>
          {hist.length === 0 ? <p className="rounded-lg border border-dashed py-6 text-center text-[13px] text-muted-foreground">No movements recorded yet.</p> : <ul className="divide-y rounded-lg border">{hist.map((m) => <li key={m.id} className="flex items-center gap-3 px-3 py-2.5 text-[13px]"><span className="w-24 shrink-0 text-xs capitalize text-muted-foreground">{m.type}</span><span className="flex-1 truncate text-muted-foreground">{m.note}</span><span className={cn('tnum font-bold', MV_TONE[m.type])}>{m.qty > 0 ? '+' : ''}{fq(m.qty)}</span><span className="w-20 text-right text-xs text-muted-foreground">{timeAgo(m.at)}</span></li>)}</ul>}
        </>) })()}
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={`Delete ${del?.name}?`} message={del?.contact !== undefined ? 'This supplier will be removed. Existing purchase records are kept.' : 'This ingredient and its stock record will be removed. Movement history is kept.'} confirmLabel="Delete" onConfirm={() => (del.contact !== undefined ? actions.deleteSupplier(del.id) : actions.deleteIngredient(del.id))} />
    </>
  )
}
