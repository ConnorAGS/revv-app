'use client'

import { useState } from 'react'
import Link from 'next/link'

type Booking = {
  id: string
  name: string
  phone: string
  email: string | null
  status: string
  price: number | null
  service_type: string
  created_at: string
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
}

type Customer = {
  name: string
  phone: string
  email: string | null
  totalBookings: number
  completedJobs: number
  totalSpent: number
  lastBookingAt: string
  services: string[]
  bookings: Booking[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'spent' | 'jobs'>('recent')

  const filtered = customers
    .filter(c => {
      const q = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent
      if (sortBy === 'jobs') return b.totalBookings - a.totalBookings
      return new Date(b.lastBookingAt).getTime() - new Date(a.lastBookingAt).getTime()
    })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="flex gap-1 shrink-0">
          {([['recent', 'Recent'], ['spent', 'Top Spend'], ['jobs', 'Most Jobs']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                sortBy === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">No customers found</p>
          {search && <p className="text-sm mt-1">Try a different search</p>}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((customer) => {
            const key = customer.phone.replace(/\D/g, '')
            const isExpanded = expanded === key
            const initials = customer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

            return (
              <div key={key}>
                {/* Customer row */}
                <div
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : key)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>

                  {/* Name + contact */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a
                        href={`tel:${customer.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                      >
                        {customer.phone}
                      </a>
                      {customer.email && (
                        <>
                          <span className="text-gray-300">·</span>
                          <a
                            href={`mailto:${customer.email}`}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors truncate"
                          >
                            {customer.email}
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{customer.totalBookings}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Jobs</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-600">${customer.totalSpent.toFixed(0)}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Spent</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(customer.lastBookingAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Last job</p>
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded booking history */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Booking History</p>
                      <Link
                        href={`/book`}
                        className="text-xs text-red-600 font-semibold hover:text-red-500 transition-colors"
                      >
                        + New Booking
                      </Link>
                    </div>
                    {customer.bookings.map(b => {
                      const vehicle = [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(' ')
                      return (
                        <div key={b.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{b.service_type}</p>
                              {b.price && <p className="text-xs font-bold text-green-600">${b.price}</p>}
                            </div>
                            {vehicle && <p className="text-xs text-gray-400">{vehicle}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-700'}`}>
                              {b.status.replace('_', ' ')}
                            </span>
                            <Link
                              href={`/track/${b.id}`}
                              className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                            >
                              View →
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
