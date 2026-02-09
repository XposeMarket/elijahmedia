'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Check, X, Loader2 } from 'lucide-react'

interface BookingActionsProps {
  bookingId: string
}

export function BookingActions({ bookingId }: BookingActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'deny' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleAction(action: 'approve' | 'deny') {
    setLoading(action)
    setError(null)

    try {
      // Update the booking status
      const { error: updateError } = await supabase
        .from('photographer_bookings')
        .update({ 
          approval_status: action === 'approve' ? 'approved' : 'denied',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // TODO: Send notification email to client
      // This would call an API route that uses Resend

      router.refresh()
    } catch (err) {
      console.error('Error updating booking:', err)
      setError('Failed to update booking')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction('approve')}
          disabled={loading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'approve' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Approve
        </button>
        <button
          onClick={() => handleAction('deny')}
          disabled={loading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'deny' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
          Deny
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
