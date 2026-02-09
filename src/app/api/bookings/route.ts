import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAvailability } from '@/lib/calendar-utils'
import { generateApprovalToken } from '@/lib/utils'
import { addDays } from 'date-fns'
import { sendApprovalEmail, sendBookingConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      client_name,
      client_email,
      client_phone,
      booking_type,
      num_people,
      booking_date,
      start_time,
      end_time,
      location_type,
      location_manual,
      special_requests,
    } = body

    // Validate required fields
    if (!client_name || !client_email || !booking_date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const orgId = process.env.PHOTOGRAPHER_ORG_ID

    if (!orgId) {
      return NextResponse.json(
        { error: 'Server configuration error: PHOTOGRAPHER_ORG_ID not set' },
        { status: 500 }
      )
    }

    // Fetch existing bookings for the date
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('photographer_bookings')
      .select('*')
      .eq('org_id', orgId)
      .eq('booking_date', booking_date)
      .neq('approval_status', 'denied')

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      )
    }

    // Fetch calendar day status
    const { data: calendarDay } = await supabase
      .from('photographer_calendar')
      .select('*')
      .eq('org_id', orgId)
      .eq('date', booking_date)
      .single()

    // Check availability
    const availability = await checkAvailability(
      booking_date,
      start_time,
      end_time,
      existingBookings || [],
      calendarDay || undefined
    )

    if (!availability.available) {
      return NextResponse.json(
        { error: availability.reason || 'Time slot not available' },
        { status: 400 }
      )
    }

    // Generate approval token
    const approvalToken = generateApprovalToken()
    const approvalExpiresAt = addDays(new Date(), 7).toISOString()

    // Create the booking record
    const { data: booking, error: insertError } = await supabase
      .from('photographer_bookings')
      .insert({
        org_id: orgId,
        client_name,
        client_email,
        client_phone: client_phone || null,
        booking_type,
        num_people: booking_type === 'event' ? num_people : null,
        booking_date,
        start_time,
        end_time,
        location_type,
        location: location_type === 'provided' ? location_manual : null,
        special_requests: special_requests || null,
        approval_token: approvalToken,
        approval_status: 'pending',
        approval_expires_at: approvalExpiresAt,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating booking:', insertError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Mark the calendar date as tentatively booked
    await supabase
      .from('photographer_calendar')
      .upsert({
        org_id: orgId,
        date: booking_date,
        day_status: 'available', // Keep as available since it's just tentative
        notes: `Pending booking from ${client_name}`,
      }, {
        onConflict: 'org_id,date'
      })

    // Create or find contact in Cadence
    let cadenceContactId: string | null = null
    let cadenceDealId: string | null = null

    try {
      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('org_id', orgId)
        .eq('email', client_email)
        .single()

      if (existingContact) {
        cadenceContactId = existingContact.id
      } else {
        // Create new contact in Cadence
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            org_id: orgId,
            name: client_name,
            email: client_email,
            phone: client_phone || null,
            source: 'Portfolio Website',
          })
          .select('id')
          .single()

        if (contactError) {
          console.error('Error creating contact:', contactError)
        } else if (newContact) {
          cadenceContactId = newContact.id
        }
      }

      // Get the first pipeline and its first stage for this org
      const { data: pipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .select('id')
        .eq('org_id', orgId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (pipelineError) {
        console.error('Error fetching pipeline:', pipelineError)
      }

      if (pipeline) {
        const { data: stage, error: stageError } = await supabase
          .from('pipeline_stages')
          .select('id')
          .eq('pipeline_id', pipeline.id)
          .order('position', { ascending: true })
          .limit(1)
          .single()

        if (stageError) {
          console.error('Error fetching stage:', stageError)
        }

        if (stage) {
          // Create the deal in Cadence with full booking info
          const dealAmount = booking_type === 'event' ? (num_people || 1) * 150 : 200
          
          const { data: newDeal, error: dealError } = await supabase
            .from('deals')
            .insert({
              org_id: orgId,
              pipeline_id: pipeline.id,
              stage_id: stage.id,
              contact_id: cadenceContactId,
              name: `${booking_type === 'event' ? 'Event' : 'Portrait'} Session - ${client_name}`,
              description: `Booking Request from Portfolio Website

📅 Date: ${booking_date}
⏰ Time: ${start_time} - ${end_time}
📍 Location: ${location_type === 'provided' ? location_manual : 'Flexible / TBD'}
👥 Type: ${booking_type === 'event' ? `Event (${num_people || 1} people)` : 'Personal/Portrait'}

📧 Email: ${client_email}
📱 Phone: ${client_phone || 'Not provided'}

📝 Special Requests:
${special_requests || 'None'}`,
              amount: dealAmount,
              status: 'open',
              probability: 50,
              close_date: booking_date,
              custom_data: JSON.stringify({
                booking_id: booking.id,
                booking_type,
                num_people: num_people || 1,
                location_type,
                location: location_type === 'provided' ? location_manual : null,
                start_time,
                end_time,
                special_requests,
              }),
              metadata: JSON.stringify({
                source: 'elijah_media_portfolio',
                booking_id: booking.id,
              }),
            })
            .select('id')
            .single()

          if (!dealError && newDeal) {
            cadenceDealId = newDeal.id
          }
        }
      }

      // Update booking with Cadence IDs
      await supabase
        .from('photographer_bookings')
        .update({ 
          cadence_contact_id: cadenceContactId,
          cadence_deal_id: cadenceDealId,
          deal_id: cadenceDealId || `portfolio-${booking.id}`,
        })
        .eq('id', booking.id)

    } catch (cadenceError) {
      console.error('Error syncing to Cadence:', cadenceError)
      // Don't fail the booking if Cadence sync fails
    }

    // Send emails
    try {
      // Send confirmation email to client
      await sendBookingConfirmationEmail({
        to: client_email,
        clientName: client_name,
        bookingDate: booking_date,
        startTime: start_time,
        endTime: end_time,
      })

      // Send approval email to photographer
      const photographerEmail = process.env.PHOTOGRAPHER_EMAIL
      if (photographerEmail) {
        await sendApprovalEmail({
          to: photographerEmail,
          clientName: client_name,
          clientEmail: client_email,
          clientPhone: client_phone,
          bookingDate: booking_date,
          startTime: start_time,
          endTime: end_time,
          bookingType: booking_type,
          numPeople: num_people,
          location: location_type === 'provided' ? location_manual : 'Flexible',
          specialRequests: special_requests,
          approvalToken,
        })
      }
    } catch (emailError) {
      console.error('Error sending emails:', emailError)
      // Don't fail the booking if emails fail
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      dealId: cadenceDealId || `portfolio-${booking.id}`,
      contactId: cadenceContactId,
      message: 'Booking request submitted successfully',
    })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
