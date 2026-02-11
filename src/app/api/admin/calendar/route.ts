import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = ['available', 'off', 'no_more_bookings', 'booked']

export async function POST(request: NextRequest) {
  // Authenticate user via server-side cookies
  const serverSupabase = await createServerClient()
  const { data: { user } } = await serverSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Optionally check that the user belongs to the photographer org
  const orgId = process.env.PHOTOGRAPHER_ORG_ID
  if (!orgId) {
    return NextResponse.json({ error: 'Server misconfiguration: missing PHOTOGRAPHER_ORG_ID' }, { status: 500 })
  }

  const { data: userRecord } = await serverSupabase
    .from('users')
    .select('id, org_id')
    .eq('id', user.id)
    .eq('org_id', orgId)
    .single()

  if (!userRecord) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: any
  try {
    body = await request.json()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { date, day_status, notes } = body || {}

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid or missing date (YYYY-MM-DD)' }, { status: 400 })
  }

  if (!day_status || !ALLOWED_STATUSES.includes(day_status)) {
    return NextResponse.json({ error: 'Invalid or missing day_status' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  try {
    const payload = {
      org_id: orgId,
      date,
      day_status,
      notes: notes || null,
    }

    const { data, error } = await adminSupabase
      .from('photographer_calendar')
      .upsert(payload, { onConflict: 'org_id,date' })
      .select()
      .single()

    if (error) {
      console.error('Failed to upsert calendar day:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, day: data })
  } catch (err: any) {
    console.error('Unexpected error in admin calendar route:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
