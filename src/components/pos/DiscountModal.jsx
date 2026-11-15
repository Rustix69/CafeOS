import { useEffect, useState } from 'react'
import { Percent, Tag, IndianRupee } from 'lucide-react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { Input, Segmented } from '../common/Form.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { inr } from '../../utils/formatters.js'

export default function DiscountModal({ open, onClose, current, subtotal, onApply }) {
  const { settings } = useStore()
  const [type, setType] = useState('percent')
  const [value, setValue] = useState('')
  const [code, setCode] = useState('')
  const max = settings.billing.maxDiscount
  useEffect(() => { if (open) { setType(current?.type || 'percent'); setValue(current?.value ? String(current.value) : ''); setCode(current?.code || '') } }, [open, current])
  const v = Number(value) || 0
  const amt = type === 'percent' ? (subtotal * v) / 100 : Math.min(v, subtotal)
  const err = type === 'percent' && v > max ? `Maximum allowed discount is ${max}% for your role.` : type === 'flat' && v > subtotal ? 'Discount cannot exceed the subtotal.' : ''
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Apply discount" description={`Subtotal ${inr(subtotal)}`}
      footer={<>
        {current && <Button variant="danger-soft" className="mr-auto" onClick={() => { onApply(null); onClose() }}>Remove</Button>}
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!v || !!err} onClick={() => { onApply({ type, value: v, code: code || undefined }); onClose() }}>Apply {v ? `(−${inr(amt)})` : ''}</Button>
      </>}>
      <Segmented value={type} onChange={(t) => { setType(t); setCode('') }} options={[{ value: 'percent', label: 'Percentage %' }, { value: 'flat', label: 'Flat amount ₹' }]} className="mb-3 w-full [&>button]:flex-1" />
      <div className="relative"><Input type="number" min="0" value={value} onChange={(e) => { setValue(e.target.value); setCode('') }} placeholder={type === 'percent' ? 'e.g. 10' : 'e.g. 50'} className="h-12 pl-9 text-lg font-bold" autoFocus />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{type === 'percent' ? <Percent className="size-4" /> : <IndianRupee className="size-4" />}</span></div>
      {err && <p className="mt-1.5 text-xs text-destructive">{err}</p>}
      <div className="mt-3 flex flex-wrap gap-2">{(type === 'percent' ? [5, 10, 15, 20] : [20, 50, 100]).map((q) => <Button key={q} variant="outline" size="sm" onClick={() => { setValue(String(q)); setCode('') }}>{type === 'percent' ? `${q}%` : inr(q)}</Button>)}</div>
      <h4 className="mb-2 mt-5 flex items-center gap-1.5 text-[13px] font-bold"><Tag className="size-3.5" />Coupons</h4>
      <div className="space-y-1.5">
        {settings.billing.coupons.map((c) => (
          <button key={c.code} onClick={() => { setType(c.type); setValue(String(c.value)); setCode(c.code) }} className={`flex w-full items-center justify-between rounded-lg border border-dashed px-3 py-2 text-left text-[13px] transition hover:bg-muted/50 ${code === c.code ? 'border-primary bg-primary/6' : ''}`}>
            <span className="font-mono font-bold">{c.code}</span><span className="text-muted-foreground">{c.type === 'percent' ? `${c.value}% off` : `${inr(c.value)} off`}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
