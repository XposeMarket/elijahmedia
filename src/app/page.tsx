import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Header } from '@/components/shared/Header'
import { GalleryShowcase } from '@/components/shared/GalleryShowcase'
import { createClient } from '@/lib/supabase/server'
import type { StyleWithPhotos, PhotographyStyle, GalleryPhoto } from '@/lib/types'

interface HeroSettings {
  background_url: string | null
  overlay_opacity: number
  overlay_color: string
  title: string
  subtitle: string
}

async function getHeroSettings(): Promise<HeroSettings> {
  const defaults: HeroSettings = {
    background_url: null,
    overlay_opacity: 0.7,
    overlay_color: '#000000',
    title: 'Elijah Media',
    subtitle: 'Capturing moments with unique visual styles. From nostalgic VHS vibes to stunning night and day photography.',
  }

  try {
    const supabase = await createClient()
    const orgId = process.env.PHOTOGRAPHER_ORG_ID

    if (!orgId) return defaults

    const { data } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('org_id', orgId)
      .eq('setting_key', 'hero')
      .single()

    if (data?.setting_value) {
      return { ...defaults, ...(data.setting_value as object) }
    }
  } catch {
    // Return defaults on error
  }

  return defaults
}

async function getStyles(): Promise<StyleWithPhotos[]> {
  const supabase = await createClient()
  
  // Get org_id from environment (photographer's org)
  const orgId = process.env.PHOTOGRAPHER_ORG_ID
  
  if (!orgId) {
    console.warn('PHOTOGRAPHER_ORG_ID not set, returning empty styles')
    return []
  }

  // Fetch active styles
  const { data: styles, error: stylesError } = await supabase
    .from('photography_styles')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (stylesError || !styles) {
    console.error('Error fetching styles:', stylesError)
    return []
  }

  // Fetch photos for all styles
  const { data: photos, error: photosError } = await supabase
    .from('gallery_photos')
    .select('*')
    .eq('org_id', orgId)
    .order('display_order', { ascending: true })

  if (photosError) {
    console.error('Error fetching photos:', photosError)
  }

  // Combine styles with their photos
  return (styles as PhotographyStyle[]).map(style => ({
    ...style,
    photos: (photos as GalleryPhoto[] || []).filter(p => p.style_id === style.id)
  }))
}

export default async function HomePage() {
  const [styles, heroSettings] = await Promise.all([
    getStyles(),
    getHeroSettings(),
  ])

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-[70vh] flex items-center">
        {/* Background Image */}
        {heroSettings.background_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroSettings.background_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay */}
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: heroSettings.overlay_color,
                opacity: heroSettings.overlay_opacity 
              }}
            />
          </>
        )}
        
        <div className="relative mx-auto max-w-7xl text-center w-full">
          {/* Logo/Brand */}
          <div className="mb-8 flex justify-center">
            <div className="flex flex-col items-center gap-4">
              <Image
                src="/logo.png"
                alt="Elijah Media"
                width={120}
                height={120}
                className="h-24 w-24 sm:h-32 sm:w-32 object-contain"
                priority
              />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                {heroSettings.title}
              </h1>
            </div>
          </div>
          
          <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto mb-10">
            {heroSettings.subtitle}
          </p>
          
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-neutral-200 transition-colors"
          >
            Book a Shoot
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Gallery Styles Section */}
      {styles.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-neutral-800">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Photography Styles</h2>
              <p className="text-neutral-400">
                Explore our signature looks and find the perfect style for your shoot
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {styles.map((style) => (
                <GalleryShowcase key={style.id} style={style} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-neutral-800">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Something Amazing?</h2>
          <p className="text-neutral-400 mb-8">
            Book your session today and let&apos;s capture your vision together.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-neutral-200 transition-colors"
          >
            Check Availability
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-neutral-800">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Elijah Media" width={20} height={20} className="h-5 w-5 object-contain opacity-50" />
            <span className="text-neutral-500">© {new Date().getFullYear()} Elijah Media</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <Link href="/gallery" className="hover:text-white transition-colors">
              Gallery
            </Link>
            <Link href="/book" className="hover:text-white transition-colors">
              Book Now
            </Link>
            <Link href="/admin/login" className="hover:text-white transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
