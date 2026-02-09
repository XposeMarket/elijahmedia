export interface PhotographyStyle {
  id: string
  org_id: string
  name: string
  slug: string
  description: string | null
  cover_photo_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GalleryPhoto {
  id: string
  org_id: string
  style_id: string
  photo_url: string
  thumbnail_url: string | null
  title: string | null
  description: string | null
  display_order: number
  is_featured: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PhotographerCalendar {
  id: string
  org_id: string
  date: string
  day_status: 'available' | 'off' | 'no_more_bookings' | 'booked'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PhotographerBooking {
  id: string
  org_id: string
  deal_id: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  booking_type: 'personal' | 'event'
  num_people: number | null
  booking_date: string
  start_time: string
  end_time: string
  location_type: 'provided' | 'flexible'
  location_manual: string | null
  special_requests: string | null
  status: string
  approval_token: string | null
  approval_status: 'pending' | 'approved' | 'denied'
  approval_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface BookingFormData {
  client_name: string
  client_email: string
  client_phone?: string
  booking_type: 'personal' | 'event'
  num_people?: number
  booking_date: string
  start_time: string
  end_time: string
  location_type: 'provided' | 'flexible'
  location_manual?: string
  special_requests?: string
}

export interface StyleWithPhotos extends PhotographyStyle {
  photos: GalleryPhoto[]
}
