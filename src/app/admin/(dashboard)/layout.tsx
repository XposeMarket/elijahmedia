import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/admin/login')
  }

  // Check if user belongs to photographer's org
  const orgId = process.env.PHOTOGRAPHER_ORG_ID
  if (orgId) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, org_id')
      .eq('id', user.id)
      .eq('org_id', orgId)
      .single()

    if (!userRecord) {
      redirect('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader user={user} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
