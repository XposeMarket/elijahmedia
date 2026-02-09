import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/calendar?month=2024-01
// Returns calendar data for the given month including day statuses and bookings
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month') // Format: YYYY-MM
  
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json(
      { error: 'Invalid month parameter. Use format: YYYY-MM' },
      { status: 400 }
    )
  }
  
  const [year, month] = monthParam.split('-').map(Number)
  
  // Calculate first and last day of month
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  
  const startDate = firstDay.toISOString().split('T')[0]
  const endDate = lastDay.toISOString().split('T')[0]
  
  const supabase = await createClient()
  
  // Get photographer's org_id from settings or use default
  // For now, we'll use a fixed org_id for the photographer
  const orgId = process.env.PHOTOGRAPHER_ORG_ID || 'default-org'
  
  // Fetch calendar settings for the month
  const { data: calendarDays, error: calendarError } = await supabase
    .from('photographer_calendar')
    .select('*')
    .eq('org_id', orgId)
    .gte('date', startDate)
    .lte('date', endDate)
  
  if (calendarError) {
    console.error('Error fetching calendar:', calendarError)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
  
  // Fetch bookings for the month
  const { data: bookings, error: bookingsError } = await supabase
    .from('photographer_bookings')
    .select('id, booking_date, start_time, end_time, approval_status, booking_type')
    .eq('org_id', orgId)
    .gte('booking_date', startDate)
    .lte('booking_date', endDate)
    .in('approval_status', ['pending', 'approved'])
  
  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    return NextResponse.json(
      { error: 'Failed to fetch bookings data' },
      { status: 500 }
    )
  }
  
  // Build calendar data with day statuses
  const calendarData: Record<string, {
    status: 'available' | 'booked' | 'off'
    bookingsCount: number
    timeSlots: { startTime: string; endTime: string }[]
  }> = {}
  
  // Initialize all days as available
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    calendarData[dateStr] = {
      status: 'available',
      bookingsCount: 0,
      timeSlots: [],
    }
  }
  
  // Apply calendar day settings (off days)
  if (calendarDays) {
    for (const day of calendarDays) {
      if (calendarData[day.date]) {
        calendarData[day.date].status = day.day_status as 'available' | 'booked' | 'off'
      }
    }
  }
  
  // Apply booking counts
  if (bookings) {
    for (const booking of bookings) {
      if (calendarData[booking.booking_date]) {
        calendarData[booking.booking_date].bookingsCount++
        calendarData[booking.booking_date].timeSlots.push({
          startTime: booking.start_time,
          endTime: booking.end_time,
        })
        
        // If 2 or more bookings, mark as booked (max 2 per day)
        if (calendarData[booking.booking_date].bookingsCount >= 2) {
          calendarData[booking.booking_date].status = 'booked'
        }
      }
    }
  }
  
  return NextResponse.json({
    month: monthParam,
    startDate,
    endDate,
    days: calendarData,
  })
}
