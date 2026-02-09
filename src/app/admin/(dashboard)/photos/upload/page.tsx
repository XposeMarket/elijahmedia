'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function UploadPhotosPage() {
  const router = useRouter()
  const [selectedStyleId, setSelectedStyleId] = useState('')
  const [styles, setStyles] = useState<{ id: string; name: string }[]>([])
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [stylesLoaded, setStylesLoaded] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load styles on mount
  const loadStyles = useCallback(async () => {
    if (stylesLoaded) return

    const { data } = await supabase
      .from('photography_styles')
      .select('id, name')
      .order('display_order', { ascending: true })

    if (data) {
      setStyles(data)
      if (data.length > 0 && !selectedStyleId) {
        setSelectedStyleId(data[0].id)
      }
    }
    setStylesLoaded(true)
  }, [supabase, stylesLoaded, selectedStyleId])

  // Load styles on component mount
  useState(() => {
    loadStyles()
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const uploadAll = async () => {
    if (!selectedStyleId || files.length === 0) return

    setIsUploading(true)
    const orgId = process.env.NEXT_PUBLIC_PHOTOGRAPHER_ORG_ID

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i]
      if (uploadFile.status !== 'pending') continue

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
        )
      )

      try {
        const fileExt = uploadFile.file.name.split('.').pop()
        const fileName = `photos/${selectedStyleId}/${Date.now()}-${i}.${fileExt}`

        // Upload to storage
        const { error: storageError } = await supabase.storage
          .from('elijahmedia-photos')
          .upload(fileName, uploadFile.file)

        if (storageError) throw storageError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('elijahmedia-photos')
          .getPublicUrl(fileName)

        // Create database record
        const { error: dbError } = await supabase
          .from('gallery_photos')
          .insert({
            org_id: orgId,
            style_id: selectedStyleId,
            photo_url: publicUrl,
            display_order: i,
          })

        if (dbError) throw dbError

        // Update status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'success' } : f
          )
        )
      } catch (error) {
        console.error('Upload error:', error)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          )
        )
      }
    }

    setIsUploading(false)
  }

  const successCount = files.filter((f) => f.status === 'success').length
  const errorCount = files.filter((f) => f.status === 'error').length
  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/photos"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Photos
        </Link>
        <h1 className="text-2xl font-bold text-white">Upload Photos</h1>
        <p className="text-neutral-400 mt-1">Add new photos to your gallery</p>
      </div>

      {/* Style Selector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Select Gallery Style <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedStyleId}
          onChange={(e) => setSelectedStyleId(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
        >
          <option value="">Select a style...</option>
          {styles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
        </select>
        {styles.length === 0 && stylesLoaded && (
          <p className="text-sm text-orange-400 mt-2">
            No styles found. <Link href="/admin/styles/new" className="underline">Create a style first</Link>
          </p>
        )}
      </div>

      {/* Drop Zone */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <label className="block">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-12 text-center hover:border-neutral-600 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">
              Click to select photos or drag and drop
            </p>
            <p className="text-sm text-neutral-500">
              Supports JPG, PNG, WebP up to 10MB each
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="text-sm text-neutral-400">
              {files.length} file{files.length > 1 ? 's' : ''} selected
              {successCount > 0 && (
                <span className="text-green-500 ml-2">• {successCount} uploaded</span>
              )}
              {errorCount > 0 && (
                <span className="text-red-500 ml-2">• {errorCount} failed</span>
              )}
            </div>
            {pendingCount > 0 && (
              <button
                onClick={() => setFiles([])}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                
                {/* Status Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center ${
                  file.status === 'uploading' ? 'bg-black/70' :
                  file.status === 'success' ? 'bg-green-500/30' :
                  file.status === 'error' ? 'bg-red-500/30' : ''
                }`}>
                  {file.status === 'uploading' && (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>

                {/* Remove Button */}
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {pendingCount > 0 && (
            <div className="p-4 border-t border-neutral-800">
              <button
                onClick={uploadAll}
                disabled={!selectedStyleId || isUploading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload {pendingCount} Photo{pendingCount > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Done State */}
          {pendingCount === 0 && successCount > 0 && (
            <div className="p-4 border-t border-neutral-800">
              <Link
                href="/admin/photos"
                className="block w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-lg font-medium transition-colors text-center"
              >
                View All Photos
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
