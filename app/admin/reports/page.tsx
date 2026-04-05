import { createServerSupabase } from '@/lib/supabase-server'

type CompletedJob = {
  service_type: string
  estimated_duration_minutes: number | null
  clocked_in_at: string | null
  clocked_out_at: string | null
  price: number | null
  assigned_to: string | null
}

type TechRow = {
  id: string
  name: string
}

function calcActualMinutes(job: CompletedJob): number | null {
  if (!job.clocked_in_at || !job.clocked_out_at) return null
  const diff = new Date(job.clocked_out_at).getTime() - new Date(job.clocked_in_at).getTime()
  return Math.round(diff / 1000 / 60)
}

function fmt(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default async function ReportsPage() {
  const supabase = await createServerSupabase()

  const [{ data: jobs }, { data: techs }] = await Promise.all([
    supabase
      .from('bookings')
      .select('service_type, estimated_duration_minutes, clocked_in_at, clocked_out_at, price, assigned_to')
      .eq('status', 'completed'),
    supabase.from('technicians').select('id, name').order('name'),
  ])

  const completedJobs = (jobs ?? []) as CompletedJob[]
  const techMap = Object.fromEntries((techs ?? []).map((t: TechRow) => [t.id, t.name]))

  // Book of hours — group by service type
  const byService: Record<string, { actuals: number[]; estimates: number[]; revenue: number[] }> = {}
  for (const job of completedJobs) {
    if (!byService[job.service_type]) {
      byService[job.service_type] = { actuals: [], estimates: [], revenue: [] }
    }
    const actual = calcActualMinutes(job)
    if (actual !== null && actual > 0 && actual < 600) byService[job.service_type].actuals.push(actual)
    if (job.estimated_duration_minutes) byService[job.service_type].estimates.push(job.estimated_duration_minutes)
    if (job.price) byService[job.service_type].revenue.push(job.price)
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  const serviceStats = Object.entries(byService)
    .map(([type, data]) => ({
      type,
      jobCount: Math.max(data.actuals.length, data.estimates.length, data.revenue.length),
      avgActual: avg(data.actuals),
      avgEstimate: avg(data.estimates),
      avgRevenue: avg(data.revenue),
      totalRevenue: data.revenue.reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.jobCount - a.jobCount)

  // Tech performance
  const byTech: Record<string, { actuals: number[]; jobCount: number; revenue: number }> = {}
  for (const job of completedJobs) {
    if (!job.assigned_to) continue
    if (!byTech[job.assigned_to]) byTech[job.assigned_to] = { actuals: [], jobCount: 0, revenue: 0 }
    byTech[job.assigned_to].jobCount++
    const actual = calcActualMinutes(job)
    if (actual !== null && actual > 0 && actual < 600) byTech[job.assigned_to].actuals.push(actual)
    if (job.price) byTech[job.assigned_to].revenue += job.price
  }

  const techStats = Object.entries(byTech)
    .map(([id, data]) => ({
      name: techMap[id] ?? 'Unknown',
      jobCount: data.jobCount,
      avgActual: avg(data.actuals),
      revenue: data.revenue,
    }))
    .sort((a, b) => b.jobCount - a.jobCount)

  const totalRevenue = completedJobs.reduce((sum, j) => sum + (j.price ?? 0), 0)
  const totalJobs = completedJobs.length
  const jobsWithTimes = completedJobs.filter(j => calcActualMinutes(j) !== null)
  const allActuals = jobsWithTimes.map(j => calcActualMinutes(j)!)
  const overallAvg = avg(allActuals)

  return (
    <div className="py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Book of hours · performance · revenue</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
            <p className="text-xs text-gray-500 mt-1">Jobs Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {overallAvg ? fmt(overallAvg) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Avg Job Time</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {totalJobs ? `$${(totalRevenue / totalJobs).toFixed(0)}` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Avg Ticket</p>
          </div>
        </div>

        {/* Book of hours by service */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Book of Hours — By Service</h2>
          {serviceStats.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
              No completed jobs yet. Data will appear here as jobs are completed.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-5 py-3 font-semibold text-gray-600">Service</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Jobs</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Avg Actual</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Avg Estimate</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Accuracy</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Avg Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {serviceStats.map((s) => {
                    const accuracy = s.avgActual && s.avgEstimate
                      ? Math.round((1 - Math.abs(s.avgActual - s.avgEstimate) / s.avgEstimate) * 100)
                      : null
                    return (
                      <tr key={s.type} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{s.type}</td>
                        <td className="px-5 py-3.5 text-gray-600">{s.jobCount}</td>
                        <td className="px-5 py-3.5 text-gray-900 font-medium">
                          {s.avgActual ? fmt(s.avgActual) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          {s.avgEstimate ? fmt(s.avgEstimate) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          {accuracy !== null ? (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              accuracy >= 80 ? 'bg-green-100 text-green-700' :
                              accuracy >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {accuracy}%
                            </span>
                          ) : <span className="text-gray-300 text-xs">no data</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-900">
                          {s.avgRevenue ? `$${s.avgRevenue.toFixed(0)}` : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tech performance */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Technician Performance</h2>
          {techStats.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
              No tech data yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-5 py-3 font-semibold text-gray-600">Technician</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Jobs Done</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Avg Time</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {techStats.map((t) => (
                    <tr key={t.name} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {t.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span className="font-medium text-gray-900">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{t.jobCount}</td>
                      <td className="px-5 py-3.5 text-gray-900 font-medium">
                        {t.avgActual ? fmt(t.avgActual) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-green-600 font-semibold">
                        ${t.revenue.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
