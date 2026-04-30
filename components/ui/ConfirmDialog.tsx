'use client'

import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = false
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-zinc-300 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="ghost-btn text-sm">Cancelar</button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            danger
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'gold-btn'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
