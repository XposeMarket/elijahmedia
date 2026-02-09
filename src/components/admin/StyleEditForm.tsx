'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { Loader2, Save, Upload, X } from 'lucide-react'

interface Style {
  id: string
  name: string
  slug: string
  description: string | null
  cover_photo_url: string | null
  is_active: boolean
}

interface StyleEditFormProps {
  style: Style
}

export function StyleEditForm({ style }: StyleEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [name, setName] = useState(style.name)
  const [slug, setSlug] = useState(style.slug)
  const [description, setDescription] = useState(style.description || '')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(style.cover_photo_url || '')
  const [isActive, setIsActive] = useState(style.is_active)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `styles/${style.id}/cover.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('elijahmedia-photos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('elijahmedia-photos')
        .getPublicUrl(fileName)

      setCoverPhotoUrl(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload cover photo')
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
      const { error: updateError } = await supabase
        .from('photography_styles')
        .update({
          name,
          slug,
          description: description || null,
          cover_photo_url: coverPhotoUrl || null,
          is_active: isActive,
        })
        .eq('id', style.id)

      if (updateError) {
        if (updateError.code === '23505') {
          setError('A style with this slug already exists')
        } else {
          setError(updateError.message)
        }
        return
      }

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          Style updated successfully!
        </div>
      )}

      {/* Cover Photo */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Cover Photo
        </label>
        <div className="flex items-start gap-4">
          {coverPhotoUrl ? (
            <div className="relative w-32 h-24 rounded-lg overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPhotoUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverPhotoUrl('')}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="w-32 h-24 rounded-lg bg-neutral-800 flex items-center justify-center">
              <span className="text-neutral-500 text-xs">No cover</span>
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
                  Upload Cover
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <p className="text-xs text-neutral-500 mt-2">
              Recommended: 800x600px or larger
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">
          Style Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
          required
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-neutral-300 mb-2">
          URL Slug <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center">
          <span className="text-neutral-500 mr-2">/gallery/</span>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(generateSlug(e.target.value))}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 resize-none"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
        <div>
          <p className="text-white font-medium">Visibility</p>
          <p className="text-sm text-neutral-400">Show this style on the public site</p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isActive ? 'bg-green-600' : 'bg-neutral-700'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              isActive ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      <div className="flex gap-4 pt-4">
        <Link
          href="/admin/styles"
          className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-center rounded-lg font-medium transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading || !name || !slug}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
