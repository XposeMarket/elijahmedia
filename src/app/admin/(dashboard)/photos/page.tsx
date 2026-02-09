import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Trash2, Camera } from 'lucide-react'
import { PhotoGrid } from '@/components/admin/PhotoGrid'

interface PageProps {
  searchParams: Promise<{ style?: string }>
}

async function getStyles() {
  const supabase = await createClient()
  const orgId = process.env.PHOTOGRAPHER_ORG_ID

  if (!orgId) return []

  const { data } = await supabase
    .from('photography_styles')
    .select('id, name, slug')
    .eq('org_id', orgId)
    .order('display_order', { ascending: true })

  return data || []
}

async function getPhotos(styleId?: string) {
  const supabase = await createClient()
  const orgId = process.env.PHOTOGRAPHER_ORG_ID

  if (!orgId) return []

  let query = supabase
    .from('gallery_photos')
    .select(`
      *,
      photography_styles(name, slug)
    `)
    .eq('org_id', orgId)
    .order('display_order', { ascending: true })

  if (styleId) {
    query = query.eq('style_id', styleId)
  }

  const { data } = await query

  return data || []
}

export default async function AdminPhotosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const selectedStyleId = params.style

  const [styles, photos] = await Promise.all([
    getStyles(),
    getPhotos(selectedStyleId),
  ])

  const selectedStyle = selectedStyleId 
    ? styles.find(s => s.id === selectedStyleId) 
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Photos</h1>
          <p className="text-neutral-400 mt-1">
            {selectedStyle 
              ? `Viewing photos in "${selectedStyle.name}"`
              : 'Manage all your portfolio photos'
            }
          </p>
        </div>
        <Link
          href="/admin/photos/upload"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload Photos
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/admin/photos"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !selectedStyleId 
              ? 'bg-green-600 text-white' 
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          All Photos
        </Link>
        {styles.map((style) => (
          <Link
            key={style.id}
            href={`/admin/photos?style=${style.id}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStyleId === style.id
                ? 'bg-green-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {style.name}
          </Link>
        ))}
      </div>

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <PhotoGrid photos={photos} />
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No photos yet</h3>
          <p className="text-neutral-400 mb-6">
            {selectedStyle 
              ? `Upload some photos to "${selectedStyle.name}"`
              : 'Upload photos to your gallery styles'
            }
          </p>
          <Link
            href="/admin/photos/upload"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Photos
          </Link>
        </div>
      )}
    </div>
  )
}
