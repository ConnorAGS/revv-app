import { createServerSupabase } from '@/lib/supabase-server'
import { signOut } from './actions'
import { JobsTable } from './JobsTable'
import type { Booking, Technician } from './JobsTable'

const STATS = [
  { label: 'Pending', key: 'pending', color: 'text-yellow-600' },
  { label: 'In Progress', key: 'in_progress', color: 'text-purple-600' },
  { label: 'Completed', key: 'completed', color: 'text-green-600' },
]

export default async function AdminPage() {
  const supabase = await createServerSupabase()

  const [{ data: bookings, error }, { data: technicians }] = await Promise.all([
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('technicians').select('id, name, active').eq('active', true).order('name'),
  ])

  const counts = STATS.map((s) => ({
    ...s,
    count: bookings?.filter((b: Booking) => b.status === s.key).length ?? 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">{bookings?.length ?? 0} total bookings</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/book"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors"
            >
              + New Booking
            </a>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
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

        <JobsTable
          bookings={(bookings as Booking[]) ?? []}
          technicians={(technicians as Technician[]) ?? []}
        />
      </div>
    </div>
  )
}
