import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDenialEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse(renderErrorPage('Missing denial token'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const supabase = createAdminClient()

  // Find the booking with this token
  const { data: booking, error } = await supabase
    .from('photographer_bookings')
    .select('*')
    .eq('approval_token', token)
    .single()

  if (error || !booking) {
    return new NextResponse(renderErrorPage('Invalid or expired denial link'), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Check if already processed
  if (booking.approval_status !== 'pending') {
    return new NextResponse(
      renderInfoPage(
        'Already Processed',
        `This booking has already been ${booking.approval_status}.`
      ),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // Check if expired
  if (booking.approval_expires_at && new Date(booking.approval_expires_at) < new Date()) {
    return new NextResponse(renderErrorPage('This link has expired'), {
      status: 410,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Deny the booking
  const { error: updateError } = await supabase
    .from('photographer_bookings')
    .update({
      approval_status: 'denied',
      approval_token: null, // Invalidate token after use
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id)

  if (updateError) {
    console.error('Error denying booking:', updateError)
    return new NextResponse(renderErrorPage('Failed to deny booking'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Remove the calendar hold for this booking
  // First check if there are other bookings on this date
  const { data: otherBookings } = await supabase
    .from('photographer_bookings')
    .select('id')
    .eq('org_id', booking.org_id)
    .eq('booking_date', booking.booking_date)
    .neq('id', booking.id)
    .in('approval_status', ['pending', 'approved'])

  // If no other bookings, we can update the calendar entry
  if (!otherBookings || otherBookings.length === 0) {
    await supabase
      .from('photographer_calendar')
      .update({
        notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', booking.org_id)
      .eq('date', booking.booking_date)
  }

  // Update Cadence deal to lost if exists
  if (booking.cadence_deal_id) {
    try {
      // Get the pipeline for this deal
      const { data: deal } = await supabase
        .from('deals')
        .select('pipeline_id')
        .eq('id', booking.cadence_deal_id)
        .single()

      if (deal) {
        // Find the "lost" stage for this pipeline
        const { data: lostStage } = await supabase
          .from('pipeline_stages')
          .select('id')
          .eq('pipeline_id', deal.pipeline_id)
          .eq('is_lost', true)
          .limit(1)
          .single()

        if (lostStage) {
          await supabase
            .from('deals')
            .update({ 
              stage_id: lostStage.id,
              status: 'lost',
              closed_at: new Date().toISOString(),
              metadata: {
                close_reason: 'Declined from portfolio site',
              },
            })
            .eq('id', booking.cadence_deal_id)
        }
      }
    } catch (cadenceError) {
      console.error('Error updating Cadence deal:', cadenceError)
    }
  }

  // Send denial email to client
  try {
    if (booking.client_email) {
      await sendDenialEmail({
        to: booking.client_email,
        clientName: booking.client_name,
        bookingDate: booking.booking_date,
      })
    }
  } catch (emailError) {
    console.error('Error sending denial email:', emailError)
  }

  return new NextResponse(
    renderSuccessPage(
      'Booking Declined',
      `You've declined ${booking.client_name}'s booking request.`,
      'The client has been notified via email.'
    ),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}

function renderSuccessPage(title: string, message: string, subtext: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Elijah Media</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 500px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #f59e0b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 12px;
    }
    p {
      color: #a3a3a3;
      margin: 0 0 8px;
    }
    .subtext {
      font-size: 14px;
      color: #737373;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <p class="subtext">${subtext}</p>
  </div>
</body>
</html>
  `
}

function renderErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error | Elijah Media</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 500px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 12px;
    }
    p {
      color: #a3a3a3;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 40px; height: 40px; color: white;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h1>Error</h1>
    <p>${message}</p>
  </div>
</body>
</html>
  `
}

function renderInfoPage(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Elijah Media</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 500px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 12px;
    }
    p {
      color: #a3a3a3;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 40px; height: 40px; color: white;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>
  `
}
