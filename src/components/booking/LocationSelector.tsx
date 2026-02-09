'use client'

import { MapPin, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationSelectorProps {
  locationType: 'provided' | 'flexible'
  locationManual: string
  onTypeChange: (type: 'provided' | 'flexible') => void
  onLocationChange: (location: string) => void
}

export function LocationSelector({
  locationType,
  locationManual,
  onTypeChange,
  onLocationChange,
}: LocationSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onTypeChange('provided')}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            locationType === 'provided'
              ? "border-white bg-white/5"
              : "border-neutral-700 hover:border-neutral-500"
          )}
        >
          <MapPin className={cn(
            "h-6 w-6",
            locationType === 'provided' ? "text-white" : "text-neutral-400"
          )} />
          <span className={cn(
            "font-medium",
            locationType === 'provided' ? "text-white" : "text-neutral-400"
          )}>
            I&apos;ll Provide Location
          </span>
          <span className="text-xs text-neutral-500">
            I have a spot in mind
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeChange('flexible')}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            locationType === 'flexible'
              ? "border-white bg-white/5"
              : "border-neutral-700 hover:border-neutral-500"
          )}
        >
          <MessageCircle className={cn(
            "h-6 w-6",
            locationType === 'flexible' ? "text-white" : "text-neutral-400"
          )} />
          <span className={cn(
            "font-medium",
            locationType === 'flexible' ? "text-white" : "text-neutral-400"
          )}>
            Let&apos;s Figure It Out
          </span>
          <span className="text-xs text-neutral-500">
            Open to suggestions
          </span>
        </button>
      </div>

      {/* Location Input (when providing location) */}
      {locationType === 'provided' && (
        <div className="bg-neutral-800 rounded-xl p-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Where would you like to shoot?
          </label>
          <input
            type="text"
            value={locationManual}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            placeholder="Address, venue name, or general area..."
          />
          <p className="text-xs text-neutral-500 mt-2">
            Be as specific or general as you&apos;d like. We can work out details later.
          </p>
        </div>
      )}

      {locationType === 'flexible' && (
        <div className="bg-neutral-800/50 rounded-xl p-4">
          <p className="text-sm text-neutral-400">
            No problem! We&apos;ll reach out after your booking is confirmed to discuss 
            the perfect location for your shoot.
          </p>
        </div>
      )}
    </div>
  )
}
