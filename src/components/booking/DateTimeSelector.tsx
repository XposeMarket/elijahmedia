'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateEndTime, getAvailableTimeSlots, type Booking, type CalendarDay } from '@/lib/calendar-utils'
import { formatTime } from '@/lib/utils'

interface DateTimeSelectorProps {
  selectedDate: string
  selectedTime: string
  bookingType: 'personal' | 'event'
  numPeople: number
  onDateChange: (date: string) => void
  onTimeChange: (startTime: string, endTime: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function DateTimeSelector({
  selectedDate,
  selectedTime,
  bookingType,
  numPeople,
  onDateChange,
  onTimeChange,
}: DateTimeSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDay>>({})
  const [bookingsData, setBookingsData] = useState<Booking[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  // Fetch calendar data for the current month
  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true)
    try {
      const monthStr = format(currentMonth, 'yyyy-MM')
      const response = await fetch(`/api/calendar?month=${monthStr}`)
      if (response.ok) {
        const data = await response.json()
        setCalendarData(data.dates || {})
        setBookingsData(data.bookings || [])
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  // Listen for external calendar updates (admin changes) and re-fetch
  useEffect(() => {
    const handler = () => fetchCalendarData()
    window.addEventListener('calendar:updated', handler)
    return () => window.removeEventListener('calendar:updated', handler)
  }, [fetchCalendarData])

  // When date changes, fetch available time slots
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([])
      return
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true)
      try {
        // Get bookings for the selected date
        const dateBookings = bookingsData.filter(b => b.booking_date === selectedDate)
        const calendarDay = calendarData[selectedDate]
        
        const slots = getAvailableTimeSlots(selectedDate, dateBookings, calendarDay)
        setAvailableSlots(slots)
      } catch (error) {
        console.error('Failed to fetch slots:', error)
        setAvailableSlots([])
      } finally {
        setIsLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [selectedDate, bookingsData, calendarData])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Pad the start of the month to align with weekdays
  const firstDayOfMonth = startOfMonth(currentMonth).getDay()
  const paddedDays = [...Array(firstDayOfMonth).fill(null), ...days]

  const getDayStatus = (date: Date): 'available' | 'off' | 'booked' | 'past' => {
    const dateStr = format(date, 'yyyy-MM-dd')
    // Past dates
    if (isBefore(date, startOfDay(new Date()))) {
      return 'past'
    }
    // Check calendar status
    const calendarDay = calendarData[dateStr]
    if (calendarDay?.day_status === 'off') {
      return 'off'
    }
    // Only count approved bookings for blocking
    const dateBookings = bookingsData.filter(
      b => b.booking_date === dateStr && b.approval_status === 'approved'
    )
    if (dateBookings.length >= 3) {
      return 'booked'
    }
    if (calendarDay?.day_status === 'no_more_bookings' && dateBookings.length > 0) {
      return 'booked'
    }
    return 'available'
  }

  const handleDateClick = (date: Date) => {
    const status = getDayStatus(date)
    if (status === 'available') {
      onDateChange(format(date, 'yyyy-MM-dd'))
      onTimeChange('', '') // Reset time when date changes
    }
  }

  const handleTimeClick = (time: string) => {
    const endTime = calculateEndTime(time, bookingType, numPeople)
    onTimeChange(time, endTime)
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-neutral-800 rounded-xl p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-xs text-neutral-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const dateStr = format(day, 'yyyy-MM-dd')
              const status = getDayStatus(day)
              const isSelected = selectedDate === dateStr
              const isCurrentMonth = isSameMonth(day, currentMonth)

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={status !== 'available'}
                  className={cn(
                    "aspect-square rounded-lg text-sm font-medium transition-all",
                    !isCurrentMonth && "opacity-30",
                    status === 'available' && "hover:bg-neutral-700 cursor-pointer",
                    status === 'available' && !isSelected && "bg-green-500/20 text-green-400",
                    status === 'off' && "bg-red-500/20 text-red-400 cursor-not-allowed",
                    status === 'booked' && "bg-orange-500/20 text-orange-400 cursor-not-allowed",
                    status === 'past' && "text-neutral-600 cursor-not-allowed",
                    isSelected && "bg-white text-black ring-2 ring-white",
                    isToday(day) && !isSelected && "ring-1 ring-neutral-600"
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-700 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/20" />
            <span className="text-neutral-400">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/20" />
            <span className="text-neutral-400">Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/20" />
            <span className="text-neutral-400">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="bg-neutral-800 rounded-xl p-4">
          <h4 className="font-medium mb-3">
            Available Times for {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
          </h4>
          
          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-neutral-500 text-sm py-4">
              No available time slots for this date. Please select another date.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map(slot => {
                const endTime = calculateEndTime(slot, bookingType, numPeople)
                const isSelected = selectedTime === slot
                
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleTimeClick(slot)}
                    className={cn(
                      "py-3 px-4 rounded-lg text-sm font-medium transition-all",
                      isSelected
                        ? "bg-white text-black"
                        : "bg-neutral-700 hover:bg-neutral-600 text-white"
                    )}
                  >
                    {formatTime(slot)}
                  </button>
                )
              })}
            </div>
          )}

          {/* Selected Time Info */}
          {selectedTime && (
            <div className="mt-4 pt-4 border-t border-neutral-700">
              <p className="text-sm text-neutral-400">
                <span className="text-white font-medium">Selected:</span>{' '}
                {formatTime(selectedTime)} - {formatTime(calculateEndTime(selectedTime, bookingType, numPeople))}
                <span className="text-neutral-500">
                  {' '}(~{bookingType === 'event' ? (numPeople > 5 ? '4' : '3') : '2'} hours)
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
