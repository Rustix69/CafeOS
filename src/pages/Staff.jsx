import { useMemo, useState } from 'react'
import { Activity, BadgeCheck, MoreHorizontal, Pencil, Phone, Mail, ShieldCheck, Trash2, UserCog, UserPlus, UserX, Users, Clock } from 'lucide-react'
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
import Dropdown, { MenuItem, MenuLabel, MenuSep } from '../components/common/Dropdown.jsx'
import { Field, Input, Select, Toggle } from '../components/common/Form.jsx'
import { ROLES } from '../data/mockData.js'
import { cn, fmtDate, inr, timeAgo, uid } from '../utils/formatters.js'

const ROLE_TONE = { Admin: 'bg-destructive/10 text-destructive', Manager: 'bg-secondary/15 text-secondary', Cashier: 'bg-primary/12 text-primary', 'Kitchen Staff': 'bg-warning/18 text-warning-foreground', Waiter: 'bg-accent/30 text-accent-foreground' }
const SHIFTS = ['Morning (7 AM – 3 PM)', 'General (9 AM – 6 PM)', 'Evening (2 PM – 10 PM)', 'Weekend']
const blank = { name: '', role: 'Cashier', phone: '+91 ', email: '', shift: SHIFTS[0], active: true }

export default function Staff() {
  const { staff, orders, currentUserId, actions } = useStore()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState({})
  const [view, setView] = useState(null)
  const [del, setDel] = useState(null)

  const stats = useMemo(() => Object.fromEntries(staff.map((s) => {
    const mine = orders.filter((o) => o.staffId === s.id && o.status !== 'cancelled')
    return [s.id, { sales: mine.reduce((n, o) => n + o.totals.total, 0), orders: mine.length }]
  })), [staff, orders])
  const rows = staff.filter((s) => (role === 'all' || s.role === role) && (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase())))
  const cur = staff.find((s) => s.id === view)
  const topSales = Math.max(...Object.values(stats).map((s) => s.sales), 1)

  const save = () => {
    const e = {}
    if (!edit.name.trim()) e.name = 'Name is required'
    if (edit.phone.replace(/\D/g, '').length < 12) e.phone = 'Enter a valid mobile number'
    if (!/^\S+@\S+\.\S+$/.test(edit.email || '')) e.email = 'Enter a valid email'
    setErr(e)
    if (Object.keys(e).length) return
    actions.saveStaff({ ...edit, id: edit.id || uid('u'), name: edit.name.trim() })
    setEdit(null)
  }
  const cols = [
    { key: 'name', header: 'Employee', render: (s) => <div className="flex items-center gap-3"><Avatar name={s.name} /><div><p className="flex items-center gap-1.5 font-bold">{s.name}{s.id === currentUserId && <span className="rounded bg-primary/12 px-1.5 text-[10px] font-bold text-primary">YOU</span>}</p><p className="text-xs text-muted-foreground">{s.shift}</p></div></div> },
    { key: 'role', header: 'Role', render: (s) => <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', ROLE_TONE[s.role])}>{s.role}</span> },
    { key: 'phone', header: 'Contact', hideBelow: 'md', render: (s) => <div className="text-[13px]"><p className="tnum">{s.phone}</p><p className="text-xs text-muted-foreground">{s.email}</p></div> },
    { key: 'status', header: 'Status', sortValue: (s) => +s.active, render: (s) => <StatusBadge status={s.active ? 'active' : 'inactive'} /> },
    { key: 'sales', header: 'Sales today', align: 'right', sortValue: (s) => stats[s.id].sales, render: (s) => <div className="ml-auto w-28"><p className="tnum text-right font-bold">{stats[s.id].sales ? inr(stats[s.id].sales) : '—'}</p><p className="text-right text-xs text-muted-foreground">{stats[s.id].orders} orders</p></div> },
    { key: 'actions', header: '', sortable: false, align: 'right', render: (s) => (
      <div onClick={(e) => e.stopPropagation()}><Dropdown width="w-52" trigger={<Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>}>
        <MenuItem icon={Activity} onClick={() => setView(s.id)}>View activity</MenuItem><MenuItem icon={Pencil} onClick={() => { setErr({}); setEdit({ ...s }) }}>Edit employee</MenuItem>
        <MenuItem icon={s.active ? UserX : BadgeCheck} onClick={() => (s.id === currentUserId ? null : actions.toggleStaff(s.id))} className={s.id === currentUserId ? 'opacity-40' : ''}>{s.active ? 'Deactivate account' : 'Activate account'}</MenuItem>
        <MenuLabel>Assign role</MenuLabel>{ROLES.map((r) => <MenuItem key={r} icon={s.role === r ? ShieldCheck : undefined} className={s.role === r ? 'font-bold' : 'pl-9'} onClick={() => actions.saveStaff({ ...s, role: r })}>{r}</MenuItem>)}
        <MenuSep /><MenuItem icon={Trash2} danger onClick={() => setDel(s)}>Remove</MenuItem></Dropdown></div>) },
  ]

  return (
    <>
      <PageHeader title="Staff" description="Manage employees, roles and account access across your cafe."
        actions={<Button icon={UserPlus} onClick={() => { setErr({}); setEdit({ ...blank }) }}>Add employee</Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Employees" value={staff.length} icon={Users} tone="secondary" />
        <StatCard label="Active Accounts" value={staff.filter((s) => s.active).length} icon={BadgeCheck} hint={`${staff.filter((s) => !s.active).length} inactive`} />
        <StatCard label="On Floor Now" value={staff.filter((s) => s.active && (s.shift.startsWith('General') || s.shift.startsWith(new Date().getHours() < 14 ? 'Morning' : 'Evening'))).length} icon={Clock} tone="accent" hint="current shift" />
        <StatCard label="Top Seller Today" value={staff.find((s) => stats[s.id].sales === topSales)?.name.split(' ')[0] || '—'} icon={UserCog} tone="warning" hint={inr(topSales)} />
      </div>
      <div className="mb-4 mt-5 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search employees…" className="w-full sm:w-72" />
        <div className="w-44"><Select value={role} onChange={(e) => setRole(e.target.value)} options={[{ value: 'all', label: 'All roles' }, ...ROLES.map((r) => ({ value: r, label: r }))]} /></div>
      </div>
      <DataTable columns={cols} rows={rows} pageSize={10} onRowClick={(s) => setView(s.id)} />

      <Drawer open={!!cur} onClose={() => setView(null)} width="max-w-md" title="Staff activity"
        footer={cur && <><Button variant="outline" icon={Pencil} onClick={() => { setErr({}); setEdit({ ...cur }) }}>Edit</Button><Button variant={cur.active ? 'danger-soft' : 'soft'} disabled={cur.id === currentUserId} onClick={() => actions.toggleStaff(cur.id)}>{cur.active ? 'Deactivate' : 'Activate'}</Button></>}>
        {cur && (<>
          <div className="flex items-center gap-4"><Avatar name={cur.name} size="xl" /><div><h3 className="text-lg font-extrabold">{cur.name}</h3><span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', ROLE_TONE[cur.role])}>{cur.role}</span><div className="mt-1.5"><StatusBadge status={cur.active ? 'active' : 'inactive'} /></div></div></div>
          <div className="mt-4 space-y-1.5 text-[13px] text-muted-foreground"><p className="flex items-center gap-2"><Phone className="size-3.5" />{cur.phone}</p><p className="flex items-center gap-2"><Mail className="size-3.5" />{cur.email}</p><p className="flex items-center gap-2"><Clock className="size-3.5" />{cur.shift} · joined {fmtDate(cur.joined)}</p></div>
          <div className="mt-5 grid grid-cols-2 gap-2.5">{[['Sales today', inr(stats[cur.id].sales)], ['Orders handled', stats[cur.id].orders], ['Avg. bill', inr(stats[cur.id].sales / Math.max(1, stats[cur.id].orders))], ['Share of sales', `${((stats[cur.id].sales / Math.max(1, Object.values(stats).reduce((s, x) => s + x.sales, 0))) * 100).toFixed(0)}%`]].map(([k, v]) => <div key={k} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="tnum mt-0.5 text-base font-extrabold">{v}</p></div>)}</div>
          <h4 className="mb-2 mt-5 text-sm font-bold">Recent activity</h4>
          <ol className="space-y-3 border-l pl-4">{(cur.activity || []).map((a, i) => <li key={i} className="relative text-[13px]"><span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" /><p className="font-semibold">{a.text}</p><p className="text-xs text-muted-foreground">{timeAgo(a.at)}</p></li>)}</ol>
        </>)}
      </Drawer>

      <Modal open={!!edit} onClose={() => setEdit(null)} size="md" title={edit?.id ? 'Edit employee' : 'Add employee'} footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>{edit?.id ? 'Save changes' : 'Add employee'}</Button></>}>
        {edit && <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Full name" required error={err.name} className="sm:col-span-2"><Input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Role"><Select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })} options={ROLES} /></Field>
          <Field label="Shift"><Select value={edit.shift} onChange={(e) => setEdit({ ...edit, shift: e.target.value })} options={SHIFTS} /></Field>
          <Field label="Mobile" required error={err.phone}><Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
          <Field label="Email" required error={err.email}><Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
          <div className="rounded-lg border p-3.5 sm:col-span-2"><Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Account active" desc="Inactive employees cannot sign in to CafeOS." /></div>
        </div>}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={`Remove ${del?.name}?`} message={del?.id === currentUserId ? 'You cannot remove your own account.' : 'Their account will be deleted. Order history keeps their name for audit purposes.'} confirmLabel="Remove employee" onConfirm={() => del.id !== currentUserId && actions.deleteStaff(del.id)} />
    </>
  )
}
