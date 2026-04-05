import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { TechMap } from './TechMap'

export default async function TechMapPage() {
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
    .select('id, name, service_type, address, status, latitude, longitude')
    .eq('assigned_to', tech.id)
    .not('status', 'in', '("completed","cancelled")')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Map</h1>
        <p className="text-sm text-gray-500">{jobs?.length ?? 0} active jobs</p>
      </div>
      <TechMap jobs={jobs ?? []} />
    </div>
  )
}
