import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'
import { DeleteStyleButton } from '@/components/admin/DeleteStyleButton'

async function getStyles() {
  const supabase = await createClient()
  const orgId = process.env.PHOTOGRAPHER_ORG_ID

  if (!orgId) return []

  const { data } = await supabase
    .from('photography_styles')
    .select(`
      *,
      gallery_photos(count)
    `)
    .eq('org_id', orgId)
    .order('display_order', { ascending: true })

  return data?.map(style => ({
    ...style,
    photoCount: style.gallery_photos?.[0]?.count || 0,
  })) || []
}

export default async function AdminStylesPage() {
  const styles = await getStyles()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gallery Styles</h1>
          <p className="text-neutral-400 mt-1">Manage your photography styles and portfolios</p>
        </div>
        <Link
          href="/admin/styles/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Style
        </Link>
      </div>

      {/* Styles List */}
      {styles.length > 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[auto,1fr,auto,auto,auto,auto] gap-4 p-4 border-b border-neutral-800 text-sm font-medium text-neutral-400">
            <div className="w-8"></div>
            <div>Style</div>
            <div className="w-20 text-center">Photos</div>
            <div className="w-20 text-center">Status</div>
            <div className="w-32 text-center">Actions</div>
            <div className="w-8"></div>
          </div>
          
          <div className="divide-y divide-neutral-800">
            {styles.map((style) => (
              <div 
                key={style.id} 
                className="grid grid-cols-[auto,1fr,auto,auto,auto,auto] gap-4 p-4 items-center hover:bg-neutral-800/50 transition-colors"
              >
                <div className="w-8 flex justify-center">
                  <GripVertical className="w-4 h-4 text-neutral-600 cursor-grab" />
                </div>
                
                <div className="flex items-center gap-4">
                  {style.cover_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={style.cover_photo_url} 
                      alt={style.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center">
                      <span className="text-neutral-500 text-xs">No img</span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{style.name}</p>
                    <p className="text-sm text-neutral-500">/{style.slug}</p>
                  </div>
                </div>
                
                <div className="w-20 text-center">
                  <span className="text-white">{style.photoCount}</span>
                </div>
                
                <div className="w-20 text-center">
                  {style.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                      <Eye className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 bg-neutral-800 px-2 py-1 rounded-full">
                      <EyeOff className="w-3 h-3" />
                      Hidden
                    </span>
                  )}
                </div>
                
                <div className="w-32 flex items-center justify-center gap-2">
                  <Link
                    href={`/admin/styles/${style.id}`}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                    title="Edit style"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/admin/photos?style=${style.id}`}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                    title="View photos"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <DeleteStyleButton styleId={style.id} styleName={style.name} />
                </div>
                
                <div className="w-8"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No styles yet</h3>
          <p className="text-neutral-400 mb-6">Create your first gallery style to start adding photos.</p>
          <Link
            href="/admin/styles/new"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Style
          </Link>
        </div>
      )}
    </div>
  )
}
