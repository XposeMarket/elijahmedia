'use client'

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LogOut, User as UserIcon } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface AdminHeaderProps {
  user: User
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="h-16 bg-neutral-900/50 border-b border-neutral-800 px-6 flex items-center justify-between">
      <div>
        {/* Breadcrumb or page title can go here */}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-neutral-400" />
          </div>
          <span className="text-neutral-300">{user.email}</span>
        </div>
        
        <button
          onClick={handleSignOut}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
