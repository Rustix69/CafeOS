import { BookOpen, Headphones, Keyboard, Mail, MessageCircle, Phone } from 'lucide-react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { useToast } from '../common/Toast.jsx'

const KEYS = [['Ctrl / ⌘ + K', 'Focus global search'], ['Enter (POS search)', 'Add first matching item'], ['Esc', 'Close dialogs and drawers']]

export default function HelpModal({ open, onClose }) {
  const toast = useToast()
  const row = (Icon, t, d, a) => (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span>
      <div className="flex-1"><p className="text-sm font-bold">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div>
      <Button variant="outline" size="sm" onClick={() => toast(a, { type: 'info' })}>Open</Button>
    </div>
  )
  return (
    <Modal open={open} onClose={onClose} title="Help & Support" description="We're here 7 days a week, 8 AM – 11 PM IST.">
      <div className="space-y-2.5">
        {row(MessageCircle, 'Live chat', 'Average reply in under 2 minutes', 'Connecting you to support…')}
        {row(Phone, 'Call support', '+91 1800 123 4567 (toll-free)', 'Dialer opened (demo)')}
        {row(Mail, 'Email', 'support@cafeos.app', 'Compose window opened (demo)')}
        {row(BookOpen, 'Knowledge base', 'Guides for billing, GST and printers', 'Opening help centre (demo)')}
        {row(Headphones, 'Book onboarding call', 'Free 30-minute setup session', 'Slot request sent (demo)')}
      </div>
      <h3 className="mb-2 mt-5 flex items-center gap-2 text-sm font-bold"><Keyboard className="size-4" />Keyboard shortcuts</h3>
      <ul className="divide-y rounded-lg border text-[13px]">
        {KEYS.map(([k, d]) => <li key={k} className="flex items-center justify-between px-3 py-2"><span className="text-muted-foreground">{d}</span><kbd className="rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-xs">{k}</kbd></li>)}
      </ul>
    </Modal>
  )
}
