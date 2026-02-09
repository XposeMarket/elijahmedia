import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StyleEditForm } from '@/components/admin/StyleEditForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getStyle(id: string) {
  const supabase = await createClient()
  const orgId = process.env.PHOTOGRAPHER_ORG_ID

  if (!orgId) return null

  const { data, error } = await supabase
    .from('photography_styles')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !data) return null
  return data
}

export default async function EditStylePage({ params }: PageProps) {
  const { id } = await params
  
  if (id === 'new') {
    redirect('/admin/styles/new')
  }

  const style = await getStyle(id)

  if (!style) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/styles"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Styles
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Style</h1>
        <p className="text-neutral-400 mt-1">Update &quot;{style.name}&quot; settings and appearance</p>
      </div>

      <StyleEditForm style={style} />
    </div>
  )
}
