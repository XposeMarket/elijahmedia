import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  FolderOpen, 
  Images, 
  Calendar, 
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react'

async function getStats() {
  const supabase = await createClient()
  const orgId = process.env.PHOTOGRAPHER_ORG_ID

  if (!orgId) {
    return { styles: 0, photos: 0, pendingBookings: 0, upcomingBookings: 0 }
  }

  const [stylesRes, photosRes, pendingRes, upcomingRes] = await Promise.all([
    supabase
      .from('photography_styles')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId),
    supabase
      .from('gallery_photos')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId),
    supabase
      .from('photographer_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('approval_status', 'pending'),
    supabase
      .from('photographer_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('approval_status', 'approved')
      .gte('booking_date', new Date().toISOString().split('T')[0]),
  ])

  return {
    styles: stylesRes.count || 0,
    photos: photosRes.count || 0,
    pendingBookings: pendingRes.count || 0,
    upcomingBookings: upcomingRes.count || 0,
  }
}

async function getRecentBookings() {
  const supabase = await createClient()
  const orgId = process.env.PHOTOGRAPHER_ORG_ID

  if (!orgId) return []

  const { data } = await supabase
    .from('photographer_bookings')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)

  return data || []
}

export default async function AdminDashboardPage() {
  const [stats, recentBookings] = await Promise.all([
    getStats(),
    getRecentBookings(),
  ])

  const statCards = [
    { 
      label: 'Gallery Styles', 
      value: stats.styles, 
      icon: FolderOpen, 
      href: '/admin/styles',
      color: 'text-blue-500 bg-blue-500/10'
    },
    { 
      label: 'Total Photos', 
      value: stats.photos, 
      icon: Images, 
      href: '/admin/photos',
      color: 'text-purple-500 bg-purple-500/10'
    },
    { 
      label: 'Pending Requests', 
      value: stats.pendingBookings, 
      icon: Clock, 
      href: '/admin/bookings?status=pending',
      color: 'text-orange-500 bg-orange-500/10'
    },
    { 
      label: 'Upcoming Shoots', 
      value: stats.upcomingBookings, 
      icon: Calendar, 
      href: '/admin/bookings?status=approved',
      color: 'text-green-500 bg-green-500/10'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-400 mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/styles/new"
            className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Style
          </Link>
          <Link
            href="/admin/photos/upload"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Photos
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-neutral-400 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Booking Requests</h2>
          <Link
            href="/admin/bookings"
            className="text-sm text-green-500 hover:text-green-400 transition-colors"
          >
            View all →
          </Link>
        </div>
        
        {recentBookings.length > 0 ? (
          <div className="divide-y divide-neutral-800">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    booking.approval_status === 'pending' ? 'bg-orange-500' :
                    booking.approval_status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{booking.client_name}</p>
                    <p className="text-sm text-neutral-400">
                      {booking.booking_date} • {booking.booking_type}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  booking.approval_status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                  booking.approval_status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                  'bg-red-500/10 text-red-500'
                }`}>
                  {booking.approval_status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-500">
            No booking requests yet
          </div>
        )}
      </div>
    </div>
  )
}
