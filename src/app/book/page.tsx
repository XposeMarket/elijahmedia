import Image from 'next/image'
import { Header } from '@/components/shared/Header'
import { BookingForm } from '@/components/booking/BookingForm'

export const metadata = {
  title: 'Book a Shoot | Elijah Media',
  description: 'Book your photography session with Elijah Media. Select your preferred date, time, and style.',
}

export default function BookPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Elijah Media" width={48} height={48} className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Book Your Session</h1>
            <p className="text-neutral-400">
              Fill out the form below to request a photography session. 
              We&apos;ll review your request and get back to you shortly.
            </p>
          </div>

          {/* Booking Form */}
          <BookingForm />
        </div>
      </main>
    </div>
  )
}
