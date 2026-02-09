import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Camera, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'

interface Photo {
  id: string
  url?: string
  photo_url?: string
  title?: string
}

interface StyleData {
  name: string
  slug?: string
  description: string
  photos: Photo[]
}

// Demo data for development
const demoStyles: Record<string, StyleData> = {
  'vhs': {
    name: 'VHS',
    description: 'Nostalgic vibes with vintage VHS-inspired aesthetics. Grainy textures, warm tones, and retro color grading.',
    photos: Array.from({ length: 12 }, (_, i) => ({
      id: `vhs-${i + 1}`,
      url: '',
      title: `VHS Photo ${i + 1}`,
    })),
  },
  'night-time': {
    name: 'Night Time',
    description: 'Moody night photography with neon lights, urban landscapes, and dramatic shadows.',
    photos: Array.from({ length: 9 }, (_, i) => ({
      id: `night-${i + 1}`,
      url: '',
      title: `Night Photo ${i + 1}`,
    })),
  },
  'day-time': {
    name: 'Day Time',
    description: 'Bright, natural light photography. Clean compositions with vibrant colors.',
    photos: Array.from({ length: 15 }, (_, i) => ({
      id: `day-${i + 1}`,
      url: '',
      title: `Day Photo ${i + 1}`,
    })),
  },
}

async function getStyleWithPhotos(slug: string): Promise<StyleData | null> {
  try {
    const supabase = await createClient()
    const orgId = process.env.PHOTOGRAPHER_ORG_ID

    if (!orgId) {
      return demoStyles[slug] ? { ...demoStyles[slug], slug } : null
    }

    // Get style
    const { data: style, error: styleError } = await supabase
      .from('photography_styles')
      .select('*')
      .eq('org_id', orgId)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (styleError || !style) {
      return demoStyles[slug] ? { ...demoStyles[slug], slug } : null
    }

    // Get photos for this style
    const { data: photos, error: photosError } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('style_id', style.id)
      .order('display_order', { ascending: true })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
    }

    return {
      ...style,
      photos: photos || [],
    }
  } catch {
    return demoStyles[slug] ? { ...demoStyles[slug], slug } : null
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function GalleryStylePage({ params }: PageProps) {
  const { slug } = await params
  const style = await getStyleWithPhotos(slug)

  if (!style) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-950 text-white pt-20">
        {/* Header Section */}
        <section className="py-8 px-4 border-b border-neutral-800">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{style.name}</h1>
                <p className="text-neutral-400 max-w-2xl">{style.description}</p>
              </div>
              <div className="text-neutral-500">
                {style.photos?.length || 0} photos
              </div>
            </div>
          </div>
        </section>

        {/* Photo Grid */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {style.photos && style.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {style.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square bg-neutral-900 rounded-lg overflow-hidden cursor-pointer"
                  >
                    {photo.url || photo.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.url || photo.photo_url}
                        alt={photo.title || 'Gallery photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-neutral-700" />
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Camera className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
                <p className="text-neutral-400">
                  Photos will be added to this collection soon.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-neutral-900/50 border-t border-neutral-800">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Want this style for your shoot?
            </h2>
            <p className="text-neutral-400 mb-8">
              Book a session and let&apos;s create something amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                <Camera className="w-5 h-5" />
                Book a Session
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Browse Other Styles
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

// Generate static params for known styles
export async function generateStaticParams() {
  return [
    { slug: 'vhs' },
    { slug: 'night-time' },
    { slug: 'day-time' },
  ]
}
