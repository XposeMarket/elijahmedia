import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, Check, X, Mail, Phone } from 'lucide-react'
import { BookingActions } from '@/components/admin/BookingActions'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

async function getBookings(status?: string) {
  const supabase = await createClient()
  const orgId = process.env.PHOTOGRAPHER_ORG_ID

  if (!orgId) return []

  let query = supabase
    .from('photographer_bookings')
    .select('*')
    .eq('org_id', orgId)
    .order('booking_date', { ascending: true })

  if (status) {
    query = query.eq('approval_status', status)
  }

  const { data } = await query

  return data || []
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const selectedStatus = params.status

  const bookings = await getBookings(selectedStatus)

  const statusFilters = [
    { value: '', label: 'All', count: null },
    { value: 'pending', label: 'Pending', color: 'text-orange-500' },
    { value: 'approved', label: 'Approved', color: 'text-green-500' },
    { value: 'denied', label: 'Denied', color: 'text-red-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bookings</h1>
        <p className="text-neutral-400 mt-1">Manage booking requests and approvals</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusFilters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/admin/bookings?status=${filter.value}` : '/admin/bookings'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              (selectedStatus || '') === filter.value
                ? 'bg-green-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {/* Bookings List */}
      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Client Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {booking.client_name}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      booking.approval_status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                      booking.approval_status === 'approved' ? 'bg-green-500/10 text-green-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {booking.approval_status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-400 mb-4">
                    <a 
                      href={`mailto:${booking.client_email}`}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {booking.client_email}
                    </a>
                    {booking.client_phone && (
                      <a 
                        href={`tel:${booking.client_phone}`}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {booking.client_phone}
                      </a>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      <span className="text-white">{booking.booking_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-500" />
                      <span className="text-white">
                        {booking.start_time} - {booking.end_time}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Type: </span>
                      <span className="text-white capitalize">{booking.booking_type}</span>
                      {booking.num_people > 1 && (
                        <span className="text-neutral-400"> ({booking.num_people} people)</span>
                      )}
                    </div>
                  </div>

                  {booking.location && (
                    <p className="text-sm text-neutral-400 mt-2">
                      <span className="text-neutral-500">Location: </span>
                      {booking.location}
                    </p>
                  )}

                  {booking.special_requests && (
                    <p className="text-sm text-neutral-400 mt-2 bg-neutral-800 p-3 rounded-lg">
                      <span className="text-neutral-500">Notes: </span>
                      {booking.special_requests}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {booking.approval_status === 'pending' && (
                  <BookingActions bookingId={booking.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No bookings found</h3>
          <p className="text-neutral-400">
            {selectedStatus 
              ? `No ${selectedStatus} bookings at this time`
              : 'Booking requests will appear here'
            }
          </p>
        </div>
      )}
    </div>
  )
}
