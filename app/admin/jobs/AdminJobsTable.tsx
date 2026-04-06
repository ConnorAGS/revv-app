'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { updateJobStatus, assignTechnician, updateJobPriceAndDuration } from '../actions'

type Technician = {
  id: string
  name: string
  status: string
  latitude: number | null
  longitude: number | null
}

type Booking = {
  id: string
  name: string
  phone: string
  email: string | null
  service_type: string
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  address: string
  latitude: number | null
  longitude: number | null
  notes: string | null
  status: string
  assigned_to: string | null
  created_at: string
  price: number | null
  estimated_duration_minutes: number | null
  clocked_in_at: string | null
  clocked_out_at: string | null
}

type Stat = { label: string; key: string; count: number; color: string }

const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestTech(b: Booking, techs: Technician[]) {
  if (!b.latitude || !b.longitude) return null
  const active = techs.filter(t => t.latitude && t.longitude)
  if (!active.length) return null
  return active.reduce((best, t) => {
    const d = haversine(b.latitude!, b.longitude!, t.latitude!, t.longitude!)
    const bd = haversine(b.latitude!, b.longitude!, best.latitude!, best.longitude!)
    return d < bd ? t : best
  })
}

function StatusSelect({ booking }: { booking: Booking }) {
  const [isPending, startTransition] = useTransition()
  return (
    <select
      value={booking.status}
      disabled={isPending}
      onChange={e => startTransition(() => updateJobStatus(booking.id, e.target.value))}
      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 disabled:opacity-60 ${STATUS_STYLES[booking.status] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
    </select>
  )
}

function TechSelect({ booking, technicians }: { booking: Booking; technicians: Technician[] }) {
  const [isPending, startTransition] = useTransition()
  return (
    <select
      value={booking.assigned_to ?? ''}
      disabled={isPending}
      onChange={e => startTransition(() => assignTechnician(booking.id, e.target.value))}
      className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60 w-full max-w-[140px]"
    >
      <option value="">Unassigned</option>
      {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  )
}

function PriceEditor({ booking }: { booking: Booking }) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(booking.price?.toString() ?? '')
  const [duration, setDuration] = useState(booking.estimated_duration_minutes?.toString() ?? '')

  function save() {
    startTransition(() => updateJobPriceAndDuration(
      booking.id,
      price ? parseFloat(price) : null,
      duration ? parseInt(duration) : null,
    ))
    setEditing(false)
  }

  if (!editing) return (
    <button onClick={() => setEditing(true)} className="text-left group">
      <p className="text-sm font-medium text-gray-900">
        {booking.price ? `$${booking.price}` : <span className="text-gray-300">—</span>}
      </p>
      <p className="text-xs text-gray-400">
        {booking.estimated_duration_minutes ? `${booking.estimated_duration_minutes}min` : <span className="text-gray-300">no est.</span>}
      </p>
      <p className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit</p>
    </button>
  )

  return (
    <div className="space-y-1.5 min-w-[100px]">
      <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price $"
        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400" />
      <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Min"
        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400" />
      <div className="flex gap-1">
        <button onClick={save} disabled={isPending} className="flex-1 bg-red-600 text-white rounded px-2 py-1 text-xs font-medium disabled:opacity-50">Save</button>
        <button onClick={() => setEditing(false)} className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs text-gray-500">Cancel</button>
      </div>
    </div>
  )
}

export function AdminJobsTable({
  bookings,
  technicians,
  stats,
}: {
  bookings: Booking[]
  technicians: Technician[]
  stats: Stat[]
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = bookings
    .filter(b => activeTab === 'all' || b.status === activeTab)
    .filter(b => {
      const q = search.toLowerCase()
      if (!q) return true
      return (
        b.name.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.service_type.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        (b.email ?? '').toLowerCase().includes(q)
      )
    })

  const techById = Object.fromEntries(technicians.map(t => [t.id, t]))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Status tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 px-4 gap-1 pt-2">
        {stats.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveTab(s.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === s.key
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {s.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === s.key ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-50">
        <input
          type="text"
          placeholder="Search by name, phone, service, or address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">No jobs found</p>
          {search && <p className="text-sm mt-1">Try a different search</p>}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map(b => {
            const vehicle = [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(' ')
            const assignedTech = b.assigned_to ? techById[b.assigned_to] : null
            const suggestion = !b.assigned_to ? nearestTech(b, technicians) : null
            const isExpanded = expanded === b.id

            return (
              <div key={b.id}>
                {/* Row */}
                <div
                  className="flex items-start gap-4 px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : b.id)}
                >
                  {/* Left: customer + service */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                      <StatusSelect booking={b} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{b.phone}{b.email ? ` · ${b.email}` : ''}</p>
                    <p className="text-sm font-medium text-red-600 mt-1">{b.service_type}</p>
                    {vehicle && <p className="text-xs text-gray-400">{vehicle}</p>}
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{b.address}</p>
                  </div>

                  {/* Right: assign + price + date */}
                  <div className="shrink-0 text-right space-y-1.5" onClick={e => e.stopPropagation()}>
                    <PriceEditor booking={b} />
                    <TechSelect booking={b} technicians={technicians} />
                    {suggestion && (
                      <p className="text-[10px] text-blue-500">
                        📍 {suggestion.name}
                      </p>
                    )}
                    {assignedTech && (
                      <p className="text-[10px] text-green-600 font-medium">✓ {assignedTech.name}</p>
                    )}
                  </div>

                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Booked</span>
                        <span className="text-gray-700 text-xs">{new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      {b.clocked_in_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Clocked in</span>
                          <span className="text-gray-700 text-xs">{new Date(b.clocked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {b.clocked_out_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Clocked out</span>
                          <span className="text-gray-700 text-xs">{new Date(b.clocked_out_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {b.clocked_in_at && b.clocked_out_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Duration</span>
                          <span className="text-gray-700 text-xs font-medium">
                            {Math.round((new Date(b.clocked_out_at).getTime() - new Date(b.clocked_in_at).getTime()) / 60000)} min
                          </span>
                        </div>
                      )}
                    </div>
                    {b.notes && (
                      <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 mt-1">
                        <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                        <p className="text-xs text-gray-700">{b.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Link
                        href={`/track/${b.id}`}
                        target="_blank"
                        className="text-xs text-red-600 font-semibold hover:text-red-500 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        View tracker →
                      </Link>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400 font-mono">{b.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        {filtered.length} of {bookings.length} jobs
      </div>
    </div>
  )
}
