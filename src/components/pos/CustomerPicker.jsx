import { useMemo, useState } from 'react'
import { Check, UserPlus, UserRound } from 'lucide-react'
import Modal from '../common/Modal.jsx'
import SearchInput from '../common/SearchInput.jsx'
import Button from '../common/Button.jsx'
import Avatar from '../common/Avatar.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import { Input } from '../common/Form.jsx'
import { useStore } from '../../context/StoreContext.jsx'
import { uid } from '../../utils/formatters.js'

export default function CustomerPicker({ open, onClose, selectedId, onSelect }) {
  const { customers, actions } = useStore()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ name: '', phone: '+91 ' })
  const list = useMemo(() => {
    const s = q.toLowerCase().replace(/\s/g, '')
    return customers.filter((c) => !s || c.name.toLowerCase().replace(/\s/g, '').includes(s) || c.phone.replace(/\s/g, '').includes(s)).slice(0, 30)
  }, [customers, q])
  const save = () => {
    if (!f.name.trim() || f.phone.replace(/\D/g, '').length < 12) return
    const c = { id: uid('c'), name: f.name.trim(), phone: f.phone.trim(), email: '' }
    actions.saveCustomer(c); onSelect({ ...c, points: 0 }); setAdding(false); setF({ name: '', phone: '+91 ' }); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Select customer" description="Attach a customer to earn loyalty points on this order." size="sm">
      {adding ? (
        <div className="space-y-3">
          <label className="block text-[13px] font-semibold">Full name<Input className="mt-1.5" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Customer name" autoFocus /></label>
          <label className="block text-[13px] font-semibold">Mobile number<Input className="mt-1.5" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+91 98765 43210" /></label>
          <div className="flex justify-end gap-2 pt-1"><Button variant="outline" onClick={() => setAdding(false)}>Back</Button><Button onClick={save}>Save &amp; select</Button></div>
        </div>
      ) : (<>
        <div className="mb-3 flex gap-2"><SearchInput value={q} onChange={setQ} placeholder="Search name or phone" className="flex-1" autoFocus /><Button variant="outline" icon={UserPlus} onClick={() => setAdding(true)}>New</Button></div>
        <button onClick={() => { onSelect(null); onClose() }} className="mb-1 flex w-full items-center gap-3 rounded-lg p-2.5 text-left hover:bg-muted/60">
          <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"><UserRound className="size-4" /></span>
          <span className="flex-1 text-[13px] font-semibold">Walk-in customer</span>{!selectedId && <Check className="size-4 text-primary" />}
        </button>
        <ul className="max-h-80 overflow-y-auto">
          {list.map((c) => (
            <li key={c.id}><button onClick={() => { onSelect(c); onClose() }} className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left hover:bg-muted/60">
              <Avatar name={c.name} /><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{c.name}</span><span className="block text-xs text-muted-foreground">{c.phone}</span></span>
              <StatusBadge status={c.tier} dot={false} /><span className="tnum w-14 text-right text-xs text-muted-foreground">{c.points} pts</span>{selectedId === c.id && <Check className="size-4 text-primary" />}
            </button></li>
          ))}
          {list.length === 0 && <li className="py-8 text-center text-[13px] text-muted-foreground">No customers match. Add a new one.</li>}
        </ul>
      </>)}
    </Modal>
  )
}
