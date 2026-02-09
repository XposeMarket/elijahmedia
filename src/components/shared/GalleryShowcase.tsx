import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { StyleWithPhotos } from '@/lib/types'

interface GalleryShowcaseProps {
  style: StyleWithPhotos
}

export function GalleryShowcase({ style }: GalleryShowcaseProps) {
  // Filter out photos without URLs and take first 3
  const validPhotos = style.photos.filter(p => p.photo_url)
  const previewPhotos = validPhotos.slice(0, 3)
  const hasMorePhotos = validPhotos.length > 3

  return (
    <div className="group">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white mb-1">{style.name}</h3>
        {style.description && (
          <p className="text-sm text-neutral-400">{style.description}</p>
        )}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {previewPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg bg-neutral-800",
              "transition-transform duration-300 group-hover:scale-[1.02]"
            )}
          >
            <Image
              src={photo.photo_url || ''}
              alt={photo.title || `${style.name} photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 20vw"
            />
          </div>
        ))}
        {/* Placeholders if less than 3 photos */}
        {previewPhotos.length < 3 &&
          Array.from({ length: 3 - previewPhotos.length }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800 flex items-center justify-center"
            >
              <span className="text-neutral-600 text-sm">Coming soon</span>
            </div>
          ))}
      </div>

      {/* View Gallery Link */}
      <Link
        href={`/gallery/${style.slug}`}
        className="inline-flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
      >
        View Full Gallery
        {hasMorePhotos && (
          <span className="ml-1 text-neutral-600">
            (+{style.photos.length - 3} more)
          </span>
        )}
        <svg
          className="ml-1 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  )
}
