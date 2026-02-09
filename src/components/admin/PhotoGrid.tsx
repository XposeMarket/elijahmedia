'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Trash2, Loader2, Camera, X, AlertTriangle } from 'lucide-react'

interface Photo {
  id: string
  photo_url: string
  thumbnail_url: string | null
  title: string | null
  is_featured: boolean
  photography_styles: {
    name: string
    slug: string
  } | null
}

interface PhotoGridProps {
  photos: Photo[]
}

interface DeleteModalState {
  isOpen: boolean
  type: 'single' | 'bulk'
  photoId?: string
  count?: number
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false, type: 'single' })
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const openDeleteModal = (photoId: string) => {
    setDeleteModal({ isOpen: true, type: 'single', photoId })
  }

  const openBulkDeleteModal = () => {
    setDeleteModal({ isOpen: true, type: 'bulk', count: selectedPhotos.size })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: 'single' })
  }

  const handleDelete = async () => {
    if (deleteModal.type === 'single' && deleteModal.photoId) {
      setDeletingId(deleteModal.photoId)
      setIsDeleting(true)

      try {
        const { error } = await supabase
          .from('gallery_photos')
          .delete()
          .eq('id', deleteModal.photoId)

        if (error) throw error

        router.refresh()
      } catch (error) {
        console.error('Error deleting photo:', error)
      } finally {
        setDeletingId(null)
        setIsDeleting(false)
        closeDeleteModal()
      }
    } else if (deleteModal.type === 'bulk') {
      setIsDeleting(true)

      try {
        const { error } = await supabase
          .from('gallery_photos')
          .delete()
          .in('id', Array.from(selectedPhotos))

        if (error) throw error

        setSelectedPhotos(new Set())
        router.refresh()
      } catch (error) {
        console.error('Error deleting photos:', error)
      } finally {
        setIsDeleting(false)
        closeDeleteModal()
      }
    }
  }

  const toggleSelect = (photoId: string) => {
    const newSelected = new Set(selectedPhotos)
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId)
    } else {
      newSelected.add(photoId)
    }
    setSelectedPhotos(newSelected)
  }

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />
          
          {/* Modal */}
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {deleteModal.type === 'single' ? 'Delete Photo' : 'Delete Photos'}
              </h3>
            </div>

            <p className="text-neutral-400 mb-6">
              {deleteModal.type === 'single' 
                ? 'Are you sure you want to delete this photo? This action cannot be undone.'
                : `Are you sure you want to delete ${deleteModal.count} photos? This action cannot be undone.`
              }
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {selectedPhotos.size > 0 && (
        <div className="mb-4 p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between">
          <span className="text-white">
            {selectedPhotos.size} photo{selectedPhotos.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPhotos(new Set())}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={openBulkDeleteModal}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`group relative aspect-square bg-neutral-900 rounded-lg overflow-hidden border-2 transition-colors ${
              selectedPhotos.has(photo.id) 
                ? 'border-green-500' 
                : 'border-transparent hover:border-neutral-700'
            }`}
          >
            {photo.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.thumbnail_url || photo.photo_url}
                alt={photo.title || 'Gallery photo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-neutral-700" />
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => toggleSelect(photo.id)}
                className={`p-2 rounded-lg transition-colors ${
                  selectedPhotos.has(photo.id)
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {selectedPhotos.has(photo.id) ? '✓' : 'Select'}
              </button>
              <button
                onClick={() => openDeleteModal(photo.id)}
                disabled={deletingId === photo.id}
                className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                {deletingId === photo.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Style badge */}
            {photo.photography_styles && (
              <div className="absolute bottom-2 left-2 right-2">
                <span className="text-xs bg-black/70 text-white px-2 py-1 rounded">
                  {photo.photography_styles.name}
                </span>
              </div>
            )}

            {/* Featured badge */}
            {photo.is_featured && (
              <div className="absolute top-2 right-2">
                <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-medium">
                  Featured
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
