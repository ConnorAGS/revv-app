import { createServerSupabase } from '@/lib/supabase-server'
import { AdminMapSection } from './AdminMapSection'
import { JobsTable } from './JobsTable'
import type { Booking, Technician } from './JobsTable'
import Link from 'next/link'

const STATS = [
  { label: 'Pending', key: 'pending', color: 'text-yellow-600' },
  { label: 'In Progress', key: 'in_progress', color: 'text-purple-600' },
  { label: 'Completed', key: 'completed', color: 'text-green-600' },
]

export default async function AdminPage() {
  const supabase = await createServerSupabase()

  const [{ data: bookings, error }, { data: technicians }] = await Promise.all([
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('technicians').select('id, name, status, latitude, longitude').order('name'),
  ])

  const activeTechs = technicians?.filter((t: Technician) => t.status === 'active') ?? []

  const counts = STATS.map((s) => ({
    ...s,
    count: bookings?.filter((b: Booking) => b.status === s.key).length ?? 0,
  }))

  return (
    <div className="py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">{bookings?.length ?? 0} total bookings</p>
          </div>
          <Link
            href="/book"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors self-start sm:self-auto"
          >
            + New Booking
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {counts.map((s) => (
            <div key={s.key} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            Failed to load bookings: {error.message}
          </div>
        )}

        <div className="mb-6">
          <AdminMapSection bookings={(bookings as Booking[]) ?? []} />
        </div>

        <JobsTable
          bookings={(bookings as Booking[]) ?? []}
          technicians={(activeTechs as Technician[])}
        />
      </div>
    </div>
  )
}
