import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardList, Download, Eye, FileText, MoreHorizontal, Plus, Printer, Ban } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../components/common/Toast.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import SearchInput from '../components/common/SearchInput.jsx'
import DataTable from '../components/common/DataTable.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import Button from '../components/common/Button.jsx'
import Tabs from '../components/common/Tabs.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import Dropdown, { MenuItem, MenuSep } from '../components/common/Dropdown.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import { Select } from '../components/common/Form.jsx'
import OrderDrawer from '../components/orders/OrderDrawer.jsx'
import ReceiptModal from '../components/orders/Receipt.jsx'
import { NEXT_STATUS } from '../data/mockData.js'
import { DAY, downloadCSV, fmtDateTime, inr, startOfDay } from '../utils/formatters.js'

export default function Orders() {
  const { orders, actions } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [pay, setPay] = useState('all')
  const [date, setDate] = useState('today')
  const [open, setOpen] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [cancel, setCancel] = useState(null)

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    const t0 = startOfDay()
    return orders.filter((o) =>
      (status === 'all' || o.status === status) && (type === 'all' || o.type === type) && (pay === 'all' || o.payment.status === pay) &&
      (date === 'all' || (date === 'today' ? o.createdAt >= t0 : date === 'yesterday' ? o.createdAt >= t0 - DAY && o.createdAt < t0 : o.createdAt >= t0 - 6 * DAY)) &&
      (!s || o.id.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s) || o.items.some((l) => l.name.toLowerCase().includes(s)) || (o.table || '').toLowerCase() === s)
    ).sort((a, b) => b.createdAt - a.createdAt)
  }, [orders, q, status, type, pay, date])
  const count = (s) => orders.filter((o) => s === 'all' || o.status === s).length

  const cols = [
    { key: 'id', header: 'Order ID', render: (o) => <span className="font-bold">{o.id}</span> },
    { key: 'createdAt', header: 'Date & Time', render: (o) => <span className="whitespace-nowrap text-muted-foreground">{fmtDateTime(o.createdAt)}</span> },
    { key: 'customerName', header: 'Customer', hideBelow: 'md', render: (o) => <span className="font-medium">{o.customerName}</span> },
    { key: 'type', header: 'Type', hideBelow: 'lg', render: (o) => <span className="capitalize">{o.type}{o.table && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-bold">{o.table}</span>}</span> },
    { key: 'items', header: 'Items', hideBelow: 'xl', sortable: false, render: (o) => <span className="block max-w-[220px] truncate text-muted-foreground" title={o.items.map((l) => `${l.qty}× ${l.name}`).join(', ')}>{o.items.map((l) => `${l.qty}× ${l.name}`).join(', ')}</span> },
    { key: 'amount', header: 'Amount', align: 'right', sortValue: (o) => o.totals.total, render: (o) => <span className="tnum font-bold">{inr(o.totals.total)}</span> },
    { key: 'payment', header: 'Payment', hideBelow: 'md', sortValue: (o) => o.payment.status, render: (o) => <StatusBadge status={o.payment.status} /> },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'actions', header: '', sortable: false, align: 'right', render: (o) => (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {NEXT_STATUS[o.status] && <Button variant="soft" size="xs" onClick={() => actions.updateOrderStatus(o.id, NEXT_STATUS[o.status])}>{NEXT_STATUS[o.status] === 'completed' ? 'Complete' : NEXT_STATUS[o.status] === 'preparing' ? 'Start' : 'Ready'}</Button>}
        <Dropdown width="w-48" trigger={<Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>}>
          <MenuItem icon={Eye} onClick={() => setOpen(o.id)}>View details</MenuItem>
          <MenuItem icon={FileText} onClick={() => setInvoice(o)}>View invoice</MenuItem>
          <MenuItem icon={Printer} onClick={() => { toast(`Reprinting ${o.invoiceNo}`, { type: 'info', desc: 'Sent to receipt printer' }); setInvoice(o) }}>Reprint bill</MenuItem>
          {!['completed', 'cancelled'].includes(o.status) && <><MenuSep /><MenuItem icon={Ban} danger onClick={() => setCancel(o)}>Cancel order</MenuItem></>}
        </Dropdown>
      </div>
    ) },
  ]
  const exportCsv = () => {
    downloadCSV('orders.csv', [['Order ID', 'Date', 'Customer', 'Type', 'Table', 'Items', 'Amount', 'Payment', 'Status'], ...rows.map((o) => [o.id, new Date(o.createdAt).toLocaleString('en-IN'), o.customerName, o.type, o.table || '', o.items.map((l) => `${l.qty}x ${l.name}`).join('; '), o.totals.total, o.payment.status, o.status])])
    toast(`Exported ${rows.length} orders`)
  }

  return (
    <>
      <PageHeader title="Orders" description="Track, update and manage every order across dine-in, takeaway and delivery."
        actions={<><Button variant="outline" icon={Download} onClick={exportCsv}>Export CSV</Button><Button icon={Plus} onClick={() => nav('/pos')}>New order</Button></>} />
      <Tabs className="mb-4" value={status} onChange={setStatus} tabs={['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map((s) => ({ value: s, label: s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1), count: count(s) }))} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search order ID, customer, item…" className="w-full sm:w-72" />
        <div className="w-36"><Select value={date} onChange={(e) => setDate(e.target.value)} options={[{ value: 'today', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' }, { value: '7d', label: 'Last 7 days' }, { value: 'all', label: 'All time' }]} /></div>
        <div className="w-36"><Select value={type} onChange={(e) => setType(e.target.value)} options={[{ value: 'all', label: 'All types' }, { value: 'dine-in', label: 'Dine-in' }, { value: 'takeaway', label: 'Takeaway' }, { value: 'delivery', label: 'Delivery' }]} /></div>
        <div className="w-40"><Select value={pay} onChange={(e) => setPay(e.target.value)} options={[{ value: 'all', label: 'All payments' }, { value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }, { value: 'refunded', label: 'Refunded' }]} /></div>
        {(q || type !== 'all' || pay !== 'all' || date !== 'today' || status !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setQ(''); setType('all'); setPay('all'); setDate('today'); setStatus('all') }}>Reset</Button>}
        <p className="ml-auto text-[13px] text-muted-foreground"><b className="text-foreground">{rows.length}</b> orders · <b className="tnum text-foreground">{inr(rows.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.totals.total, 0))}</b></p>
      </div>
      <DataTable columns={cols} rows={rows} pageSize={12} onRowClick={(o) => setOpen(o.id)} defaultSort={{ key: 'createdAt', dir: 'desc' }}
        empty={<EmptyState icon={ClipboardList} title="No orders match" message="Adjust the filters or create a new order from Point of Sale." action={<Button onClick={() => nav('/pos')}>Open POS</Button>} />} />
      <OrderDrawer orderId={open} onClose={() => setOpen(null)} />
      <ReceiptModal order={invoice} open={!!invoice} onClose={() => setInvoice(null)} />
      <ConfirmDialog open={!!cancel} onClose={() => setCancel(null)} title={`Cancel order ${cancel?.id}?`} message="The kitchen will be notified and any payment marked as refunded. This can't be undone." confirmLabel="Cancel order" onConfirm={() => actions.cancelOrder(cancel.id, 'Cancelled from Orders')} />
    </>
  )
}
