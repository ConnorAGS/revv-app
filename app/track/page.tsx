'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { PhoneInput } from '@/components/PhoneInput'

type Booking = {
  id: string
  service_type: string
  address: string
  status: string
  created_at: string
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Booking Received',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Complete',
  cancelled: 'Cancelled',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function TrackPage() {
  const [phone, setPhone] = useState('')
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function lookup() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return
    setLoading(true)
    setSearched(true)
    setError(null)

    const supabase = createClient()
    const { data, error: rpcError } = await supabase
      .rpc('search_bookings_by_phone', { search_phone: digits })

    if (rpcError) {
      // Fallback: direct query if RPC doesn't exist yet
      const { data: fallback } = await supabase
        .from('bookings')
        .select('id, service_type, address, status, created_at, vehicle_year, vehicle_make, vehicle_model')
        .or(`phone.eq.${phone.trim()},phone.eq.${digits},phone.eq.${digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}`)
        .order('created_at', { ascending: false })
      setBookings(fallback ?? [])
    } else {
      setBookings(data ?? [])
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav />

      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(220,38,38,0.3)]">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="font-display text-4xl text-gray-900 tracking-wide">Track Your Job</h1>
          <p className="text-gray-500 mt-1 text-sm">Enter the phone number you booked with</p>
        </div>

        {/* Phone lookup */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex gap-2">
            <PhoneInput
              name="phone"
              onChange={setPhone}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={lookup}
              disabled={loading || phone.replace(/\D/g, '').length < 10}
              className="bg-red-600 text-white font-bold px-5 py-3 rounded-xl text-sm hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Find'}
            </button>
          </div>
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
        </div>

        {/* Results */}
        {searched && !loading && bookings !== null && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="font-medium">No bookings found</p>
                <p className="text-sm mt-1">Check the number or <Link href="/book" className="text-red-600 underline">book a service</Link>.</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                </p>
                {bookings.map((b) => {
                  const vehicle = [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(' ')
                  return (
                    <Link
                      key={b.id}
                      href={`/track/${b.id}`}
                      className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{b.service_type}</p>
                          {vehicle && <p className="text-sm text-gray-500">{vehicle}</p>}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ml-2 ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABELS[b.status] ?? b.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{b.address}</p>
                      <p className="text-xs text-gray-300 mt-1">{new Date(b.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-red-600 font-medium mt-2">View details →</p>
                    </Link>
                  )
                })}
              </>
            )}
          </div>
        )}

        {!searched && (
          <div className="text-center py-8 text-gray-300">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">Enter your phone number above to find your booking</p>
          </div>
        )}
      </div>
    </div>
  )
}
