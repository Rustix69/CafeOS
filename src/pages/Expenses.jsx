import { useMemo, useState } from 'react'
import { Download, Landmark, Pencil, Plus, Receipt, Trash2, TrendingDown, Wallet, Banknote, CreditCard, Smartphone } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../components/common/Toast.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import StatCard from '../components/common/StatCard.jsx'
import SearchInput from '../components/common/SearchInput.jsx'
import DataTable from '../components/common/DataTable.jsx'
import Button from '../components/common/Button.jsx'
import Modal from '../components/common/Modal.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { Card, CardHeader, Field, Input, Select, Textarea } from '../components/common/Form.jsx'
import { Donut, Legend, PALETTE } from '../components/charts/charts.jsx'
import { EXPENSE_CATEGORIES } from '../data/mockData.js'
import { DAY, delta, downloadCSV, fmtDate, inr, isoDay, startOfDay, uid } from '../utils/formatters.js'
import { daysInRange, sumDays } from '../utils/analytics.js'

const PM_ICON = { cash: Banknote, upi: Smartphone, card: CreditCard }
const blank = () => ({ id: '', date: isoDay(Date.now()), category: 'Ingredients', amount: '', method: 'upi', vendor: '', note: '' })

export default function Expenses() {
  const { expenses, orders, history, actions } = useStore()
  const toast = useToast()
  const [range, setRange] = useState('30d')
  const [cs, setCs] = useState(isoDay(Date.now() - 14 * DAY))
  const [ce, setCe] = useState(isoDay(Date.now()))
  const [cat, setCat] = useState('all')
  const [method, setMethod] = useState('all')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState({})
  const [del, setDel] = useState(null)

  const [from, to] = useMemo(() => {
    const t = startOfDay(), end = t + DAY - 1
    if (range === 'month') { const d = new Date(); return [new Date(d.getFullYear(), d.getMonth(), 1).getTime(), end] }
    if (range === '7d') return [t - 6 * DAY, end]
    if (range === '30d') return [t - 29 * DAY, end]
    if (range === 'custom') return [startOfDay(new Date(cs)), startOfDay(new Date(ce)) + DAY - 1]
    return [0, end]
  }, [range, cs, ce])
  const inRange = useMemo(() => expenses.filter((e) => e.date >= from && e.date <= to), [expenses, from, to])
  const rows = useMemo(() => inRange.filter((e) => (cat === 'all' || e.category === cat) && (method === 'all' || e.method === method) && (!q || `${e.vendor} ${e.note}`.toLowerCase().includes(q.toLowerCase()))), [inRange, cat, method, q])
  const total = rows.reduce((s, e) => s + e.amount, 0)
  const byCat = EXPENSE_CATEGORIES.map((c, i) => ({ name: c, value: inRange.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0), color: PALETTE[i % PALETTE.length] })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value)
  const rangeTotal = inRange.reduce((s, e) => s + e.amount, 0)
  const days = Math.max(1, Math.round((to - from) / DAY))
  const prev = expenses.filter((e) => e.date >= from - days * DAY && e.date < from).reduce((s, e) => s + e.amount, 0)
  const revenue = range === 'all' ? 0 : sumDays(daysInRange(Math.max(from, startOfDay() - 30 * DAY), startOfDay(), history, orders)).revenue
  const profit = revenue - rangeTotal

  const save = () => {
    const e = {}
    if (!(Number(edit.amount) > 0)) e.amount = 'Enter an amount greater than 0'
    if (!edit.vendor.trim()) e.vendor = 'Payee / vendor is required'
    setErr(e)
    if (Object.keys(e).length) return
    actions.saveExpense({ ...edit, id: edit.id || uid('e'), amount: Number(edit.amount), date: new Date(edit.date + 'T12:00:00').getTime(), vendor: edit.vendor.trim() })
    setEdit(null)
  }
  const cols = [
    { key: 'date', header: 'Date', render: (e) => <span className="whitespace-nowrap text-muted-foreground">{fmtDate(e.date)}</span> },
    { key: 'category', header: 'Category', render: (e) => <span className="inline-flex items-center gap-2 text-[13px] font-semibold"><span className="size-2 rounded-sm" style={{ background: PALETTE[EXPENSE_CATEGORIES.indexOf(e.category) % PALETTE.length] }} />{e.category}</span> },
    { key: 'vendor', header: 'Payee & note', render: (e) => <div><p className="font-semibold">{e.vendor}</p><p className="max-w-xs truncate text-xs text-muted-foreground">{e.note || '—'}</p></div> },
    { key: 'method', header: 'Method', hideBelow: 'md', render: (e) => { const I = PM_ICON[e.method] || Wallet; return <span className="inline-flex items-center gap-1.5 text-[13px] uppercase text-muted-foreground"><I className="size-3.5" />{e.method}</span> } },
    { key: 'amount', header: 'Amount', align: 'right', render: (e) => <span className="tnum font-bold">{inr(e.amount)}</span> },
    { key: 'actions', header: '', sortable: false, align: 'right', render: (e) => <div className="flex justify-end gap-0.5" onClick={(ev) => ev.stopPropagation()}><Button variant="ghost" size="icon-sm" onClick={() => { setErr({}); setEdit({ ...e, date: isoDay(e.date), amount: String(e.amount) }) }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDel(e)}><Trash2 className="size-4" /></Button></div> },
  ]

  return (
    <>
      <PageHeader title="Expenses" description="Record operating costs and keep an eye on where the money goes."
        actions={<><Button variant="outline" icon={Download} onClick={() => { downloadCSV('expenses.csv', [['Date', 'Category', 'Payee', 'Method', 'Amount', 'Note'], ...rows.map((e) => [fmtDate(e.date), e.category, e.vendor, e.method, e.amount, e.note])]); toast(`Exported ${rows.length} expenses`) }}>Export CSV</Button><Button icon={Plus} onClick={() => { setErr({}); setEdit(blank()) }}>Add expense</Button></>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Expenses" value={inr(rangeTotal)} icon={Receipt} tone="danger" change={prev ? -delta(rangeTotal, prev) * -1 : null} hint="vs previous period" />
        <StatCard label="Largest Category" value={byCat[0]?.name || '—'} icon={Landmark} tone="secondary" hint={byCat[0] ? inr(byCat[0].value) : ''} />
        <StatCard label="Entries" value={inRange.length} icon={Wallet} tone="accent" hint={`avg ${inr(rangeTotal / Math.max(1, inRange.length))}`} />
        <StatCard label="Est. Operating Profit" value={range === 'all' ? '—' : inr(profit)} icon={TrendingDown} tone={profit >= 0 ? 'primary' : 'danger'} hint="sales − expenses" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card><CardHeader title="By category" desc="Share of spending in selected period" />
          <div className="px-4 pb-4 pt-2">{byCat.length ? <><Donut data={byCat} money centerValue={inr(rangeTotal)} centerLabel="total" height={170} /><div className="mt-3"><Legend data={byCat} money /></div></> : <EmptyState icon={Receipt} title="No expenses" message="Nothing recorded in this period." />}</div></Card>
        <div className="space-y-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={q} onChange={setQ} placeholder="Search payee or note…" className="w-full sm:w-64" />
            <div className="w-36"><Select value={range} onChange={(e) => setRange(e.target.value)} options={[{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: 'month', label: 'This month' }, { value: 'all', label: 'All time' }, { value: 'custom', label: 'Custom range' }]} /></div>
            <div className="w-40"><Select value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} /></div>
            <div className="w-32"><Select value={method} onChange={(e) => setMethod(e.target.value)} options={[{ value: 'all', label: 'Any method' }, { value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'card', label: 'Card' }]} /></div>
          </div>
          {range === 'custom' && <div className="flex items-center gap-2"><Input type="date" value={cs} max={ce} onChange={(e) => setCs(e.target.value)} className="w-40" /><span className="text-muted-foreground">to</span><Input type="date" value={ce} min={cs} onChange={(e) => setCe(e.target.value)} className="w-40" /></div>}
          <DataTable columns={cols} rows={rows} pageSize={8} defaultSort={{ key: 'date', dir: 'desc' }} empty={<EmptyState icon={Receipt} title="No expenses match" message="Change the filters or add a new expense." action={<Button icon={Plus} onClick={() => setEdit(blank())}>Add expense</Button>} />} />
          <p className="text-right text-[13px] text-muted-foreground">Filtered total: <b className="tnum text-foreground">{inr(total)}</b></p>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} size="md" title={edit?.id ? 'Edit expense' : 'Add expense'} footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>{edit?.id ? 'Save changes' : 'Add expense'}</Button></>}>
        {edit && <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Category"><Select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} options={EXPENSE_CATEGORIES} /></Field>
          <Field label="Date"><Input type="date" value={edit.date} max={isoDay(Date.now())} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
          <Field label="Amount (₹)" required error={err.amount}><Input autoFocus type="number" min="0" value={edit.amount} onChange={(e) => setEdit({ ...edit, amount: e.target.value })} className="font-bold" /></Field>
          <Field label="Payment method"><Select value={edit.method} onChange={(e) => setEdit({ ...edit, method: e.target.value })} options={[{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'card', label: 'Card' }]} /></Field>
          <Field label="Payee / vendor" required error={err.vendor} className="sm:col-span-2"><Input value={edit.vendor} onChange={(e) => setEdit({ ...edit, vendor: e.target.value })} placeholder="e.g. Metro Wholesale Mart" /></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea rows={2} value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} placeholder="What was this for?" /></Field>
        </div>}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete this expense?" message={del && `${del.vendor} · ${inr(del.amount)} on ${fmtDate(del.date)} will be permanently removed.`} confirmLabel="Delete expense" onConfirm={() => actions.deleteExpense(del.id)} />
    </>
  )
}
