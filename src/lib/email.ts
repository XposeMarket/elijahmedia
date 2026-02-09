import { Resend } from 'resend'
import { format, parseISO } from 'date-fns'

// Initialize Resend lazily to avoid build errors when API key is not set
function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set - emails will not be sent')
    return null
  }
  return new Resend(apiKey)
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.FROM_EMAIL || 'Elijah Media <noreply@elijahmedia.com>'

function formatDisplayDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')
  } catch {
    return dateStr
  }
}

function formatDisplayTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return format(date, 'h:mm a')
  } catch {
    return timeStr
  }
}

// ============================================
// EMAIL TO PHOTOGRAPHER - NEW BOOKING REQUEST
// ============================================
interface ApprovalEmailParams {
  to: string
  clientName: string
  clientEmail: string
  clientPhone: string
  bookingDate: string
  startTime: string
  endTime: string
  bookingType: string
  numPeople?: number
  location?: string
  specialRequests?: string
  approvalToken: string
}

export async function sendApprovalEmail(params: ApprovalEmailParams) {
  const approveUrl = `${APP_URL}/api/bookings/approve?token=${params.approvalToken}`
  const denyUrl = `${APP_URL}/api/bookings/deny?token=${params.approvalToken}`
  
  const formattedDate = formatDisplayDate(params.bookingDate)
  const formattedStartTime = formatDisplayTime(params.startTime)
  const formattedEndTime = formatDisplayTime(params.endTime)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">New Booking Request</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">
        You have a new booking request from <strong style="color: white;">${params.clientName}</strong>.
      </p>
      
      <!-- Booking Details Card -->
      <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: white; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #404040; padding-bottom: 12px;">
          📸 Booking Details
        </h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #737373; padding: 8px 0; width: 120px;">Date:</td>
            <td style="color: white; padding: 8px 0;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="color: #737373; padding: 8px 0;">Time:</td>
            <td style="color: white; padding: 8px 0;">${formattedStartTime} - ${formattedEndTime}</td>
          </tr>
          <tr>
            <td style="color: #737373; padding: 8px 0;">Type:</td>
            <td style="color: white; padding: 8px 0;">${params.bookingType === 'event' ? `Event (${params.numPeople || 1} people)` : 'Personal'}</td>
          </tr>
          ${params.location ? `
          <tr>
            <td style="color: #737373; padding: 8px 0;">Location:</td>
            <td style="color: white; padding: 8px 0;">${params.location}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Client Info Card -->
      <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: white; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #404040; padding-bottom: 12px;">
          👤 Client Information
        </h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #737373; padding: 8px 0; width: 120px;">Name:</td>
            <td style="color: white; padding: 8px 0;">${params.clientName}</td>
          </tr>
          <tr>
            <td style="color: #737373; padding: 8px 0;">Email:</td>
            <td style="color: white; padding: 8px 0;">
              <a href="mailto:${params.clientEmail}" style="color: #22c55e; text-decoration: none;">${params.clientEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="color: #737373; padding: 8px 0;">Phone:</td>
            <td style="color: white; padding: 8px 0;">
              <a href="tel:${params.clientPhone}" style="color: #22c55e; text-decoration: none;">${params.clientPhone}</a>
            </td>
          </tr>
        </table>
      </div>
      
      ${params.specialRequests ? `
      <!-- Special Requests -->
      <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: white; font-size: 18px; margin: 0 0 12px;">💬 Special Requests</h2>
        <p style="color: #a3a3a3; margin: 0; line-height: 1.6;">${params.specialRequests}</p>
      </div>
      ` : ''}
      
      <!-- Action Buttons -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${approveUrl}" style="display: inline-block; background-color: #22c55e; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px;">
          ✓ Approve Booking
        </a>
        <a href="${denyUrl}" style="display: inline-block; background-color: #ef4444; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px;">
          ✕ Decline Booking
        </a>
      </div>
      
      <p style="color: #525252; font-size: 12px; text-align: center; margin-top: 24px;">
        This approval link expires in 7 days.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #0a0a0a; padding: 20px; text-align: center; border-top: 1px solid #262626;">
      <p style="color: #525252; font-size: 12px; margin: 0;">
        Elijah Media Photography
      </p>
    </div>
  </div>
</body>
</html>
  `

  const resend = getResend()
  if (!resend) {
    console.log('Skipping email send - Resend not configured')
    return { data: null, error: { message: 'Email service not configured' } }
  }

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `📸 New Booking Request: ${params.clientName} - ${formattedDate}`,
    html,
  })

  return result
}

// ============================================
// EMAIL TO CLIENT - BOOKING CONFIRMATION
// ============================================
interface BookingConfirmationParams {
  to: string
  clientName: string
  bookingDate: string
  startTime: string
  endTime: string
}

export async function sendBookingConfirmationEmail(params: BookingConfirmationParams) {
  const formattedDate = formatDisplayDate(params.bookingDate)
  const formattedStartTime = formatDisplayTime(params.startTime)
  const formattedEndTime = formatDisplayTime(params.endTime)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Booking Request Received</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 8px;">
        Hey <strong style="color: white;">${params.clientName}</strong>,
      </p>
      <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">
        Thanks for reaching out! Your booking request has been submitted and is pending review.
      </p>
      
      <!-- Booking Details Card -->
      <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: white; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #404040; padding-bottom: 12px;">
          📅 Your Requested Time
        </h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #737373; padding: 8px 0; width: 100px;">Date:</td>
            <td style="color: white; padding: 8px 0;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="color: #737373; padding: 8px 0;">Time:</td>
            <td style="color: white; padding: 8px 0;">${formattedStartTime} - ${formattedEndTime}</td>
          </tr>
        </table>
      </div>
      
      <!-- What's Next -->
      <div style="background-color: #262626; border-radius: 8px; padding: 20px;">
        <h2 style="color: white; font-size: 18px; margin: 0 0 16px;">⏳ What's Next?</h2>
        <ul style="color: #a3a3a3; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Your request is being reviewed</li>
          <li>You'll receive an email once it's approved or if there are any questions</li>
          <li>Feel free to reply to this email if you have any questions</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #0a0a0a; padding: 20px; text-align: center; border-top: 1px solid #262626;">
      <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 8px;">Looking forward to working with you!</p>
      <p style="color: #525252; font-size: 12px; margin: 0;">
        Elijah Media Photography
      </p>
    </div>
  </div>
</body>
</html>
  `

  const resend = getResend()
  if (!resend) {
    console.log('Skipping email send - Resend not configured')
    return { data: null, error: { message: 'Email service not configured' } }
  }

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Booking Request Received - ${formattedDate}`,
    html,
  })

  return result
}

// ============================================
// EMAIL TO CLIENT - BOOKING APPROVED
// ============================================
interface ApprovalConfirmationParams {
  to: string
  clientName: string
  bookingDate: string
  startTime: string
  endTime: string
}

export async function sendApprovalConfirmationEmail(params: ApprovalConfirmationParams) {
  const formattedDate = formatDisplayDate(params.bookingDate)
  const formattedStartTime = formatDisplayTime(params.startTime)
  const formattedEndTime = formatDisplayTime(params.endTime)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Booking Confirmed!</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 8px;">
        Hey <strong style="color: white;">${params.clientName}</strong>,
      </p>
      <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">
        Great news! Your booking has been approved. Looking forward to the shoot!
      </p>
      
      <!-- Confirmed Details Card -->
      <div style="background-color: #14532d; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: #22c55e; font-size: 18px; margin: 0 0 16px;">
          ✓ Confirmed Session
        </h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #86efac; padding: 8px 0; width: 100px;">Date:</td>
            <td style="color: white; padding: 8px 0; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="color: #86efac; padding: 8px 0;">Time:</td>
            <td style="color: white; padding: 8px 0; font-weight: 600;">${formattedStartTime} - ${formattedEndTime}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #a3a3a3; font-size: 14px; margin: 0; line-height: 1.6;">
        If you need to make any changes or have questions, just reply to this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #0a0a0a; padding: 20px; text-align: center; border-top: 1px solid #262626;">
      <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 8px;">See you soon!</p>
      <p style="color: #525252; font-size: 12px; margin: 0;">
        Elijah Media Photography
      </p>
    </div>
  </div>
</body>
</html>
  `

  const resend = getResend()
  if (!resend) {
    console.log('Skipping email send - Resend not configured')
    return { data: null, error: { message: 'Email service not configured' } }
  }

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `✅ Booking Confirmed - ${formattedDate}`,
    html,
  })

  return result
}

// ============================================
// EMAIL TO PHOTOGRAPHER - BOOKING CONFIRMED
// ============================================
interface PhotographerConfirmationParams {
  to: string
  clientName: string
  clientEmail: string
  clientPhone: string
  bookingDate: string
  startTime: string
  endTime: string
  bookingType: string
}

export async function sendApprovalConfirmationToPhotographer(params: PhotographerConfirmationParams) {
  const formattedDate = formatDisplayDate(params.bookingDate)
  const formattedStartTime = formatDisplayTime(params.startTime)
  const formattedEndTime = formatDisplayTime(params.endTime)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 20px;">Booking Confirmed</h1>
    </div>
    
    <div style="padding: 24px;">
      <p style="color: #a3a3a3; margin: 0 0 16px;">
        You approved <strong style="color: white;">${params.clientName}</strong>'s booking. The client has been notified.
      </p>
      
      <div style="background-color: #262626; border-radius: 8px; padding: 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #737373; padding: 6px 0;">Date:</td>
            <td style="color: white; padding: 6px 0;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="color: #737373; padding: 6px 0;">Time:</td>
            <td style="color: white; padding: 6px 0;">${formattedStartTime} - ${formattedEndTime}</td>
          </tr>
          <tr>
            <td style="color: #737373; padding: 6px 0;">Type:</td>
            <td style="color: white; padding: 6px 0;">${params.bookingType}</td>
          </tr>
          <tr>
            <td style="color: #737373; padding: 6px 0;">Email:</td>
            <td style="color: white; padding: 6px 0;">
              <a href="mailto:${params.clientEmail}" style="color: #22c55e;">${params.clientEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="color: #737373; padding: 6px 0;">Phone:</td>
            <td style="color: white; padding: 6px 0;">
              <a href="tel:${params.clientPhone}" style="color: #22c55e;">${params.clientPhone}</a>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
  `

  const resend = getResend()
  if (!resend) {
    console.log('Skipping email send - Resend not configured')
    return { data: null, error: { message: 'Email service not configured' } }
  }

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Confirmed: ${params.clientName} - ${formattedDate}`,
    html,
  })

  return result
}

// ============================================
// EMAIL TO CLIENT - BOOKING DENIED
// ============================================
interface DenialEmailParams {
  to: string
  clientName: string
  bookingDate: string
}

export async function sendDenialEmail(params: DenialEmailParams) {
  const formattedDate = formatDisplayDate(params.bookingDate)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Booking Update</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 8px;">
        Hey <strong style="color: white;">${params.clientName}</strong>,
      </p>
      <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">
        Unfortunately, I'm not able to accommodate your booking request for <strong style="color: white;">${formattedDate}</strong> at this time.
      </p>
      
      <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">
        This could be due to scheduling conflicts or other commitments. I'd love to work with you at another time though!
      </p>
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="${APP_URL}/book" style="display: inline-block; background-color: #22c55e; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Request Another Date
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #0a0a0a; padding: 20px; text-align: center; border-top: 1px solid #262626;">
      <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 8px;">Thanks for understanding!</p>
      <p style="color: #525252; font-size: 12px; margin: 0;">
        Elijah Media Photography
      </p>
    </div>
  </div>
</body>
</html>
  `

  const resend = getResend()
  if (!resend) {
    console.log('Skipping email send - Resend not configured')
    return { data: null, error: { message: 'Email service not configured' } }
  }

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Booking Request Update - ${formattedDate}`,
    html,
  })

  return result
}
