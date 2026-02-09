'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const date = searchParams.get('date')
  const time = searchParams.get('time')

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'your selected date'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Format time for display
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    try {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return timeStr
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold mb-4">Booking Request Sent!</h1>
        
        <p className="text-neutral-400 mb-6">
          Your booking request for{' '}
          <span className="text-white font-medium">{formatDate(date)}</span>
          {time && (
            <>
              {' '}at <span className="text-white font-medium">{formatTime(time)}</span>
            </>
          )}{' '}
          has been submitted.
        </p>

        {/* What's Next */}
        <div className="bg-neutral-900 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold mb-4">What happens next?</h2>
          <ul className="space-y-3 text-neutral-400">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                1
              </span>
              <span>You&apos;ll receive a confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-neutral-800 text-neutral-400 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                2
              </span>
              <span>Your request will be reviewed within 24-48 hours</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-neutral-800 text-neutral-400 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                3
              </span>
              <span>Once approved, you&apos;ll get a final confirmation with all the details</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/gallery"
            className="block w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Browse Gallery
          </Link>
        </div>

        {/* Contact Note */}
        <p className="text-neutral-500 text-sm mt-8">
          Have questions? Feel free to reach out at{' '}
          <a href="mailto:hello@elijahmedia.com" className="text-green-500 hover:underline">
            hello@elijahmedia.com
          </a>
        </p>
      </div>
    </main>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Booking Request Sent!</h1>
          <p className="text-neutral-400">Loading details...</p>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}
