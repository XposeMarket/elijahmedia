'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Save, Upload, X, Eye } from 'lucide-react'

interface HeroSettings {
  background_url: string | null
  overlay_opacity: number
  overlay_color: string
  title: string
  subtitle: string
}

interface Settings {
  hero: HeroSettings
}

interface SettingsFormProps {
  initialSettings: Settings
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const [hero, setHero] = useState<HeroSettings>(initialSettings.hero)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `settings/hero-bg.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('elijahmedia-photos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('elijahmedia-photos')
        .getPublicUrl(fileName)

      setHero(prev => ({ ...prev, background_url: publicUrl }))
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload background image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const orgId = process.env.NEXT_PUBLIC_PHOTOGRAPHER_ORG_ID

      const { error: upsertError } = await supabase
        .from('site_settings')
        .upsert({
          org_id: orgId,
          setting_key: 'hero',
          setting_value: hero,
        }, {
          onConflict: 'org_id,setting_key'
        })

      if (upsertError) throw upsertError

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
            Settings saved successfully!
          </div>
        )}

        {/* Hero Section Settings */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Hero Section</h2>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>

          {/* Background Image */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Background Image
            </label>
            <div className="flex items-start gap-4">
              {hero.background_url ? (
                <div className="relative w-48 h-28 rounded-lg overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hero.background_url}
                    alt="Hero background"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setHero(prev => ({ ...prev, background_url: null }))}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-48 h-28 rounded-lg bg-neutral-800 flex items-center justify-center">
                  <span className="text-neutral-500 text-sm">No image</span>
                </div>
              )}
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg cursor-pointer transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-xs text-neutral-500 mt-2">
                  Recommended: 1920x1080px or larger
                </p>
              </div>
            </div>
          </div>

          {/* Overlay Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Overlay Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={hero.overlay_color}
                  onChange={(e) => setHero(prev => ({ ...prev, overlay_color: e.target.value }))}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-neutral-800 border border-neutral-700"
                />
                <input
                  type="text"
                  value={hero.overlay_color}
                  onChange={(e) => setHero(prev => ({ ...prev, overlay_color: e.target.value }))}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Overlay Opacity: {Math.round(hero.overlay_opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={hero.overlay_opacity}
                onChange={(e) => setHero(prev => ({ ...prev, overlay_opacity: parseFloat(e.target.value) }))}
                className="w-full h-12 accent-green-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={hero.title}
              onChange={(e) => setHero(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              placeholder="Elijah Media"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={hero.subtitle}
              onChange={(e) => setHero(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              placeholder="Capturing moments, creating memories"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowPreview(false)} />
          <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden">
            {/* Background */}
            {hero.background_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero.background_url}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-950" />
            )}
            
            {/* Overlay */}
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: hero.overlay_color,
                opacity: hero.overlay_opacity 
              }}
            />
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {hero.title || 'Elijah Media'}
              </h1>
              <p className="text-xl text-neutral-300">
                {hero.subtitle || 'Capturing moments, creating memories'}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
