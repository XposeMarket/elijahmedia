import { addHours, isBefore, isAfter, parseISO, format } from 'date-fns'

export interface Booking {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  approval_status: 'pending' | 'approved' | 'denied'
}

export interface CalendarDay {
  date: string
  day_status: 'available' | 'off' | 'no_more_bookings' | 'booked'
  notes?: string
}

export interface AvailabilityResult {
  available: boolean
  reason?: string
  conflicts: Booking[]
}

// Business rules
const MAX_SHOOTS_PER_DAY = 3
const MIN_HOURS_BETWEEN_SHOOTS = 3
const DEFAULT_SHOOT_DURATION_HOURS = 2

/**
 * Parse time string "HH:MM" to Date object for comparison
 */
function parseTime(dateStr: string, timeStr: string): Date {
  // Accept time strings in either "HH:MM" or "HH:MM:SS" formats
  let time = timeStr
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    time = `${timeStr}:00`
  } else if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    time = timeStr
  } else {
    // Fallback: strip fractional seconds or unexpected parts
    const match = timeStr.match(/^(\d{2}:\d{2})(:?\d{2})?/) 
    time = match ? (match[2] ? `${match[1]}:${match[2].replace(':','')}` : `${match[1]}:00`) : '00:00:00'
  }

  return parseISO(`${dateStr}T${time}`)
}

/**
 * Check if a new booking overlaps with existing bookings
 */
export function checkTimeConflicts(
  date: string,
  startTime: string,
  endTime: string,
  existingBookings: Booking[]
): { hasConflict: boolean; conflicts: Booking[]; reason?: string } {
  const newStart = parseTime(date, startTime)
  const newEnd = parseTime(date, endTime)
  
  const conflicts: Booking[] = []
  
  for (const booking of existingBookings) {
    // Only consider approved bookings for blocking
    if (booking.approval_status !== 'approved') continue
    
    const existingStart = parseTime(booking.booking_date, booking.start_time)
    const existingEnd = parseTime(booking.booking_date, booking.end_time)
    
    // Check for overlap
    if (isBefore(newStart, existingEnd) && isAfter(newEnd, existingStart)) {
      conflicts.push(booking)
      continue
    }
    
    // Check MIN_HOURS_BETWEEN_SHOOTS spacing rule (both before and after existing booking)
    const existingEndPlusBuffer = addHours(existingEnd, MIN_HOURS_BETWEEN_SHOOTS)
    const existingStartMinusBuffer = addHours(existingStart, -MIN_HOURS_BETWEEN_SHOOTS)

    // If new booking starts within buffer after existing booking ends
    if (isBefore(newStart, existingEndPlusBuffer) && isAfter(newStart, existingEnd)) {
      conflicts.push(booking)
      continue
    }

    // If new booking ends within buffer before existing booking starts
    if (isAfter(newEnd, existingStartMinusBuffer) && isBefore(newEnd, existingStart)) {
      conflicts.push(booking)
      continue
    }
  }
  
  if (conflicts.length > 0) {
    return {
      hasConflict: true,
      conflicts,
      reason: `Booking conflicts with existing shoots. Minimum ${MIN_HOURS_BETWEEN_SHOOTS} hours required between bookings.`
    }
  }
  
  return { hasConflict: false, conflicts: [] }
}

/**
 * Check if a date has reached max bookings
 */
export function isDateFullyBooked(existingBookings: Booking[]): boolean {
  const approvedBookings = existingBookings.filter(b => b.approval_status === 'approved')
  return approvedBookings.length >= MAX_SHOOTS_PER_DAY
}

/**
 * Get available time slots for a date
 */
export function getAvailableTimeSlots(
  date: string,
  existingBookings: Booking[],
  calendarDay?: CalendarDay
): string[] {
  // If day is off, no slots available
  if (calendarDay?.day_status === 'off') {
    return []
  }
  
  // If day is marked as no more bookings and has approved bookings, no slots
  if (calendarDay?.day_status === 'no_more_bookings' && existingBookings.some(b => b.approval_status === 'approved')) {
    return []
  }
  
  // If already at max bookings
  if (isDateFullyBooked(existingBookings)) {
    return []
  }
  
  // Generate all possible time slots (9 AM to 6 PM, hourly)
  const allSlots = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]
  
  // Filter out slots that would conflict
  return allSlots.filter(slot => {
    const endTime = format(addHours(parseTime(date, slot), DEFAULT_SHOOT_DURATION_HOURS), 'HH:mm')
    const { hasConflict } = checkTimeConflicts(date, slot, endTime, existingBookings)
    return !hasConflict
  })
}

/**
 * Calculate end time based on start time and booking type
 */
export function calculateEndTime(startTime: string, bookingType: 'personal' | 'event', numPeople?: number): string {
  let durationHours = DEFAULT_SHOOT_DURATION_HOURS
  
  if (bookingType === 'event') {
    // Events take longer, especially with more people
    durationHours = numPeople && numPeople > 5 ? 4 : 3
  }
  
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + durationHours
  
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Full availability check for a booking request
 */
export async function checkAvailability(
  date: string,
  startTime: string,
  endTime: string,
  existingBookings: Booking[],
  calendarDay?: CalendarDay
): Promise<AvailabilityResult> {
  // Check if day is off
  if (calendarDay?.day_status === 'off') {
    return {
      available: false,
      reason: 'This date is unavailable for bookings.',
      conflicts: []
    }
  }
  
  // Check if day is marked no more bookings
  if (calendarDay?.day_status === 'no_more_bookings') {
    const activeBookings = existingBookings.filter(b => b.approval_status === 'approved')
    if (activeBookings.length > 0) {
      return {
        available: false,
        reason: 'No more bookings are being accepted for this date.',
        conflicts: []
      }
    }
  }
  
  // Check max bookings per day
  if (isDateFullyBooked(existingBookings)) {
    return {
      available: false,
      reason: `Maximum of ${MAX_SHOOTS_PER_DAY} shoots per day reached.`,
      conflicts: []
    }
  }
  
  // Check time conflicts
  const { hasConflict, conflicts, reason } = checkTimeConflicts(date, startTime, endTime, existingBookings)
  
  if (hasConflict) {
    return {
      available: false,
      reason,
      conflicts
    }
  }
  
  return {
    available: true,
    conflicts: []
  }
}
