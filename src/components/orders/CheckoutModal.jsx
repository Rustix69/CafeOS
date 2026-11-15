import { useEffect, useMemo, useState } from 'react'
import { Banknote, CheckCircle2, CreditCard, Loader2, Plus, QrCode, SplitSquareHorizontal, Smartphone, X } from 'lucide-react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { Input, Select } from '../common/Form.jsx'
import { cn, inr, inr2 } from '../../utils/formatters.js'

const METHODS = [
  { v: 'cash', l: 'Cash', i: Banknote }, { v: 'upi', l: 'UPI', i: Smartphone }, { v: 'card', l: 'Card', i: CreditCard }, { v: 'split', l: 'Split', i: SplitSquareHorizontal },
]

function FakeUpiQr() {
  const cells = []
  let h = 12345
  for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
    h = (h * 1103515245 + 12345) >>> 0
    const f = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17)
    let on = (h >>> 16) % 2 === 0
    if (f) { const lx = x < 7 ? x : x - 18, ly = y < 7 ? y : y - 18; on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5) }
    if (on) cells.push(<rect key={`${x}${y}`} x={x} y={y} width="1" height="1" />)
  }
  return <svg viewBox="0 0 25 25" className="size-36" fill="currentColor" shapeRendering="crispEdges">{cells}</svg>
}

export default function CheckoutModal({ open, onClose, total, title = 'Take payment', subtitle, onConfirm }) {
  const [method, setMethod] = useState('cash')
  const [tendered, setTendered] = useState('')
  const [upiConfirmed, setUpiConfirmed] = useState(false)
  const [cardState, setCardState] = useState('idle')
  const [splits, setSplits] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setMethod('cash'); setTendered(''); setUpiConfirmed(false); setCardState('idle'); setBusy(false)
      const half = Math.round(total / 2)
      setSplits([{ method: 'cash', amount: half }, { method: 'upi', amount: total - half }])
    }
  }, [open, total])

  const t = Number(tendered) || 0
  const change = Math.max(0, t - total)
  const splitSum = splits.reduce((s, x) => s + (Number(x.amount) || 0), 0)
  const remaining = total - splitSum
  const valid = useMemo(() => {
    if (method === 'cash') return t >= total
    if (method === 'upi') return upiConfirmed
    if (method === 'card') return cardState === 'approved'
    return splits.length >= 2 && Math.abs(remaining) < 0.5 && splits.every((s) => Number(s.amount) > 0)
  }, [method, t, total, upiConfirmed, cardState, splits, remaining])

  const swipe = () => { setCardState('processing'); setTimeout(() => setCardState('approved'), 1300) }
  const confirm = () => {
    setBusy(true)
    setTimeout(() => {
      const base = method === 'split'
        ? { method: 'split', splits: splits.map((s) => ({ method: s.method, amount: Number(s.amount) })) }
        : { method, splits: [{ method, amount: total }] }
      onConfirm({ ...base, ref: method === 'upi' ? `UPI${Date.now().toString().slice(-9)}` : method === 'card' ? `AUTH${Math.floor(100000 + Math.random() * 899999)}` : null, tendered: method === 'cash' ? t : undefined, change: method === 'cash' ? change : undefined })
    }, 450)
  }
  const quick = [total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, 1000, 2000].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 4)

  return (
    <Modal open={open} onClose={onClose} size="md" title={title} description={subtitle}
      footer={<>
        <Button variant="outline" onClick={onClose}>Back</Button>
        <Button size="lg" disabled={!valid || busy} onClick={confirm} icon={busy ? Loader2 : CheckCircle2} className={busy ? '[&_svg]:animate-spin' : ''}>
          {busy ? 'Processing…' : `Confirm ${inr(total)}`}
        </Button>
      </>}>
      <div className="mb-4 flex items-center justify-between rounded-lg bg-primary/8 px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground">Amount due</span>
        <span className="tnum text-3xl font-extrabold tracking-tight text-primary">{inr2(total)}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {METHODS.map((m) => (
          <button key={m.v} onClick={() => setMethod(m.v)} className={cn('flex h-16 flex-col items-center justify-center gap-1 rounded-lg border text-[13px] font-bold transition', method === m.v ? 'border-primary bg-primary/8 text-primary ring-2 ring-primary/20' : 'hover:bg-muted/50')}>
            <m.i className="size-5" />{m.l}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-44">
        {method === 'cash' && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Cash received</span>
              <Input autoFocus type="number" inputMode="numeric" value={tendered} onChange={(e) => setTendered(e.target.value)} placeholder="Enter amount" className="h-12 text-lg font-bold" /></label>
            <div className="flex flex-wrap gap-2">{quick.map((q) => <Button key={q} variant="outline" size="sm" onClick={() => setTendered(String(q))}>{q === total ? 'Exact ' : ''}{inr(q)}</Button>)}</div>
            <div className={cn('flex items-center justify-between rounded-lg border px-4 py-3', t >= total && t > 0 ? 'border-primary/30 bg-primary/5' : 'bg-muted/30')}>
              <span className="text-sm font-semibold text-muted-foreground">{t > 0 && t < total ? 'Short by' : 'Change to return'}</span>
              <span className={cn('tnum text-xl font-extrabold', t > 0 && t < total && 'text-destructive')}>{inr2(t > 0 && t < total ? total - t : change)}</span>
            </div>
          </div>
        )}
        {method === 'upi' && (
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <div className="rounded-lg border bg-white p-3 text-neutral-900"><FakeUpiQr /></div>
            <div className="flex-1 space-y-2">
              <p className="flex items-center justify-center gap-2 text-sm font-bold sm:justify-start"><QrCode className="size-4 text-primary" />Scan with any UPI app</p>
              <p className="text-[13px] text-muted-foreground">GPay, PhonePe, Paytm, BHIM. Payee: thecoffeehouse@okaxis</p>
              {upiConfirmed
                ? <p className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-sm font-bold text-primary"><CheckCircle2 className="size-4" />Payment received</p>
                : <Button variant="soft" onClick={() => setUpiConfirmed(true)}>Mark payment received</Button>}
            </div>
          </div>
        )}
        {method === 'card' && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/20 py-8 text-center">
            {cardState === 'idle' && <><CreditCard className="size-9 text-muted-foreground" /><p className="text-sm text-muted-foreground">Present the card to the POS terminal</p><Button onClick={swipe}>Start card payment</Button></>}
            {cardState === 'processing' && <><Loader2 className="size-9 animate-spin text-secondary" /><p className="text-sm font-semibold">Waiting for terminal approval…</p></>}
            {cardState === 'approved' && <><CheckCircle2 className="size-9 text-primary" /><p className="text-sm font-bold">Approved</p><p className="text-xs text-muted-foreground">Visa •••• 4821 · Auth code issued</p></>}
          </div>
        )}
        {method === 'split' && (
          <div className="space-y-2.5">
            {splits.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-32"><Select value={s.method} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))} options={[{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'card', label: 'Card' }]} /></div>
                <Input type="number" value={s.amount} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} className="font-semibold" />
                {splits.length > 2 && <Button variant="ghost" size="icon-sm" onClick={() => setSplits(splits.filter((_, j) => j !== i))}><X className="size-4" /></Button>}
              </div>
            ))}
            <div className="flex items-center justify-between">
              {splits.length < 4 ? <Button variant="ghost" size="sm" icon={Plus} onClick={() => setSplits([...splits, { method: 'card', amount: Math.max(0, remaining) }])}>Add payer</Button> : <span />}
              <span className={cn('tnum text-sm font-bold', Math.abs(remaining) < 0.5 ? 'text-primary' : 'text-destructive')}>{Math.abs(remaining) < 0.5 ? 'Fully allocated' : remaining > 0 ? `${inr2(remaining)} remaining` : `${inr2(-remaining)} over`}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
