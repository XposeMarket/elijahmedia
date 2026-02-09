import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendApprovalConfirmationEmail, sendApprovalConfirmationToPhotographer } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse(renderErrorPage('Missing approval token'), {
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
    return new NextResponse(renderErrorPage('Invalid or expired approval link'), {
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
    return new NextResponse(renderErrorPage('This approval link has expired'), {
      status: 410,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Approve the booking
  const { error: updateError } = await supabase
    .from('photographer_bookings')
    .update({
      approval_status: 'approved',
      approval_token: null, // Invalidate token after use
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id)

  if (updateError) {
    console.error('Error approving booking:', updateError)
    return new NextResponse(renderErrorPage('Failed to approve booking'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Update calendar to mark date as booked (finalize)
  await supabase
    .from('photographer_calendar')
    .upsert({
      org_id: booking.org_id,
      date: booking.booking_date,
      day_status: 'available', // Still available for more bookings until max reached
      notes: `Confirmed booking: ${booking.client_name}`,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'org_id,date'
    })

  // Update Cadence deal to approved/won stage if exists
  if (booking.cadence_deal_id) {
    try {
      // Get the pipeline for this deal
      const { data: deal } = await supabase
        .from('deals')
        .select('pipeline_id')
        .eq('id', booking.cadence_deal_id)
        .single()

      if (deal) {
        // Find the "won" stage for this pipeline
        const { data: wonStage } = await supabase
          .from('pipeline_stages')
          .select('id')
          .eq('pipeline_id', deal.pipeline_id)
          .eq('is_won', true)
          .limit(1)
          .single()

        if (wonStage) {
          await supabase
            .from('deals')
            .update({ 
              stage_id: wonStage.id,
              status: 'won',
              closed_at: new Date().toISOString(),
            })
            .eq('id', booking.cadence_deal_id)
        }
      }
    } catch (cadenceError) {
      console.error('Error updating Cadence deal:', cadenceError)
    }
  }

  // Send confirmation emails
  try {
    // Email to client
    if (booking.client_email) {
      await sendApprovalConfirmationEmail({
        to: booking.client_email,
        clientName: booking.client_name,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
      })
    }

    // Email to photographer
    const photographerEmail = process.env.PHOTOGRAPHER_EMAIL
    if (photographerEmail) {
      await sendApprovalConfirmationToPhotographer({
        to: photographerEmail,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        clientPhone: booking.client_phone,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        bookingType: booking.booking_type,
      })
    }
  } catch (emailError) {
    console.error('Error sending confirmation emails:', emailError)
  }

  return new NextResponse(
    renderSuccessPage(
      'Booking Approved!',
      `You've approved ${booking.client_name}'s booking for ${booking.booking_date}.`,
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
      background: #22c55e;
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
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
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
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
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
