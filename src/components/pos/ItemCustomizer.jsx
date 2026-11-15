import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { Textarea } from '../common/Form.jsx'
import ProductImage from '../common/ProductImage.jsx'
import { cn, inr } from '../../utils/formatters.js'

export default function ItemCustomizer({ item, initial, onClose, onSave }) {
  const [variant, setVariant] = useState(null)
  const [addons, setAddons] = useState([])
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  useEffect(() => {
    if (!item) return
    setVariant(initial?.variant || item.variants?.find((v) => v.delta === 0) || item.variants?.[0] || null)
    setAddons(initial?.addons || []); setQty(initial?.qty || 1); setNote(initial?.note || '')
  }, [item, initial])
  if (!item) return null
  const unit = item.price + (variant?.delta || 0) + addons.reduce((s, a) => s + a.price, 0)
  const toggle = (a) => setAddons((l) => (l.find((x) => x.name === a.name) ? l.filter((x) => x.name !== a.name) : [...l, a]))
  return (
    <Modal open onClose={onClose} title={item.name} description={item.desc} size="sm"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button size="lg" onClick={() => onSave({ variant, addons, qty, note: note.trim() })}>{initial ? 'Update item' : 'Add to order'} · {inr(unit * qty)}</Button></>}>
      <div className="mb-4 flex items-center gap-3">
        <ProductImage item={item} className="size-16 rounded-lg" />
        <div className="flex-1"><p className="text-xs text-muted-foreground">Base price</p><p className="tnum text-lg font-extrabold">{inr(item.price)}</p></div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="size-4" /></Button>
          <span className="tnum w-7 text-center font-bold">{qty}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setQty(qty + 1)}><Plus className="size-4" /></Button>
        </div>
      </div>
      {item.variants?.length > 0 && (
        <section className="mb-4"><h4 className="mb-2 text-[13px] font-bold">Size / Variant</h4>
          <div className="grid grid-cols-2 gap-2">
            {item.variants.map((v) => (
              <button key={v.name} onClick={() => setVariant(v)} className={cn('flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-[13px] font-semibold transition', variant?.name === v.name ? 'border-primary bg-primary/8 ring-2 ring-primary/20' : 'hover:bg-muted/50')}>
                {v.name}<span className="tnum text-xs text-muted-foreground">{v.delta ? `${v.delta > 0 ? '+' : '−'}${inr(Math.abs(v.delta))}` : 'Included'}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      {item.addons?.length > 0 && (
        <section className="mb-4"><h4 className="mb-2 text-[13px] font-bold">Add-ons</h4>
          <div className="grid grid-cols-2 gap-2">
            {item.addons.map((a) => { const on = addons.some((x) => x.name === a.name); return (
              <button key={a.name} onClick={() => toggle(a)} className={cn('flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-[13px] font-semibold transition', on ? 'border-primary bg-primary/8 ring-2 ring-primary/20' : 'hover:bg-muted/50')}>
                <span>{a.name}</span><span className="tnum text-xs text-muted-foreground">{a.price ? `+${inr(a.price)}` : 'Free'}</span>
              </button>) })}
          </div>
        </section>
      )}
      <section><h4 className="mb-2 text-[13px] font-bold">Special instructions</h4>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Less sugar, extra hot, no onion…" rows={2} />
        <div className="mt-2 flex flex-wrap gap-1.5">{['Less sugar', 'No sugar', 'Extra hot', 'No onion', 'Spicy'].map((s) => <button key={s} onClick={() => setNote((n) => (n ? `${n}, ${s}` : s))} className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/60">{s}</button>)}</div>
      </section>
    </Modal>
  )
}
