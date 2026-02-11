"use client"

import { useState, useEffect } from 'react'
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isBefore, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmBlockModal from './ConfirmBlockModal'

export default function AvailabilityModal() {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [pendingStatus, setPendingStatus] = useState<'off' | 'available'>('off')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)

  const fetchCalendar = async () => {
    setIsLoading(true)
    try {
      const monthStr = format(currentMonth, 'yyyy-MM')
      const res = await fetch(`/api/calendar?month=${monthStr}`)
      if (res.ok) {
        const data = await res.json()
        setCalendarData(data.dates || {})
      }
    } catch (err) {
      console.error('Failed fetch calendar in admin modal', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchCalendar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentMonth])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOfMonth = startOfMonth(currentMonth).getDay()
  const paddedDays = [...Array(firstDayOfMonth).fill(null), ...days]

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const day = calendarData[dateStr]
    // If day is currently 'off', confirm to make it available
    if (day?.day_status === 'off') {
      setPendingStatus('available')
      setSelectedDate(dateStr)
      setConfirmOpen(true)
      return
    }

    // Otherwise, confirm blocking the day
    setPendingStatus('off')
    setSelectedDate(dateStr)
    setConfirmOpen(true)
  }

  const handleConfirm = async (date: string) => {
    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, day_status: pendingStatus })
      })

      // Try to parse body for debugging
      let bodyText = ''
      try {
        bodyText = await res.text()
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        console.error('Admin calendar API error', res.status, bodyText)
        // Show a simple alert so admin sees the failure
        try {
          const json = JSON.parse(bodyText || '{}')
          alert(json.error || 'Failed to block date')
        } catch {
          alert(bodyText || 'Failed to block date')
        }
        setConfirmOpen(false)
        return
      }

      // refresh local calendar
      await fetchCalendar()
      // notify other components
      window.dispatchEvent(new CustomEvent('calendar:updated'))
      setConfirmOpen(false)
    } catch (err) {
      console.error('Failed to block date', err)
      alert('Unexpected error blocking date')
      setConfirmOpen(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
      >
        Availability
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="bg-neutral-900 rounded-xl p-6 relative w-full max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Availability</h3>
              <button className="text-neutral-400" onClick={() => setOpen(false)}>Close</button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 hover:bg-neutral-800 rounded">
                <ChevronLeft />
              </button>
              <div className="font-medium">{format(currentMonth, 'MMMM yyyy')}</div>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-neutral-800 rounded">
                <ChevronRight />
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {paddedDays.map((day, idx) => {
                  if (!day) return <div key={`e-${idx}`} className="aspect-square" />
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayData = calendarData[dateStr]
                  const status = dayData?.day_status || 'available'
                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        'aspect-square rounded-lg text-sm font-medium transition-transform transform',
                        status === 'available' && 'bg-green-500/20 text-green-300 cursor-pointer hover:-translate-y-1 hover:scale-105 hover:bg-green-500/30',
                        status === 'booked' && 'bg-orange-500/20 text-orange-300 cursor-not-allowed',
                        status === 'off' && 'bg-red-500/20 text-red-300 cursor-not-allowed'
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmBlockModal
        open={confirmOpen}
        date={selectedDate}
        title={pendingStatus === 'off' ? 'Block Availability' : 'Make Available'}
        message={pendingStatus === 'off' ? `Block availability for ${selectedDate}?` : `Make ${selectedDate} available for bookings?`}
        confirmLabel={pendingStatus === 'off' ? 'Block' : 'Make Available'}
        confirmClassName={pendingStatus === 'off' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => handleConfirm(selectedDate)}
      />
    </div>
  )
}
