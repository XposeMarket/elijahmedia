'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

export default function NewStylePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const orgId = process.env.NEXT_PUBLIC_PHOTOGRAPHER_ORG_ID

      const { data, error: insertError } = await supabase
        .from('photography_styles')
        .insert({
          org_id: orgId,
          name,
          slug,
          description,
          is_active: isActive,
          display_order: 999, // Will be sorted later
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          setError('A style with this slug already exists')
        } else {
          setError(insertError.message)
        }
        return
      }

      router.push(`/admin/styles/${data.id}`)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
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
        <h1 className="text-2xl font-bold text-white">Create New Style</h1>
        <p className="text-neutral-400 mt-1">Add a new gallery style to organize your photos</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">
            Style Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            placeholder="e.g., VHS, Night Time, Day Time"
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
              placeholder="vhs"
              required
            />
          </div>
          <p className="text-sm text-neutral-500 mt-2">
            This will be the URL path for this gallery style
          </p>
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
            placeholder="Describe this photography style..."
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
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Style
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
