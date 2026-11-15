import { TriangleAlert } from 'lucide-react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'danger', children }) {
  return (
    <Modal open={open} onClose={onClose} size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Keep it</Button>
        <Button variant={tone} onClick={() => { onConfirm?.(); onClose?.() }}>{confirmLabel}</Button>
      </>}>
      <div className="flex gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive"><TriangleAlert className="size-5" /></div>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          {children}
        </div>
      </div>
    </Modal>
  )
}
