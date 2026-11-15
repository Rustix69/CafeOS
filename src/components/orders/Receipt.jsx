import { Printer, Download } from 'lucide-react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../common/Toast.jsx'
import { inr2, fmtDate, fmtTime } from '../../utils/formatters.js'
import { lineUnit } from '../../utils/calculations.js'

function FakeQR({ seed }) {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const N = 23
  const cells = []
  const finder = (x, y) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    h = (h * 1664525 + 1013904223) >>> 0
    let on = (h >>> 16) % 2 === 0
    if (finder(x, y)) {
      const fx = x % (N - 7 >= x ? 7 : N - 7 + 0) // approximate
      const lx = x < 7 ? x : x - (N - 7), ly = y < 7 ? y : y - (N - 7)
      on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)
      void fx
    }
    if (on) cells.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" />)
  }
  return <svg viewBox={`0 0 ${N} ${N}`} className="size-20" fill="currentColor" shapeRendering="crispEdges">{cells}</svg>
}

export function ReceiptBody({ order }) {
  const { settings } = useStore()
  const b = settings.business
  const t = order.totals
  const rates = Object.entries(t.byRate || {})
  return (
    <div className="print-area mx-auto w-full max-w-[320px] rounded-md border bg-white p-4 font-mono text-[11.5px] leading-relaxed text-neutral-800 shadow-sm">
      <div className="text-center">
        <p className="font-sans text-base font-extrabold tracking-tight">{b.name}</p>
        <p className="mx-auto max-w-[240px] text-[10.5px]">{b.address}</p>
        <p className="text-[10.5px]">Ph: {b.phone}</p>
        <p className="text-[10.5px]">GSTIN: {b.gstin}</p>
        <p className="text-[10.5px]">FSSAI: {b.fssai}</p>
      </div>
      <div className="my-2 border-t border-dashed border-neutral-400" />
      <p className="text-center font-bold tracking-wider">TAX INVOICE</p>
      <div className="mt-1.5 grid grid-cols-2 gap-x-2 text-[10.5px]">
        <span>Bill: {order.invoiceNo}</span><span className="text-right">Order: {order.id}</span>
        <span>Date: {fmtDate(order.createdAt)}</span><span className="text-right">{fmtTime(order.createdAt)}</span>
        <span>Type: <span className="capitalize">{order.type}</span></span><span className="text-right">{order.table ? `Table: ${order.table}` : ''}</span>
        <span className="col-span-2">Customer: {order.customerName}</span>
      </div>
      <div className="my-2 border-t border-dashed border-neutral-400" />
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 font-bold"><span>Item</span><span>Qty</span><span className="text-right">Amount</span></div>
      <div className="mt-1 space-y-1">
        {order.items.map((l, i) => (
          <div key={i}>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3"><span>{l.name}{l.variant ? ` (${l.variant.name})` : ''}</span><span>{l.qty}</span><span className="text-right">{(lineUnit(l) * l.qty).toFixed(2)}</span></div>
            {l.addons?.length > 0 && <p className="pl-2 text-[10px] text-neutral-500">+ {l.addons.map((a) => a.name).join(', ')}</p>}
            {l.note && <p className="pl-2 text-[10px] italic text-neutral-500">“{l.note}”</p>}
          </div>
        ))}
      </div>
      <div className="my-2 border-t border-dashed border-neutral-400" />
      <div className="space-y-0.5">
        <div className="flex justify-between"><span>Subtotal</span><span>{t.subtotal.toFixed(2)}</span></div>
        {t.discount > 0 && <div className="flex justify-between"><span>Discount{order.discount?.code ? ` (${order.discount.code})` : ''}</span><span>-{t.discount.toFixed(2)}</span></div>}
        {rates.map(([r, v]) => (<div key={r}>
          <div className="flex justify-between text-neutral-600"><span>CGST @ {r / 2}%</span><span>{(v.tax / 2).toFixed(2)}</span></div>
          <div className="flex justify-between text-neutral-600"><span>SGST @ {r / 2}%</span><span>{(v.tax / 2).toFixed(2)}</span></div>
        </div>))}
        {Math.abs(t.roundOff) > 0.004 && <div className="flex justify-between"><span>Round off</span><span>{t.roundOff.toFixed(2)}</span></div>}
      </div>
      <div className="my-2 border-y border-dashed border-neutral-400 py-1.5">
        <div className="flex items-baseline justify-between font-sans text-sm font-extrabold"><span>GRAND TOTAL</span><span>{inr2(t.total)}</span></div>
      </div>
      <p className="text-[10.5px]">Payment: <b className="uppercase">{order.payment.status === 'paid' ? (order.payment.splits?.length > 1 ? 'Split — ' + order.payment.splits.map((s) => `${s.method.toUpperCase()} ${s.amount}`).join(' + ') : order.payment.method) : order.payment.status}</b></p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-[10px] text-neutral-500"><p>{settings.billing.footer}</p><p className="mt-1">Powered by CafeOS</p></div>
        {settings.printer.showQr && <FakeQR seed={order.invoiceNo} />}
      </div>
    </div>
  )
}

export default function ReceiptModal({ order, open, onClose, kot }) {
  const toast = useToast()
  if (!order) return null
  return (
    <Modal open={open} onClose={onClose} size="sm" title={kot ? 'Kitchen order ticket' : 'Invoice preview'} description={`${order.invoiceNo} · ${order.id}`}
      footer={<>
        <Button variant="outline" icon={Download} onClick={() => toast('Invoice PDF downloaded', { desc: `${order.invoiceNo}.pdf` })}>PDF</Button>
        <Button icon={Printer} onClick={() => { window.print(); toast('Sent to receipt printer', { desc: 'Receipt printer · 80mm' }) }}>Print receipt</Button>
      </>}>
      <div className="rounded-lg bg-muted/50 p-4"><ReceiptBody order={order} /></div>
    </Modal>
  )
}
