'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteStyleButtonProps {
  styleId: string
  styleName: string
}

export function DeleteStyleButton({ styleId, styleName }: DeleteStyleButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      // Delete all photos in this style first
      await supabase
        .from('gallery_photos')
        .delete()
        .eq('style_id', styleId)

      // Delete the style
      const { error } = await supabase
        .from('photography_styles')
        .delete()
        .eq('id', styleId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error deleting style:', error)
      alert('Failed to delete style')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-white mb-2">Delete Style?</h3>
          <p className="text-neutral-400 mb-6">
            Are you sure you want to delete <strong className="text-white">&quot;{styleName}&quot;</strong>? 
            This will also delete all photos in this style. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              disabled={isDeleting}
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
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
      title="Delete style"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
