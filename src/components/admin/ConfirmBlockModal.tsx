"use client"

import React from 'react'
import { format } from 'date-fns'

interface Props {
  open: boolean
  date: string
  title?: string
  message?: string
  confirmLabel?: string
  confirmClassName?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmBlockModal({
  open,
  date,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  confirmClassName = 'bg-red-600 text-white',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="bg-neutral-900 rounded-xl p-6 z-10 w-full max-w-md">
        <h4 className="text-lg font-semibold mb-2">{title}</h4>
        <p className="text-sm text-neutral-400 mb-4">{message ?? (date ? format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy') : date)}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 bg-neutral-800 rounded">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded ${confirmClassName}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
