import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function EarningsPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tech } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!tech) redirect('/login')

  const { data: jobs } = await supabase
    .from('bookings')
    .select('id, service_type, name, vehicle_year, vehicle_make, vehicle_model, price, status, created_at')
    .eq('assigned_to', tech.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  const total = jobs?.reduce((sum, j) => sum + (j.price ?? 0), 0) ?? 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayJobs = jobs?.filter(j => new Date(j.created_at) >= today) ?? []
  const todayTotal = todayJobs.reduce((sum, j) => sum + (j.price ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-sm text-gray-500">{jobs?.length ?? 0} completed jobs</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">${todayTotal.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">Today</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">${total.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
        </div>

        {/* Job history */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Completed Jobs</p>
        {!jobs?.length ? (
          <div className="text-center py-12 text-gray-400 text-sm">No completed jobs yet.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {jobs.map((job) => {
              const vehicle = [job.vehicle_year, job.vehicle_make, job.vehicle_model].filter(Boolean).join(' ')
              return (
                <div key={job.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.service_type}</p>
                    <p className="text-xs text-gray-400">{job.name}{vehicle ? ` · ${vehicle}` : ''}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 ml-3">
                    {job.price ? `$${job.price}` : '—'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
