'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DateTimeSelector } from './DateTimeSelector'
import { BookingTypeSelector } from './BookingTypeSelector'
import { LocationSelector } from './LocationSelector'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  client_name: string
  client_email: string
  client_phone: string
  instagram_handle: string
  booking_type: 'personal' | 'event'
  num_people: number
  booking_date: string
  start_time: string
  end_time: string
  location_type: 'provided' | 'flexible'
  location_manual: string
  special_requests: string
  personal_styles: string[]
  personal_styles_total: number
}

export function BookingForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const [formData, setFormData] = useState<FormData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    instagram_handle: '',
    booking_type: 'personal',
    num_people: 1,
    booking_date: '',
    start_time: '',
    end_time: '',
    location_type: 'flexible',
    location_manual: '',
    special_requests: '',
    personal_styles: [],
    personal_styles_total: 0,
  })

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit booking')
      }

      setSubmitStatus('success')
      // Redirect to success page after 2 seconds
      setTimeout(() => {
        const params = new URLSearchParams({
          date: formData.booking_date,
          time: formData.start_time,
        })
        router.push(`/book/success?${params.toString()}`)
      }, 2000)
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = 
    formData.client_name.trim() !== '' &&
    formData.client_email.trim() !== '' &&
    formData.instagram_handle.trim() !== '' &&
    formData.booking_date !== '' &&
    formData.start_time !== '' &&
    (formData.location_type === 'flexible' || formData.location_manual.trim() !== '')

  if (submitStatus === 'success') {
    return (
      <div className="bg-neutral-900 rounded-2xl p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Booking Request Submitted!</h2>
        <p className="text-neutral-400 mb-4">
          We&apos;ve received your request and will review it shortly.
          You&apos;ll receive an email confirmation once approved.
        </p>
        <p className="text-sm text-neutral-500">Redirecting...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Client Info */}
      <section className="bg-neutral-900 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Your Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.client_name}
              onChange={(e) => updateField('client_name', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.client_email}
              onChange={(e) => updateField('client_email', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-neutral-300 mb-1">
              Instagram Handle <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="instagram"
              value={formData.instagram_handle}
              onChange={(e) => updateField('instagram_handle', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="@yourhandle"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-1">
              Phone <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.client_phone}
              onChange={(e) => updateField('client_phone', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="(555) 555-5555"
            />
          </div>
        </div>
      </section>

      {/* Booking Type */}
      <section className="bg-neutral-900 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Type of Shoot</h2>
        <BookingTypeSelector
          bookingType={formData.booking_type}
          numPeople={formData.num_people}
          onTypeChange={(type) => {
            updateField('booking_type', type)
            // Reset personal styles if switching away from personal
            if (type !== 'personal') {
              updateField('personal_styles', [])
              updateField('personal_styles_total', 0)
            }
          }}
          onNumPeopleChange={(num) => updateField('num_people', num)}
        />
        {/* Checklist for Personal Shoot Styles */}
        {formData.booking_type === 'personal' && (
          <div className="mt-6 bg-neutral-800 rounded-xl p-6">
            <h3 className="text-md font-semibold mb-3">Select your shoot style(s):</h3>
            <div className="space-y-2">
              {/* Select All Option */}
              <label className="flex items-center gap-3 font-semibold">
                <input
                  type="checkbox"
                  checked={formData.personal_styles.length === 5}
                  onChange={e => {
                    const allKeys = ['vhs', 'vhs_rollers', 'light_painting', 'photo_set', 'photos_rollers']
                    if (e.target.checked) {
                      updateField('personal_styles', allKeys)
                      updateField('personal_styles_total', 100)
                    } else {
                      updateField('personal_styles', [])
                      updateField('personal_styles_total', 0)
                    }
                  }}
                />
                <span className="flex-1">Select All</span>
                <span className="text-neutral-400 text-sm">$100</span>
              </label>
              {/* Individual Options */}
              {[
                { key: 'vhs', label: 'VHS Video', price: 25 },
                { key: 'vhs_rollers', label: 'VHS Video and Rollers', price: 45 },
                { key: 'light_painting', label: 'Light Painting', price: 35 },
                { key: 'photo_set', label: 'Photo Set (Instagram Dump)', price: 55 },
                { key: 'photos_rollers', label: 'Photos and Photo Rollers', price: 65 },
              ].map(option => (
                <label key={option.key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.personal_styles.includes(option.key)}
                    onChange={e => {
                      let updated: string[]
                      if (e.target.checked) {
                        updated = [...formData.personal_styles, option.key]
                      } else {
                        updated = formData.personal_styles.filter(k => k !== option.key)
                      }
                      // Calculate total
                      const allOptions = [
                        { key: 'vhs', price: 25 },
                        { key: 'vhs_rollers', price: 45 },
                        { key: 'light_painting', price: 35 },
                        { key: 'photo_set', price: 55 },
                        { key: 'photos_rollers', price: 65 },
                      ]
                      let total = 0
                      if (updated.length === 5) {
                        total = 100
                      } else {
                        total = updated.reduce((sum, key) => {
                          const found = allOptions.find(o => o.key === key)
                          return sum + (found ? found.price : 0)
                        }, 0)
                      }
                      updateField('personal_styles', updated)
                      updateField('personal_styles_total', total)
                    }}
                  />
                  <span className="flex-1">{option.label}</span>
                  <span className="text-neutral-400 text-sm">${option.price}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 text-sm text-neutral-300">
              <div className="font-semibold">Total: <span className="text-white">${formData.personal_styles.length === 5 ? 100 : formData.personal_styles_total}</span></div>
              <div className="mt-2 text-neutral-400">
                {formData.personal_styles.length === 5
                  ? 'All selected: $100 total, $50 deposit required.'
                  : 'For any other selection, a $15 minimum deposit is required once the booking is approved. We will reach back out after confirmation.'}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Date & Time */}
      <section className="bg-neutral-900 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Date & Time</h2>
        <DateTimeSelector
          selectedDate={formData.booking_date}
          selectedTime={formData.start_time}
          bookingType={formData.booking_type}
          numPeople={formData.num_people}
          onDateChange={(date) => updateField('booking_date', date)}
          onTimeChange={(start, end) => {
            updateField('start_time', start)
            updateField('end_time', end)
          }}
        />
      </section>

      {/* Location */}
      <section className="bg-neutral-900 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Location</h2>
        <LocationSelector
          locationType={formData.location_type}
          locationManual={formData.location_manual}
          onTypeChange={(type) => updateField('location_type', type)}
          onLocationChange={(location) => updateField('location_manual', location)}
        />
      </section>

      {/* Special Requests */}
      <section className="bg-neutral-900 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Special Requests</h2>
        <textarea
          value={formData.special_requests}
          onChange={(e) => updateField('special_requests', e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[120px]"
          placeholder="Any special requests, ideas, or things we should know about your shoot..."
        />
      </section>

      {/* Error Message */}
      {submitStatus === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-500 font-medium">Failed to submit booking</p>
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className={cn(
          "w-full py-4 rounded-full font-semibold text-lg transition-all",
          isFormValid && !isSubmitting
            ? "bg-white text-black hover:bg-neutral-200"
            : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </span>
        ) : (
          'Submit Booking Request'
        )}
      </button>
    </form>
  )
}
