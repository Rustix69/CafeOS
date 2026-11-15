import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Building2, Check, ImagePlus, MonitorCog, Plus, Printer, Receipt, RotateCcw, ShieldCheck, Trash2, UtensilsCrossed, Download } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../components/common/Toast.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import Button from '../components/common/Button.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import Avatar from '../components/common/Avatar.jsx'
import { Card, Field, Input, Select, Textarea, Toggle, Segmented } from '../components/common/Form.jsx'
import { MODULES, ROLES } from '../data/mockData.js'
import { cn, inr } from '../utils/formatters.js'

const SECTIONS = [
  { id: 'business', label: 'Business Profile', icon: Building2, desc: 'Cafe identity shown on invoices' },
  { id: 'billing', label: 'Billing & GST', icon: Receipt, desc: 'Invoices, tax and discounts' },
  { id: 'printer', label: 'Printer Settings', icon: Printer, desc: 'Receipt and KOT printers' },
  { id: 'orders', label: 'Order Settings', icon: UtensilsCrossed, desc: 'Defaults and kitchen timing' },
  { id: 'permissions', label: 'Staff & Permissions', icon: ShieldCheck, desc: 'Role-based access' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alerts and summaries' },
  { id: 'system', label: 'System Preferences', icon: MonitorCog, desc: 'Appearance and data' },
]

/* draft editor shared by simple sections */
function useDraft(key) {
  const { settings, actions } = useStore()
  const [d, setD] = useState(settings[key])
  useEffect(() => setD(settings[key]), [settings, key])
  const dirty = JSON.stringify(d) !== JSON.stringify(settings[key])
  const set = (p) => setD((x) => ({ ...x, ...p }))
  return { d, set, dirty, save: () => actions.updateSettings(key, d), reset: () => setD(settings[key]) }
}
function SaveBar({ dirty, onSave, onReset }) {
  return (
    <div className={cn('sticky bottom-0 -mx-5 mt-6 flex items-center justify-end gap-2 border-t bg-card/95 px-5 py-3 backdrop-blur transition sm:rounded-b-xl', !dirty && 'opacity-60')}>
      {dirty && <span className="mr-auto text-xs font-semibold text-warning-foreground">Unsaved changes</span>}
      <Button variant="outline" disabled={!dirty} onClick={onReset}>Discard</Button><Button disabled={!dirty} onClick={onSave} icon={Check}>Save changes</Button>
    </div>
  )
}
const Panel = ({ title, desc, children }) => (
  <Card className="px-5 pt-5"><div className="mb-5"><h2 className="text-base font-extrabold tracking-tight">{title}</h2><p className="text-[13px] text-muted-foreground">{desc}</p></div>{children}</Card>
)

function Business() {
  const { d, set, dirty, save, reset } = useDraft('business')
  const toast = useToast()
  const file = useRef(null)
  const [err, setErr] = useState({})
  const submit = () => {
    const e = {}
    if (!d.name.trim()) e.name = 'Cafe name is required'
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(d.gstin)) e.gstin = 'Enter a valid 15-character GSTIN'
    setErr(e); if (!Object.keys(e).length) save(); else toast('Please fix the highlighted fields', { type: 'error' })
  }
  return (
    <Panel title="Business Profile" desc="This information appears on invoices and receipts.">
      <div className="mb-5 flex items-center gap-4">
        {d.logo ? <img src={d.logo} alt="Logo" className="size-16 rounded-xl border object-cover" /> : <Avatar name={d.name} size="xl" className="rounded-xl" />}
        <div><input ref={file} hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => set({ logo: r.result }); r.readAsDataURL(f) }} />
          <Button variant="outline" size="sm" icon={ImagePlus} onClick={() => file.current.click()}>Upload logo</Button>{d.logo && <Button variant="ghost" size="sm" onClick={() => set({ logo: '' })}>Remove</Button>}<p className="mt-1.5 text-xs text-muted-foreground">PNG or JPG, square, at least 256×256.</p></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cafe name" required error={err.name}><Input value={d.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Tagline"><Input value={d.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Field>
        <Field label="Address" className="sm:col-span-2"><Textarea rows={2} value={d.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        <Field label="Phone"><Input value={d.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="GSTIN" error={err.gstin} hint="15-character GST identification number"><Input value={d.gstin} onChange={(e) => set({ gstin: e.target.value.toUpperCase() })} maxLength={15} className="font-mono" /></Field>
        <Field label="FSSAI licence no."><Input value={d.fssai} onChange={(e) => set({ fssai: e.target.value })} className="font-mono" /></Field>
      </div>
      <SaveBar dirty={dirty} onSave={submit} onReset={reset} />
    </Panel>
  )
}

function Billing() {
  const { d, set, dirty, save, reset } = useDraft('billing')
  const [c, setC] = useState({ code: '', type: 'percent', value: '' })
  const addCoupon = () => { if (!c.code.trim() || !(+c.value > 0)) return; set({ coupons: [...d.coupons.filter((x) => x.code !== c.code.toUpperCase()), { code: c.code.trim().toUpperCase(), type: c.type, value: +c.value }] }); setC({ code: '', type: 'percent', value: '' }) }
  return (
    <Panel title="Billing & GST" desc="Control how invoices are numbered and how tax is calculated.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice prefix"><Input value={d.invoicePrefix} onChange={(e) => set({ invoicePrefix: e.target.value.toUpperCase() })} className="font-mono" /></Field>
        <Field label="Invoice numbering starts at" hint={`Preview: ${d.invoicePrefix}-${String(1).padStart(5, '0')}`}><Input type="number" value={d.invoiceStart} onChange={(e) => set({ invoiceStart: +e.target.value })} /></Field>
        <Field label="Default GST rate for new items"><Select value={d.defaultGst} onChange={(e) => set({ defaultGst: +e.target.value })} options={[{ value: 0, label: '0%' }, { value: 5, label: '5%' }, { value: 12, label: '12%' }, { value: 18, label: '18%' }]} /></Field>
        <Field label="Maximum discount allowed (%)" hint="Enforced on the POS discount dialog"><Input type="number" min="0" max="100" value={d.maxDiscount} onChange={(e) => set({ maxDiscount: +e.target.value })} /></Field>
      </div>
      <div className="mt-5 rounded-lg border p-4"><Toggle checked={d.inclusive} onChange={(v) => set({ inclusive: v })} label="Menu prices include GST" desc="When on, GST is extracted from the listed price instead of being added on top at billing." /></div>
      <Field label="Invoice footer message" className="mt-5"><Input value={d.footer} onChange={(e) => set({ footer: e.target.value })} /></Field>
      <h3 className="mb-2 mt-6 text-sm font-bold">Discount coupons</h3>
      <ul className="divide-y rounded-lg border">{d.coupons.map((x) => <li key={x.code} className="flex items-center gap-3 px-3.5 py-2.5 text-[13px]"><span className="rounded border border-dashed px-2 py-0.5 font-mono font-bold">{x.code}</span><span className="flex-1 text-muted-foreground">{x.type === 'percent' ? `${x.value}% off` : `${inr(x.value)} off`}</span><Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => set({ coupons: d.coupons.filter((y) => y.code !== x.code) })}><Trash2 className="size-4" /></Button></li>)}
        {d.coupons.length === 0 && <li className="py-5 text-center text-[13px] text-muted-foreground">No coupons configured.</li>}</ul>
      <div className="mt-2.5 flex flex-wrap gap-2"><Input className="w-36 font-mono uppercase" placeholder="CODE" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} /><div className="w-32"><Select value={c.type} onChange={(e) => setC({ ...c, type: e.target.value })} options={[{ value: 'percent', label: 'Percent %' }, { value: 'flat', label: 'Flat ₹' }]} /></div><Input className="w-28" type="number" placeholder="Value" value={c.value} onChange={(e) => setC({ ...c, value: e.target.value })} /><Button variant="outline" icon={Plus} onClick={addCoupon}>Add coupon</Button></div>
      <SaveBar dirty={dirty} onSave={save} onReset={reset} />
    </Panel>
  )
}

function PrinterSettings() {
  const { d, set, dirty, save, reset } = useDraft('printer')
  const toast = useToast()
  return (
    <Panel title="Printer Settings" desc="Choose where receipts and kitchen order tickets are printed.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Receipt printer"><Select value={d.receiptPrinter} onChange={(e) => set({ receiptPrinter: e.target.value })} options={['Epson TM-T82 (USB)', 'Epson TM-m30 (Bluetooth)', 'Star TSP143 (Counter LAN)', 'Browser print dialog']} /></Field>
        <Field label="KOT printer"><Select value={d.kotPrinter} onChange={(e) => set({ kotPrinter: e.target.value })} options={['Star TSP143 (Kitchen LAN)', 'Epson TM-U220 (Kitchen)', 'None — use Kitchen Display only']} /></Field>
        <Field label="Paper size"><Segmented value={d.paper} onChange={(v) => set({ paper: v })} options={['58mm', '80mm', 'A4']} size="lg" /></Field>
        <Field label="Copies per receipt"><Input type="number" min="1" max="5" value={d.copies} onChange={(e) => set({ copies: +e.target.value })} /></Field>
      </div>
      <div className="mt-5 space-y-4 rounded-lg border p-4">
        <Toggle checked={d.autoPrintReceipt} onChange={(v) => set({ autoPrintReceipt: v })} label="Auto-print receipt after payment" desc="Prints immediately when checkout completes." />
        <Toggle checked={d.autoPrintKot} onChange={(v) => set({ autoPrintKot: v })} label="Auto-print KOT when order is placed" desc="Sends a ticket to the kitchen printer." />
        <Toggle checked={d.showLogo} onChange={(v) => set({ showLogo: v })} label="Show logo on receipt" />
        <Toggle checked={d.showQr} onChange={(v) => set({ showQr: v })} label="Show QR code on receipt" desc="Used for feedback and UPI payments." />
      </div>
      <div className="mt-4 flex gap-2"><Button variant="outline" icon={Printer} onClick={() => toast('Test receipt sent', { type: 'info', desc: d.receiptPrinter })}>Print test receipt</Button><Button variant="outline" icon={Printer} onClick={() => toast('Test KOT sent', { type: 'info', desc: d.kotPrinter })}>Print test KOT</Button></div>
      <SaveBar dirty={dirty} onSave={save} onReset={reset} />
    </Panel>
  )
}

function OrderSettings() {
  const { d, set, dirty, save, reset } = useDraft('orders')
  return (
    <Panel title="Order Settings" desc="Defaults for new orders and kitchen timing.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Default order type"><Select value={d.defaultType} onChange={(e) => set({ defaultType: e.target.value })} options={[{ value: 'dine-in', label: 'Dine-in' }, { value: 'takeaway', label: 'Takeaway' }, { value: 'delivery', label: 'Delivery' }]} /></Field>
        <Field label="Average preparation time (min)" hint="Orders turn amber on the KDS after this time"><Input type="number" min="1" value={d.prepTime} onChange={(e) => set({ prepTime: +e.target.value })} /></Field>
        <Field label="Order number prefix"><Input value={d.orderPrefix} onChange={(e) => set({ orderPrefix: e.target.value.toUpperCase() })} className="font-mono" /></Field>
        <Field label="Next order number" hint={`Next order: ${d.orderPrefix}-${d.nextOrder}`}><Input type="number" value={d.nextOrder} onChange={(e) => set({ nextOrder: +e.target.value })} /></Field>
        <Field label="Kitchen delay alert (min)" hint="Orders turn red after this time"><Input type="number" min="1" value={d.kdsAlertMinutes} onChange={(e) => set({ kdsAlertMinutes: +e.target.value })} /></Field>
      </div>
      <div className="mt-5 space-y-4 rounded-lg border p-4"><Toggle checked={d.autoAccept} onChange={(v) => set({ autoAccept: v })} label="Auto-accept online orders" desc="New delivery-partner orders go straight to the kitchen." /><Toggle checked={d.soundAlerts} onChange={(v) => set({ soundAlerts: v })} label="Kitchen sound alerts" desc="Play a chime when a new order arrives." /></div>
      <SaveBar dirty={dirty} onSave={save} onReset={reset} />
    </Panel>
  )
}

function Permissions() {
  const { settings, staff, actions } = useStore()
  const nav = useNavigate()
  return (
    <div className="space-y-4">
      <Panel title="Roles & permissions" desc="Choose which modules each role can open. Changes save instantly.">
        <div className="scroll-thin -mx-5 overflow-x-auto px-5 pb-5"><table className="w-full min-w-[560px] text-[13px]"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 pr-3 font-semibold">Module</th>{ROLES.map((r) => <th key={r} className="px-2 py-2 text-center font-semibold">{r}</th>)}</tr></thead>
          <tbody>{MODULES.map((m) => <tr key={m} className="border-t"><td className="py-2.5 pr-3 font-semibold">{m}</td>{ROLES.map((r) => <td key={r} className="px-2 py-2.5 text-center"><input type="checkbox" disabled={r === 'Admin'} checked={settings.permissions[r][m]} onChange={(e) => actions.setPermission(r, m, e.target.checked)} className="size-4 accent-[var(--primary)]" /></td>)}</tr>)}</tbody></table></div>
      </Panel>
      <Panel title="Account management" desc="People with access to CafeOS.">
        <ul className="-mx-5 divide-y border-t">{staff.map((s) => <li key={s.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]"><Avatar name={s.name} size="sm" /><span className="flex-1 font-semibold">{s.name}<span className="ml-2 text-xs font-normal text-muted-foreground">{s.email}</span></span><span className="text-xs text-muted-foreground">{s.role}</span><span className={cn('size-2 rounded-full', s.active ? 'bg-primary' : 'bg-muted-foreground/40')} /></li>)}</ul>
        <div className="-mx-5 border-t bg-muted/20 px-5 py-3 text-right"><Button variant="outline" onClick={() => nav('/staff')}>Manage staff accounts</Button></div>
      </Panel>
    </div>
  )
}

function Notifications() {
  const { d, set, dirty, save, reset } = useDraft('notifications')
  const rows = [['newOrder', 'New order alerts', 'Notify when an order is placed'], ['lowStock', 'Low-stock alerts', 'Notify when an ingredient drops below minimum'], ['kitchenDelay', 'Kitchen delay alerts', 'Notify when an order exceeds the delay threshold'], ['dailySummary', 'Daily sales summary', 'A summary of yesterday at 8 AM'], ['email', 'Email notifications', 'Send alerts to the owner’s email'], ['sms', 'SMS notifications', 'Send critical alerts by SMS']]
  return (
    <Panel title="Notifications" desc="Choose which alerts CafeOS shows you.">
      <div className="space-y-4 rounded-lg border p-4">{rows.map(([k, l, ds]) => <Toggle key={k} checked={d[k]} onChange={(v) => set({ [k]: v })} label={l} desc={ds} />)}</div>
      <SaveBar dirty={dirty} onSave={save} onReset={reset} />
    </Panel>
  )
}

function System() {
  const { d, set, dirty, save, reset } = useDraft('system')
  const state = useStore()
  const toast = useToast()
  const [ask, setAsk] = useState(false)
  const exportAll = () => {
    const { menu, orders, customers, staff, inventory, expenses, settings } = state
    const blob = new Blob([JSON.stringify({ menu, orders, customers, staff, inventory, expenses, settings }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cafeos-backup.json'; a.click(); toast('Backup downloaded')
  }
  return (
    <div className="space-y-4">
      <Panel title="System Preferences" desc="Appearance, language and regional settings.">
        <Field label="Theme"><Segmented value={d.theme} onChange={(v) => { set({ theme: v }); state.actions.updateSettings('system', { theme: v }, true) }} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} size="lg" /></Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Language"><Select value={d.language} onChange={(e) => set({ language: e.target.value })} options={['English (India)', 'हिन्दी', 'मराठी', 'தமிழ்']} /></Field>
          <Field label="Timezone"><Select value={d.timezone} onChange={(e) => set({ timezone: e.target.value })} options={['Asia/Kolkata (IST)']} /></Field>
          <Field label="Currency"><Select value={d.currency} onChange={(e) => set({ currency: e.target.value })} options={['INR (₹)']} /></Field>
          <Field label="Date format"><Select value={d.dateFormat} onChange={(e) => set({ dateFormat: e.target.value })} options={['DD MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY']} /></Field>
        </div>
        <div className="mt-5 rounded-lg border p-4"><Toggle checked={d.compact} onChange={(v) => set({ compact: v })} label="Compact tables" desc="Reduce row height in data tables." /></div>
        <SaveBar dirty={dirty} onSave={save} onReset={reset} />
      </Panel>
      <Panel title="Data & demo" desc="Everything is stored in this browser. Nothing leaves your device.">
        <div className="mb-5 flex flex-wrap gap-2"><Button variant="outline" icon={Download} onClick={exportAll}>Export backup (JSON)</Button><Button variant="danger-soft" icon={RotateCcw} onClick={() => setAsk(true)}>Reset demo data</Button></div>
      </Panel>
      <ConfirmDialog open={ask} onClose={() => setAsk(false)} title="Reset all demo data?" message="Orders, customers, inventory, expenses and settings will return to their original sample values." confirmLabel="Reset everything" onConfirm={state.actions.resetDemo} />
    </div>
  )
}

const VIEWS = { business: Business, billing: Billing, printer: PrinterSettings, orders: OrderSettings, permissions: Permissions, notifications: Notifications, system: System }

export default function Settings() {
  const [sec, setSec] = useState(() => { try { return localStorage.getItem('cafeos-settings-tab') || 'business' } catch { return 'business' } })
  useEffect(() => { try { localStorage.setItem('cafeos-settings-tab', sec) } catch { /* ignore */ } }, [sec])
  const View = VIEWS[sec] || Business
  return (
    <>
      <PageHeader title="Settings" description="Configure The Coffee House — billing, printers, orders and access." />
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setSec(s.id)} className={cn('flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition lg:w-full', sec === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60')}>
              <s.icon className="size-[18px] shrink-0" /><span><span className="block text-[13.5px] font-bold">{s.label}</span><span className="hidden text-xs font-normal text-muted-foreground lg:block">{s.desc}</span></span>
            </button>
          ))}
        </nav>
        <div className="min-w-0 max-w-3xl"><View /></div>
      </div>
    </>
  )
}
