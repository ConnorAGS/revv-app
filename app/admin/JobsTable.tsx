'use client'

import { useTransition, useState } from 'react'
import { updateJobStatus, assignTechnician, updateJobPriceAndDuration } from './actions'

export type Technician = {
  id: string
  name: string
  status: string
  latitude: number | null
  longitude: number | null
}

export type Booking = {
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
}

const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

function vehicle(b: Booking) {
  return [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(' ') || '—'
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestTech(booking: Booking, technicians: Technician[]): { tech: Technician; miles: number } | null {
  if (!booking.latitude || !booking.longitude) return null
  const candidates = technicians.filter(t => t.latitude && t.longitude && !t.status?.includes('inactive'))
  if (!candidates.length) return null
  let best = candidates[0]
  let bestDist = haversine(booking.latitude, booking.longitude, best.latitude!, best.longitude!)
  for (const t of candidates.slice(1)) {
    const d = haversine(booking.latitude, booking.longitude, t.latitude!, t.longitude!)
    if (d < bestDist) { best = t; bestDist = d }
  }
  return { tech: best, miles: Math.round(bestDist * 10) / 10 }
}

function StatusSelect({ booking }: { booking: Booking }) {
  const [isPending, startTransition] = useTransition()
  return (
    <select
      value={booking.status}
      disabled={isPending}
      onChange={(e) => startTransition(() => updateJobStatus(booking.id, e.target.value))}
      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 disabled:opacity-60 ${
        STATUS_STYLES[booking.status] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace('_', ' ')}</option>
      ))}
    </select>
  )
}

function TechnicianSelect({ booking, technicians }: { booking: Booking; technicians: Technician[] }) {
  const [isPending, startTransition] = useTransition()
  return (
    <select
      value={booking.assigned_to ?? ''}
      disabled={isPending}
      onChange={(e) => startTransition(() => assignTechnician(booking.id, e.target.value))}
      className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 w-full max-w-[140px]"
    >
      <option value="">Unassigned</option>
      {technicians.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
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

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-left group">
        <p className="text-sm font-medium text-gray-900">
          {booking.price ? `$${booking.price}` : <span className="text-gray-300">—</span>}
        </p>
        <p className="text-xs text-gray-400">
          {booking.estimated_duration_minutes ? `${booking.estimated_duration_minutes}min` : <span className="text-gray-300">no est.</span>}
        </p>
        <p className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit</p>
      </button>
    )
  }

  return (
    <div className="space-y-1.5 min-w-[100px]">
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price $"
        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="Min (e.g. 90)"
        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <div className="flex gap-1">
        <button onClick={save} disabled={isPending} className="flex-1 bg-blue-600 text-white rounded px-2 py-1 text-xs font-medium disabled:opacity-50">Save</button>
        <button onClick={() => setEditing(false)} className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs text-gray-500">Cancel</button>
      </div>
    </div>
  )
}

export function JobsTable({ bookings, technicians }: { bookings: Booking[]; technicians: Technician[] }) {
  if (!bookings.length) {
    return <p className="text-center text-gray-400 py-16">No bookings yet.</p>
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {bookings.map((b) => (
          <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{b.name}</p>
                <p className="text-sm text-gray-500">{b.phone}</p>
                {b.email && <p className="text-xs text-gray-400">{b.email}</p>}
              </div>
              <StatusSelect booking={b} />
            </div>
            <p className="text-sm font-medium text-blue-700 mb-1">{b.service_type}</p>
            <p className="text-sm text-gray-600">{vehicle(b)}</p>
            <p className="text-sm text-gray-500 mt-1 truncate">{b.address}</p>
            {!b.assigned_to && (() => {
              const suggestion = nearestTech(b, technicians)
              return suggestion ? (
                <p className="text-xs text-blue-600 mt-1">
                  📍 Nearest: {suggestion.tech.name} ({suggestion.miles} mi)
                </p>
              ) : null
            })()}
            <div className="mt-3 flex items-center gap-3">
              <TechnicianSelect booking={b} technicians={technicians} />
              <PriceEditor booking={b} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-5 py-3.5 font-semibold text-gray-600">Customer</th>
              <th className="px-5 py-3.5 font-semibold text-gray-600">Service</th>
              <th className="px-5 py-3.5 font-semibold text-gray-600">Vehicle</th>
              <th className="px-5 py-3.5 font-semibold text-gray-600">Address</th>
              <th className="px-5 py-3.5 font-semibold text-gray-600">Price / Est.</th>
              <th className="px-5 py-3.5 font-semibold text-gray-600">Assign / Suggestion</th>
              <th className="px-5 py-3.5 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{b.name}</p>
                  <p className="text-gray-500">{b.phone}</p>
                  {b.email && <p className="text-gray-400 text-xs">{b.email}</p>}
                </td>
                <td className="px-5 py-4 text-blue-700 font-medium">{b.service_type}</td>
                <td className="px-5 py-4 text-gray-700">{vehicle(b)}</td>
                <td className="px-5 py-4 text-gray-600 max-w-xs">
                  <span className="truncate block">{b.address}</span>
                </td>
                <td className="px-5 py-4">
                  <PriceEditor booking={b} />
                </td>
                <td className="px-5 py-4">
                  <TechnicianSelect booking={b} technicians={technicians} />
                  {!b.assigned_to && (() => {
                    const suggestion = nearestTech(b, technicians)
                    return suggestion ? (
                      <p className="text-xs text-blue-500 mt-1">
                        📍 {suggestion.tech.name} · {suggestion.miles} mi
                      </p>
                    ) : null
                  })()}
                </td>
                <td className="px-5 py-4">
                  <StatusSelect booking={b} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
