'use client'

import { Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingTypeSelectorProps {
  bookingType: 'personal' | 'event'
  numPeople: number
  onTypeChange: (type: 'personal' | 'event') => void
  onNumPeopleChange: (num: number) => void
}

export function BookingTypeSelector({
  bookingType,
  numPeople,
  onTypeChange,
  onNumPeopleChange,
}: BookingTypeSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onTypeChange('personal')}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            bookingType === 'personal'
              ? "border-white bg-white/5"
              : "border-neutral-700 hover:border-neutral-500"
          )}
        >
          <User className={cn(
            "h-6 w-6",
            bookingType === 'personal' ? "text-white" : "text-neutral-400"
          )} />
          <span className={cn(
            "font-medium",
            bookingType === 'personal' ? "text-white" : "text-neutral-400"
          )}>
            Personal Shoot
          </span>
          <span className="text-xs text-neutral-500">
            Portrait, headshots, individual
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeChange('event')}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            bookingType === 'event'
              ? "border-white bg-white/5"
              : "border-neutral-700 hover:border-neutral-500"
          )}
        >
          <Users className={cn(
            "h-6 w-6",
            bookingType === 'event' ? "text-white" : "text-neutral-400"
          )} />
          <span className={cn(
            "font-medium",
            bookingType === 'event' ? "text-white" : "text-neutral-400"
          )}>
            Event
          </span>
          <span className="text-xs text-neutral-500">
            Groups, parties, gatherings
          </span>
        </button>
      </div>

      {/* Number of People (for events) */}
      {bookingType === 'event' && (
        <div className="bg-neutral-800 rounded-xl p-4">
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            How many people will be at the event?
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNumPeopleChange(Math.max(2, numPeople - 1))}
              className="w-10 h-10 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-xl font-medium"
            >
              -
            </button>
            <span className="text-2xl font-semibold w-16 text-center">
              {numPeople}
            </span>
            <button
              type="button"
              onClick={() => onNumPeopleChange(numPeople + 1)}
              className="w-10 h-10 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-xl font-medium"
            >
              +
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            {numPeople > 5 ? 'Larger events may require longer session time' : 'Session duration: ~3 hours'}
          </p>
        </div>
      )}
    </div>
  )
}
