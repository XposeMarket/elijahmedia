import Link from 'next/link'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'

// Demo styles for development
const demoStyles = [
  {
    id: '1',
    name: 'VHS',
    slug: 'vhs',
    description: 'Nostalgic vibes with vintage VHS-inspired aesthetics. Grainy textures, warm tones, and retro color grading.',
    cover_photo_url: null,
    photoCount: 24,
  },
  {
    id: '2',
    name: 'Night Time',
    slug: 'night-time',
    description: 'Moody night photography with neon lights, urban landscapes, and dramatic shadows.',
    cover_photo_url: null,
    photoCount: 18,
  },
  {
    id: '3',
    name: 'Day Time',
    slug: 'day-time',
    description: 'Bright, natural light photography. Clean compositions with vibrant colors.',
    cover_photo_url: null,
    photoCount: 32,
  },
]

async function getStyles() {
  try {
    const supabase = await createClient()
    const orgId = process.env.PHOTOGRAPHER_ORG_ID

    if (!orgId) {
      return demoStyles
    }

    const { data: styles, error } = await supabase
      .from('photography_styles')
      .select(`
        *,
        gallery_photos(count)
      `)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error || !styles || styles.length === 0) {
      return demoStyles
    }

    return styles.map(style => ({
      ...style,
      photoCount: style.gallery_photos?.[0]?.count || 0,
    }))
  } catch {
    return demoStyles
  }
}

export default async function GalleryPage() {
  const styles = await getStyles()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-950 text-white pt-20">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Gallery</h1>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Explore different photography styles. Each collection has its own unique aesthetic and mood.
            </p>
          </div>
        </section>

        {/* Styles Grid */}
        <section className="pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {styles.map((style) => (
                <Link
                  key={style.id}
                  href={`/gallery/${style.slug}`}
                  className="group block"
                >
                  <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-green-500/50 transition-all duration-300">
                    {/* Cover Image */}
                    <div className="aspect-[4/3] relative bg-neutral-800">
                      {style.cover_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={style.cover_photo_url}
                          alt={style.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-16 h-16 text-neutral-700" />
                        </div>
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-2 group-hover:text-green-500 transition-colors">
                        {style.name}
                      </h2>
                      <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
                        {style.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-500">
                          {style.photoCount} photos
                        </span>
                        <span className="text-green-500 text-sm font-medium group-hover:translate-x-1 transition-transform">
                          View Gallery →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-neutral-900/50 border-t border-neutral-800">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Like what you see?
            </h2>
            <p className="text-neutral-400 mb-8">
              Let&apos;s create something amazing together.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              <Camera className="w-5 h-5" />
              Book a Session
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
