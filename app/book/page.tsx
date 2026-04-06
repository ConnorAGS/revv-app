'use client'

import { useActionState, useState } from 'react'
import { submitBooking } from './actions'
import { SERVICE_MINIMUMS } from '@/lib/service-prices'
import type { BookingState } from './actions'
import { SiteNav } from '@/components/SiteNav'
import { PhoneInput } from '@/components/PhoneInput'
import Link from 'next/link'

const SERVICE_TYPES = [
  'Oil Change',
  'Brake Service',
  'Tire Rotation',
  'Battery Replacement',
  'Engine Diagnostic',
  'AC Service',
  'Transmission Service',
  'Other',
]

const TIME_WINDOWS = [
  { value: 'Morning (8am – 12pm)',   label: 'Morning',   sub: '8am – 12pm' },
  { value: 'Afternoon (12pm – 5pm)', label: 'Afternoon', sub: '12pm – 5pm' },
  { value: 'Evening (5pm – 8pm)',    label: 'Evening',   sub: '5pm – 8pm' },
]

// Next 7 days
function getDateOptions() {
  const options = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    options.push({
      value: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      sub: i <= 1 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  return options
}

const NEXT_STEPS = [
  { icon: '📞', title: 'We confirm your appointment', desc: "You'll get a call or text to lock in your exact time." },
  { icon: '🚗', title: 'Your tech heads to you', desc: "A certified mechanic drives to your location — no shop needed." },
  { icon: '✅', title: 'Job done, you pay', desc: "We complete the work and send you a payment link when finished." },
]

const initialState: BookingState = { success: false, error: null }

export default function BookPage() {
  const [state, formAction, isPending] = useActionState(submitBooking, initialState)
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  const dateOptions = getDateOptions()
  const estimatedPrice = selectedService ? SERVICE_MINIMUMS[selectedService] : null

  if (state.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteNav />
        <div className="max-w-lg mx-auto px-4 py-12">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Received!</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Hey {state.name?.split(' ')[0]}, we&apos;ve got your request for <strong>{state.serviceType}</strong>.
            </p>
          </div>

          {/* What happens next */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">What happens next</p>
            <div className="space-y-4">
              {NEXT_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="text-xl shrink-0 mt-0.5">{step.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SMS note */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4 text-sm text-blue-700">
            📱 A confirmation text has been sent to your phone.
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {state.bookingId && (
              <Link
                href={`/track/${state.bookingId}`}
                className="flex-1 text-center bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-500 transition-colors"
              >
                Track My Job
              </Link>
            )}
            <Link
              href="/"
              className="flex-1 text-center border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {state.bookingId && (
            <p className="text-center text-xs text-gray-300 mt-4">
              Booking ref: {state.bookingId.slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav />
      <div className="py-10 px-4">
        <div className="max-w-lg mx-auto">
          <div className="mb-8 text-center">
            <h1 className="font-display text-5xl text-gray-900 tracking-wide">Book a Service</h1>
            <p className="text-gray-500 mt-2">Mobile auto repair — we come to you.</p>
          </div>

          <form action={formAction} className="bg-white rounded-2xl shadow-md p-6 space-y-5">
            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {state.error}
              </div>
            )}

            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input id="name" name="name" required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-600">*</span>
                </label>
                <PhoneInput name="phone" required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" name="email" type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
            </div>

            {/* Service type + price preview */}
            <div>
              <label htmlFor="service_type" className="block text-sm font-medium text-gray-700 mb-1">
                Service Type <span className="text-red-600">*</span>
              </label>
              <select
                id="service_type"
                name="service_type"
                required
                defaultValue=""
                onChange={e => setSelectedService(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              >
                <option value="" disabled>Select a service...</option>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Price preview */}
              {estimatedPrice && (
                <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <span className="text-xs text-green-700 font-medium">Estimated starting price</span>
                  <span className="text-sm font-bold text-green-700">${estimatedPrice}+</span>
                </div>
              )}
            </div>

            {/* Vehicle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
              <div className="grid grid-cols-3 gap-3">
                <input name="vehicle_year" placeholder="Year" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                <input name="vehicle_make" placeholder="Make" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                <input name="vehicle_model" placeholder="Model" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Location <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-1.5">Where the vehicle is parked — our technician will meet you here.</p>
              <input id="address" name="address" required placeholder="123 Main St, City, State" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
            </div>

            {/* Preferred date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Day</label>
              <div className="grid grid-cols-4 gap-2">
                {dateOptions.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setSelectedDate(selectedDate === d.value ? '' : d.value)}
                    className={`py-2.5 rounded-xl text-center border transition-all ${
                      selectedDate === d.value
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <p className="text-xs font-bold leading-tight">{d.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{d.sub}</p>
                  </button>
                ))}
              </div>
              <input type="hidden" name="preferred_date" value={selectedDate} />
            </div>

            {/* Preferred time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_WINDOWS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedTime(selectedTime === t.value ? '' : t.value)}
                    className={`py-3 rounded-xl text-center border transition-all ${
                      selectedTime === t.value
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{t.sub}</p>
                  </button>
                ))}
              </div>
              <input type="hidden" name="preferred_time" value={selectedTime} />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea id="notes" name="notes" rows={3} placeholder="Any additional details about your vehicle or issue..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none" />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-red-600 text-white rounded-lg py-3.5 font-bold text-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Submitting...' : 'Request Booking'}
            </button>

            <p className="text-center text-xs text-gray-400">
              No payment required now. We&apos;ll confirm your appointment before any work begins.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
