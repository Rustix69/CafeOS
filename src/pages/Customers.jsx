import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Award, Gift, IndianRupee, Mail, Pencil, Phone, Plus, Trash2, UserPlus, Users, Star, Cake } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import StatCard from '../components/common/StatCard.jsx'
import SearchInput from '../components/common/SearchInput.jsx'
import DataTable from '../components/common/DataTable.jsx'
import Button from '../components/common/Button.jsx'
import Modal from '../components/common/Modal.jsx'
import Drawer from '../components/common/Drawer.jsx'
import Avatar from '../components/common/Avatar.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { Field, Input, Select, Textarea } from '../components/common/Form.jsx'
import OrderDrawer from '../components/orders/OrderDrawer.jsx'
import { fmtDate, fmtDateTime, inr, num, timeAgo, uid } from '../utils/formatters.js'

const tierOf = (spend) => (spend > 9000 ? 'Gold' : spend > 4000 ? 'Silver' : 'Bronze')
const NEXT = { Bronze: ['Silver', 4000], Silver: ['Gold', 9000] }
const blank = { name: '', phone: '+91 ', email: '', birthday: '', notes: '' }

export default function Customers() {
  const { customers, orders, actions } = useStore()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [tier, setTier] = useState('all')
  const [view, setView] = useState(null)
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState({})
  const [del, setDel] = useState(null)
  const [orderOpen, setOrderOpen] = useState(null)
  const [pts, setPts] = useState('')

  const rows = useMemo(() => {
    const s = q.toLowerCase().replace(/\s/g, '')
    return customers.map((c) => ({ ...c, tier: tierOf(c.spend) })).filter((c) => (tier === 'all' || c.tier === tier) && (!s || c.name.toLowerCase().replace(/\s/g, '').includes(s) || c.phone.replace(/\s/g, '').includes(s) || (c.email || '').toLowerCase().includes(s)))
  }, [customers, q, tier])
  const kpi = useMemo(() => ({ total: customers.length, ltv: customers.reduce((s, c) => s + c.spend, 0) / (customers.length || 1), points: customers.reduce((s, c) => s + c.points, 0), gold: customers.filter((c) => tierOf(c.spend) === 'Gold').length, repeat: customers.filter((c) => c.totalOrders > 1).length / (customers.length || 1) }), [customers])
  const cur = view && rows.find((c) => c.id === view) || (view && customers.find((c) => c.id === view) && { ...customers.find((c) => c.id === view), tier: tierOf(customers.find((c) => c.id === view).spend) })
  const history = cur ? orders.filter((o) => o.customerId === cur.id).sort((a, b) => b.createdAt - a.createdAt) : []

  const save = () => {
    const e = {}
    if (!edit.name.trim()) e.name = 'Name is required'
    if (edit.phone.replace(/\D/g, '').length < 12) e.phone = 'Enter a valid 10-digit mobile number'
    else if (customers.some((c) => c.id !== edit.id && c.phone.replace(/\s/g, '') === edit.phone.replace(/\s/g, ''))) e.phone = 'A customer with this number already exists'
    if (edit.email && !/^\S+@\S+\.\S+$/.test(edit.email)) e.email = 'Enter a valid email'
    setErr(e)
    if (Object.keys(e).length) return
    actions.saveCustomer({ ...edit, id: edit.id || uid('c'), name: edit.name.trim() })
    setEdit(null)
  }

  const cols = [
    { key: 'name', header: 'Customer', render: (c) => <div className="flex items-center gap-3"><Avatar name={c.name} /><div><p className="font-bold">{c.name}</p><p className="text-xs text-muted-foreground">{c.email || 'No email'}</p></div></div> },
    { key: 'phone', header: 'Phone', hideBelow: 'md', render: (c) => <span className="tnum text-muted-foreground">{c.phone}</span> },
    { key: 'totalOrders', header: 'Orders', align: 'right', render: (c) => <span className="tnum font-semibold">{c.totalOrders}</span> },
    { key: 'spend', header: 'Lifetime spend', align: 'right', render: (c) => <span className="tnum font-bold">{inr(c.spend)}</span> },
    { key: 'lastOrder', header: 'Last order', hideBelow: 'lg', render: (c) => <span className="text-muted-foreground">{c.lastOrder ? fmtDate(c.lastOrder) : 'Never'}</span> },
    { key: 'points', header: 'Loyalty', align: 'right', hideBelow: 'md', render: (c) => <span className="tnum inline-flex items-center gap-1 font-semibold text-primary"><Star className="size-3.5" />{num(c.points)}</span> },
    { key: 'tier', header: 'Tier', hideBelow: 'lg', render: (c) => <StatusBadge status={c.tier} dot={false} /> },
    { key: 'actions', header: '', sortable: false, align: 'right', render: (c) => <div onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon-sm" onClick={() => { setErr({}); setEdit({ ...blank, ...c }) }}><Pencil className="size-4" /></Button></div> },
  ]

  return (
    <>
      <PageHeader title="Customers" description="Know your regulars — contact details, order history and loyalty in one place."
        actions={<Button icon={UserPlus} onClick={() => { setErr({}); setEdit({ ...blank }) }}>Add customer</Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Customers" value={num(kpi.total)} icon={Users} tone="secondary" hint={`${(kpi.repeat * 100).toFixed(0)}% repeat`} />
        <StatCard label="Avg. Lifetime Value" value={inr(kpi.ltv)} icon={IndianRupee} />
        <StatCard label="Gold Members" value={kpi.gold} icon={Award} tone="warning" hint="spent over ₹9,000" />
        <StatCard label="Points Outstanding" value={num(kpi.points)} icon={Gift} tone="accent" hint="≈ ₹1 per 2 points" />
      </div>
      <div className="mb-4 mt-5 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search by name, phone or email…" className="w-full sm:w-80" />
        <div className="w-36"><Select value={tier} onChange={(e) => setTier(e.target.value)} options={[{ value: 'all', label: 'All tiers' }, 'Gold', 'Silver', 'Bronze']} /></div>
        <p className="ml-auto text-[13px] text-muted-foreground"><b className="text-foreground">{rows.length}</b> customers</p>
      </div>
      <DataTable columns={cols} rows={rows} pageSize={12} onRowClick={(c) => setView(c.id)} empty={<EmptyState icon={Users} title="No customers found" message="Try a different search, or add a new customer." action={<Button icon={Plus} onClick={() => setEdit({ ...blank })}>Add customer</Button>} />} />

      <Drawer open={!!cur} onClose={() => setView(null)} width="max-w-lg" title="Customer profile"
        footer={cur && <><Button variant="outline" icon={Pencil} onClick={() => { setErr({}); setEdit({ ...blank, ...cur }) }}>Edit</Button><Button onClick={() => nav('/pos')}>Create order</Button><Button variant="danger-soft" icon={Trash2} className="ml-auto" onClick={() => setDel(cur)}>Delete</Button></>}>
        {cur && (<>
          <div className="flex items-center gap-4"><Avatar name={cur.name} size="xl" /><div className="min-w-0"><h3 className="truncate text-lg font-extrabold">{cur.name}</h3><div className="mt-1"><StatusBadge status={cur.tier} dot={false} /></div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground"><Phone className="size-3.5" />{cur.phone}</p>{cur.email && <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><Mail className="size-3.5" />{cur.email}</p>}{cur.birthday && <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><Cake className="size-3.5" />{cur.birthday}</p>}</div></div>
          <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">{[['Orders', cur.totalOrders], ['Spent', inr(cur.spend)], ['Avg. bill', inr(cur.spend / Math.max(1, cur.totalOrders))]].map(([k, v]) => <div key={k} className="rounded-lg border p-3"><p className="tnum text-base font-extrabold">{v}</p><p className="text-xs text-muted-foreground">{k}</p></div>)}</div>
          {cur.notes && <p className="mt-3 rounded-lg bg-muted/50 p-3 text-[13px]"><b>Notes:</b> {cur.notes}</p>}

          <div className="mt-5 rounded-xl border bg-primary/5 p-4">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-muted-foreground">Loyalty balance</p><p className="tnum text-2xl font-extrabold text-primary">{num(cur.points)} <span className="text-sm font-semibold">pts</span></p></div><div className="text-right text-xs text-muted-foreground">Worth <b className="tnum text-foreground">{inr(cur.points / 2)}</b><br />1 pt per ₹20 spent</div></div>
            {NEXT[cur.tier] && <div className="mt-3"><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (cur.spend / NEXT[cur.tier][1]) * 100)}%` }} /></div><p className="mt-1.5 text-xs text-muted-foreground">{inr(NEXT[cur.tier][1] - cur.spend)} more to reach <b>{NEXT[cur.tier][0]}</b></p></div>}
            <div className="mt-3 flex gap-2"><Input type="number" min="1" placeholder="Points" value={pts} onChange={(e) => setPts(e.target.value)} className="w-28" /><Button variant="outline" size="sm" className="h-9" onClick={() => { if (+pts > 0) { actions.adjustPoints(cur.id, +pts); setPts('') } }}>Add</Button><Button variant="outline" size="sm" className="h-9" onClick={() => { if (+pts > 0 && +pts <= cur.points) { actions.adjustPoints(cur.id, -pts); setPts('') } }}>Redeem</Button></div>
          </div>

          <h4 className="mb-2 mt-5 text-sm font-bold">Order history <span className="font-normal text-muted-foreground">· today</span></h4>
          {history.length === 0 ? <p className="rounded-lg border border-dashed py-6 text-center text-[13px] text-muted-foreground">No orders in today's log. Last visit {cur.lastOrder ? timeAgo(cur.lastOrder) : '—'}.</p> : (
            <ul className="divide-y rounded-lg border">{history.map((o) => <li key={o.id}><button onClick={() => setOrderOpen(o.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] hover:bg-muted/40"><div className="min-w-0 flex-1"><p className="font-bold">{o.id}<span className="ml-2 text-xs font-normal text-muted-foreground">{fmtDateTime(o.createdAt)}</span></p><p className="truncate text-xs text-muted-foreground">{o.items.map((l) => `${l.qty}× ${l.name}`).join(', ')}</p></div><span className="tnum font-bold">{inr(o.totals.total)}</span><StatusBadge status={o.status} /></button></li>)}</ul>
          )}
        </>)}
      </Drawer>

      <Modal open={!!edit} onClose={() => setEdit(null)} size="md" title={edit?.id ? 'Edit customer' : 'Add customer'} footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>{edit?.id ? 'Save changes' : 'Add customer'}</Button></>}>
        {edit && <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Full name" required error={err.name} className="sm:col-span-2"><Input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Mobile" required error={err.phone}><Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
          <Field label="Email" error={err.email}><Input value={edit.email || ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
          <Field label="Birthday" className="sm:col-span-2"><Input value={edit.birthday || ''} onChange={(e) => setEdit({ ...edit, birthday: e.target.value })} placeholder="e.g. 14 March" /></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea rows={2} value={edit.notes || ''} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} placeholder="Preferences, allergies…" /></Field>
        </div>}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={`Delete ${del?.name}?`} message="Their profile and loyalty points will be removed. Past orders remain in the order log." confirmLabel="Delete customer" onConfirm={() => { actions.deleteCustomer(del.id); setView(null) }} />
      <OrderDrawer orderId={orderOpen} onClose={() => setOrderOpen(null)} />
    </>
  )
}
