import { useState } from 'react'
import { Ban, CheckCircle2, ChefHat, CreditCard, FileText, Printer, Wallet } from 'lucide-react'
import Drawer from '../common/Drawer.jsx'
import Button from '../common/Button.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import ConfirmDialog from '../common/ConfirmDialog.jsx'
import { Select } from '../common/Form.jsx'
import ReceiptModal from './Receipt.jsx'
import CheckoutModal from './CheckoutModal.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../common/Toast.jsx'
import { fmtDateTime, inr, inr2 } from '../../utils/formatters.js'
import { lineUnit } from '../../utils/calculations.js'
import { NEXT_STATUS } from '../../data/mockData.js'

const FLOW = ['pending', 'preparing', 'ready', 'completed']

export default function OrderDrawer({ orderId, onClose }) {
  const { orders, staff, actions } = useStore()
  const toast = useToast()
  const [receipt, setReceipt] = useState(false)
  const [pay, setPay] = useState(false)
  const [cancel, setCancel] = useState(false)
  const [reason, setReason] = useState('Customer request')
  const o = orders.find((x) => x.id === orderId)
  if (!o) return null
  const done = o.status === 'completed' || o.status === 'cancelled'
  const idx = FLOW.indexOf(o.status)
  const cashier = staff.find((s) => s.id === o.staffId)

  return (
    <>
      <Drawer open={!!orderId} onClose={onClose} width="max-w-lg" title={<span className="flex items-center gap-2.5">{o.id}<StatusBadge status={o.status} /></span>}
        subtitle={<>{fmtDateTime(o.createdAt)} · <span className="capitalize">{o.type}</span>{o.table && ` · Table ${o.table}`}</>}
        footer={<>
          <Button variant="outline" icon={FileText} onClick={() => setReceipt(true)}>View invoice</Button>
          <Button variant="outline" icon={Printer} onClick={() => { toast(`Reprinting bill ${o.invoiceNo}`, { desc: 'Sent to Epson TM-T82 (USB)', type: 'info' }); setReceipt(true) }}>Reprint bill</Button>
          {!done && <Button variant="danger-soft" icon={Ban} className="ml-auto" onClick={() => setCancel(true)}>Cancel order</Button>}
        </>}>
        {/* progress */}
        {o.status !== 'cancelled' && (
          <div className="mb-5 flex items-center">
            {FLOW.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${i <= idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i < idx || o.status === 'completed' ? <CheckCircle2 className="size-4" /> : i + 1}</span>
                  <span className="text-[11px] font-semibold capitalize text-muted-foreground">{s}</span>
                </div>
                {i < FLOW.length - 1 && <span className={`mx-1 mb-5 h-0.5 flex-1 rounded ${i < idx ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        )}
        {o.status === 'cancelled' && <div className="mb-4 rounded-lg bg-destructive/8 p-3 text-[13px] text-destructive"><b>Order cancelled.</b> {o.cancelReason && `Reason: ${o.cancelReason}.`} {o.payment.status === 'refunded' && 'Refund initiated.'}</div>}

        {!done && (
          <div className="mb-5 flex flex-wrap gap-2">
            {NEXT_STATUS[o.status] && <Button icon={ChefHat} onClick={() => actions.updateOrderStatus(o.id, NEXT_STATUS[o.status])}>Mark as {NEXT_STATUS[o.status]}</Button>}
            {o.payment.status === 'unpaid' && <Button variant="soft" icon={Wallet} onClick={() => setPay(true)}>Collect {inr(o.totals.total)}</Button>}
          </div>
        )}
        {o.status === 'completed' && o.payment.status === 'unpaid' && <Button className="mb-5" variant="soft" icon={Wallet} onClick={() => setPay(true)}>Collect {inr(o.totals.total)}</Button>}

        <div className="mb-5 grid grid-cols-2 gap-3 text-[13px]">
          {[['Customer', o.customerName], ['Invoice', o.invoiceNo], ['Handled by', cashier?.name || '—'], ['Payment', <StatusBadge key="p" status={o.payment.status} />]].map(([k, v]) => (
            <div key={k} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{k}</p><div className="mt-0.5 font-semibold">{v}</div></div>
          ))}
        </div>

        <h4 className="mb-2 text-sm font-bold">Items ({o.items.reduce((s, l) => s + l.qty, 0)})</h4>
        <ul className="divide-y rounded-lg border">
          {o.items.map((l, i) => (
            <li key={i} className="flex items-start gap-3 p-3 text-[13px]">
              <span className="tnum grid size-6 shrink-0 place-items-center rounded bg-muted text-xs font-bold">{l.qty}×</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{l.name}{l.variant && <span className="font-normal text-muted-foreground"> · {l.variant.name}</span>}</p>
                {l.addons?.length > 0 && <p className="text-xs text-muted-foreground">+ {l.addons.map((a) => a.name).join(', ')}</p>}
                {l.note && <p className="text-xs italic text-warning-foreground">“{l.note}”</p>}
              </div>
              <span className="tnum font-semibold">{inr(lineUnit(l) * l.qty)}</span>
            </li>
          ))}
        </ul>
        {o.note && <p className="mt-3 rounded-lg bg-warning/12 p-3 text-[13px]"><b>Instructions:</b> {o.note}</p>}

        <div className="mt-5 space-y-1.5 rounded-lg bg-muted/40 p-4 text-[13px]">
          <Row k="Subtotal" v={inr2(o.totals.subtotal)} />
          {o.totals.discount > 0 && <Row k={`Discount${o.discount?.code ? ` (${o.discount.code})` : ''}`} v={`-${inr2(o.totals.discount)}`} />}
          <Row k="CGST" v={inr2(o.totals.cgst)} muted /><Row k="SGST" v={inr2(o.totals.sgst)} muted />
          <div className="flex justify-between border-t pt-2 text-base font-extrabold"><span>Total</span><span className="tnum">{inr2(o.totals.total)}</span></div>
          {o.payment.status === 'paid' && <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground"><CreditCard className="size-3.5" />Paid via {o.payment.splits?.map((s) => `${s.method.toUpperCase()} ${inr(s.amount)}`).join(' + ')}</p>}
        </div>

        <h4 className="mb-2 mt-5 text-sm font-bold">Timeline</h4>
        <ol className="space-y-2 border-l pl-4">
          {(o.history || []).map((h, i) => <li key={i} className="relative text-[13px]"><span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" /><span className="font-semibold capitalize">{h.status}</span><span className="ml-2 text-xs text-muted-foreground">{fmtDateTime(h.at)}</span></li>)}
        </ol>
      </Drawer>
      <ReceiptModal order={o} open={receipt} onClose={() => setReceipt(false)} />
      <CheckoutModal open={pay} onClose={() => setPay(false)} total={o.totals.total} title={`Collect payment · ${o.id}`} onConfirm={(p) => { actions.payOrder(o.id, p); setPay(false) }} />
      <ConfirmDialog open={cancel} onClose={() => setCancel(false)} title={`Cancel order ${o.id}?`} message={`This will stop preparation${o.payment.status === 'paid' ? ' and mark the payment as refunded' : ''}. This can't be undone.`} confirmLabel="Cancel order" onConfirm={() => actions.cancelOrder(o.id, reason)}>
        <div className="mt-3"><Select value={reason} onChange={(e) => setReason(e.target.value)} options={['Customer request', 'Item unavailable', 'Wrong order', 'Duplicate order', 'Kitchen delay']} /></div>
      </ConfirmDialog>
    </>
  )
}
const Row = ({ k, v, muted }) => <div className={`flex justify-between ${muted ? 'text-muted-foreground' : ''}`}><span>{k}</span><span className="tnum">{v}</span></div>
