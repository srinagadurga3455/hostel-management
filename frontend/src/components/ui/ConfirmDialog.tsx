import { Button } from './Button'
import { Modal } from './Modal'
export function ConfirmDialog({ open, onClose, onConfirm, title, desc }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; desc?: string }) {
  return <Modal open={open} onClose={onClose} title={title}><p className="text-sm text-slate-600">{desc}</p><div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><Button onClick={onConfirm}>Confirm</Button></div></Modal>
}
