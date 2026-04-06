'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Update = {
  id: string
  message: string | null
  photo_url: string | null
  created_at: string
}

type Booking = {
  id: string
  name: string
  phone: string
  service_type: string
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  address: string
  notes: string | null
  status: string
  clocked_in_at: string | null
  clocked_out_at: string | null
  created_at: string
  price: number | null
  estimated_duration_minutes: number | null
  photo_before: string | null
  photo_after: string | null
}

type Technician = {
  name: string
  phone: string
}

const STEPS = [
  { key: 'pending',     label: 'Booking\nReceived',  icon: '📋' },
  { key: 'confirmed',   label: 'Confirmed',           icon: '✅' },
  { key: 'en_route',   label: 'Tech\nEn Route',      icon: '🚗' },
  { key: 'in_progress', label: 'In\nProgress',       icon: '🔧' },
  { key: 'completed',   label: 'Complete',            icon: '🎉' },
]

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    in_progress: 3,
    completed: 4,
    cancelled: -1,
  }
  return map[status] ?? 0
}

function LiveTimer({ clockedInAt }: { clockedInAt: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = new Date(clockedInAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [clockedInAt])
  const m = Math.floor(elapsed / 60)
  const h = Math.floor(m / 60)
  return <span>{h > 0 ? `${h}h ${m % 60}m` : `${m}m`}</span>
}

export function JobTracker({
  initialBooking,
  technician,
  initialUpdates,
}: {
  initialBooking: Booking
  technician: Technician | null
  initialUpdates: Update[]
}) {
  const [booking, setBooking] = useState(initialBooking)
  const [updates, setUpdates] = useState<Update[]>(initialUpdates)

  useEffect(() => {
    const supabase = createClient()

    const bookingChannel = supabase
      .channel(`booking-${booking.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${booking.id}` },
        (payload) => setBooking(payload.new as Booking)
      )
      .subscribe()

    const updatesChannel = supabase
      .channel(`updates-${booking.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_updates', filter: `booking_id=eq.${booking.id}` },
        (payload) => setUpdates(prev => [...prev, payload.new as Update])
      )
      .subscribe()

    return () => {
      supabase.removeChannel(bookingChannel)
      supabase.removeChannel(updatesChannel)
    }
  }, [booking.id])

  const stepIndex = getStepIndex(booking.status)
  const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(' ')
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`
  const isCancelled = booking.status === 'cancelled'
  const hasPhotos = booking.photo_before || booking.photo_after

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/track" className="text-red-600 text-sm font-medium">← Back</Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{booking.service_type}</h1>
            <p className="text-sm text-gray-500">{new Date(booking.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Status tracker */}
        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-red-700 font-semibold">This booking was cancelled</p>
            <Link href="/book" className="inline-block mt-3 text-sm text-red-600 underline">Book a new service</Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900">Job Status</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs text-gray-400">Live</p>
              </div>
            </div>

            {/* Step bar */}
            <div className="flex items-start mt-4 relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 mx-4" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-red-600 transition-all duration-700 mx-4"
                style={{ width: stepIndex === 0 ? '0%' : `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((step, i) => {
                const done = i < stepIndex
                const active = i === stepIndex
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all duration-500 ${
                      done ? 'bg-red-600 border-red-600 text-white' :
                      active ? 'bg-white border-red-600 shadow-md' :
                      'bg-white border-gray-200'
                    }`}>
                      {done ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{step.icon}</span>
                      )}
                    </div>
                    <p className={`text-[10px] text-center mt-1.5 leading-tight whitespace-pre-line ${
                      active ? 'text-red-600 font-semibold' : done ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Status message */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              {booking.status === 'pending' && (
                <p className="text-sm text-gray-600 text-center">We&apos;ve received your booking and will confirm shortly.</p>
              )}
              {booking.status === 'confirmed' && (
                <p className="text-sm text-gray-600 text-center">Your booking is confirmed! A technician has been assigned.</p>
              )}
              {booking.status === 'in_progress' && booking.clocked_in_at && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Time in progress</p>
                  <p className="text-2xl font-bold text-red-600"><LiveTimer clockedInAt={booking.clocked_in_at} /></p>
                  {booking.estimated_duration_minutes && (
                    <p className="text-xs text-gray-400 mt-1">Est. total: {booking.estimated_duration_minutes} min</p>
                  )}
                </div>
              )}
              {booking.status === 'completed' && (
                <div className="text-center">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="text-sm font-semibold text-gray-900">Your car is ready!</p>
                  <p className="text-sm text-gray-500 mt-0.5">Thanks for choosing Revv.</p>
                  {booking.price && (
                    <p className="text-lg font-bold text-gray-900 mt-2">Total: ${booking.price}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technician card */}
        {technician && booking.status !== 'pending' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Technician</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {technician.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{technician.name}</p>
                <p className="text-sm text-gray-400">Certified Technician</p>
              </div>
              <a
                href={`tel:${technician.phone}`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
              >
                Call
              </a>
            </div>
          </div>
        )}

        {/* Live updates feed */}
        {updates.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Live Updates</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs text-gray-400">Live</p>
              </div>
            </div>
            <div className="space-y-4">
              {[...updates].reverse().map((u, i) => (
                <div key={u.id} className={`flex gap-3 ${i !== 0 ? 'pt-4 border-t border-gray-50' : ''}`}>
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5" />
                    {i < updates.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(u.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {' · '}
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {u.message && <p className="text-sm text-gray-800 leading-snug">{u.message}</p>}
                    {u.photo_url && (
                      <img
                        src={u.photo_url}
                        alt="Job update"
                        className="w-full rounded-xl object-cover max-h-56 mt-2"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job photos */}
        {hasPhotos && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Job Photos</p>
            <div className="grid grid-cols-2 gap-3">
              {booking.photo_before && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Before</p>
                  <img src={booking.photo_before} alt="Before" className="w-full rounded-xl object-cover aspect-square" />
                </div>
              )}
              {booking.photo_after && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">After</p>
                  <img src={booking.photo_after} alt="After" className="w-full rounded-xl object-cover aspect-square" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Job details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Job Details</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Service</span>
              <span className="font-medium text-gray-900">{booking.service_type}</span>
            </div>
            {vehicle && (
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium text-gray-900">{vehicle}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 shrink-0">Location</span>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-red-600 text-right truncate">{booking.address}</a>
            </div>
            {booking.notes && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Notes</span>
                <span className="font-medium text-gray-900 text-right">{booking.notes}</span>
              </div>
            )}
          </div>
        </div>

        {booking.status === 'completed' && (
          <Link href="/book" className="block text-center bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-500 transition-colors">
            Book Again
          </Link>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">
          Booking ID: {booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  )
}
