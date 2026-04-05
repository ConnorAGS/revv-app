import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

const STATUS_STYLES: Record<string, string> = {
  on_truck: 'bg-green-100 text-green-800',
  incoming: 'bg-blue-100 text-blue-800',
  needed: 'bg-red-100 text-red-800',
  ordered: 'bg-yellow-100 text-yellow-800',
}

const STATUS_LABELS: Record<string, string> = {
  on_truck: 'On truck',
  incoming: 'Incoming',
  needed: 'Not ordered',
  ordered: 'Ordered',
}

const SECTIONS = [
  { key: 'on_truck', label: 'On Truck' },
  { key: 'incoming', label: 'Incoming' },
  { key: 'needed', label: 'Need to Request' },
  { key: 'ordered', label: 'Ordered' },
]

export default async function PartsPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tech } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!tech) redirect('/login')

  // Get all parts for this tech's assigned active jobs
  const { data: jobs } = await supabase
    .from('bookings')
    .select('id, service_type, name')
    .eq('assigned_to', tech.id)
    .not('status', 'in', '("completed","cancelled")')

  const jobIds = jobs?.map(j => j.id) ?? []

  const { data: parts } = jobIds.length
    ? await supabase
        .from('parts_requests')
        .select('*, booking_id')
        .in('booking_id', jobIds)
        .order('created_at')
    : { data: [] }

  const jobMap = Object.fromEntries((jobs ?? []).map(j => [j.id, j]))

  const activeCount = parts?.filter(p => p.status !== 'on_truck').length ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Parts</h1>
        <p className="text-sm text-gray-500">Today's jobs · {activeCount} active</p>
      </div>

      <div className="px-4 py-4 space-y-5">
        {SECTIONS.map(({ key, label }) => {
          const sectionParts = parts?.filter(p => p.status === key) ?? []
          if (sectionParts.length === 0) return null

          return (
            <div key={key}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {sectionParts.map((part) => {
                  const job = jobMap[part.booking_id]
                  return (
                    <div key={part.id} className="flex items-center justify-between px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{part.name}</p>
                        <p className="text-xs text-gray-400">
                          {part.brand ? `${part.brand} · ` : ''}Qty {part.qty}
                          {job ? ` · ${job.service_type}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ml-3 ${STATUS_STYLES[part.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[part.status] ?? part.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {(!parts || parts.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No parts logged</p>
            <p className="text-sm mt-1">Add parts from a job detail page.</p>
          </div>
        )}
      </div>
    </div>
  )
}
