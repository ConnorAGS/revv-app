import { createServerSupabase } from '@/lib/supabase-server'
import { AdminJobsTable } from './AdminJobsTable'

export default async function AdminJobsPage() {
  const supabase = await createServerSupabase()

  const [{ data: bookings }, { data: technicians }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('technicians')
      .select('id, name, status, latitude, longitude')
      .order('name'),
  ])

  const b = bookings ?? []

  const stats = [
    { label: 'All',         key: 'all',         count: b.length,                                              color: 'text-gray-900' },
    { label: 'Pending',     key: 'pending',      count: b.filter(j => j.status === 'pending').length,         color: 'text-yellow-600' },
    { label: 'Confirmed',   key: 'confirmed',    count: b.filter(j => j.status === 'confirmed').length,       color: 'text-blue-600' },
    { label: 'In Progress', key: 'in_progress',  count: b.filter(j => j.status === 'in_progress').length,     color: 'text-purple-600' },
    { label: 'Completed',   key: 'completed',    count: b.filter(j => j.status === 'completed').length,       color: 'text-green-600' },
    { label: 'Cancelled',   key: 'cancelled',    count: b.filter(j => j.status === 'cancelled').length,       color: 'text-red-600' },
  ]

  const totalRevenue = b
    .filter(j => j.status === 'completed' && j.price)
    .reduce((sum, j) => sum + (j.price ?? 0), 0)

  return (
    <div className="py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            <p className="text-sm text-gray-500 mt-0.5">{b.length} total bookings</p>
          </div>
          <a
            href="/book"
            className="text-sm font-semibold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
          >
            + New Booking
          </a>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Revenue</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats[1].count}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats[3].count}</p>
            <p className="text-xs text-gray-500 mt-0.5">In Progress</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats[4].count}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completed</p>
          </div>
        </div>

        <AdminJobsTable
          bookings={b}
          technicians={technicians ?? []}
          stats={stats}
        />
      </div>
    </div>
  )
}
