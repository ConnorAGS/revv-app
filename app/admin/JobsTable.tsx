'use client'

import { useTransition } from 'react'
import { updateJobStatus, assignTechnician } from './actions'

export type Technician = {
  id: string
  name: string
  active: boolean
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
  notes: string | null
  status: string
  assigned_to: string | null
  created_at: string
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
        <option key={s} value={s}>
          {s.replace('_', ' ')}
        </option>
      ))}
    </select>
  )
}

function TechnicianSelect({
  booking,
  technicians,
}: {
  booking: Booking
  technicians: Technician[]
}) {
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
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  )
}

export function JobsTable({
  bookings,
  technicians,
}: {
  bookings: Booking[]
  technicians: Technician[]
}) {
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
            <div className="mt-2">
              <TechnicianSelect booking={b} technicians={technicians} />
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
              <th className="px-5 py-3.5 font-semibold text-gray-600">Assigned To</th>
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
                  <TechnicianSelect booking={b} technicians={technicians} />
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
