import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { AvailableJobs } from './AvailableJobs'

export default async function AvailablePage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tech } = await supabase
    .from('technicians')
    .select('id, name, latitude, longitude')
    .eq('user_id', user.id)
    .single()

  if (!tech) redirect('/login')

  // Fetch all unassigned pending jobs with coordinates
  const { data: jobs } = await supabase
    .from('bookings')
    .select('id, name, service_type, vehicle_year, vehicle_make, vehicle_model, address, latitude, longitude, price, estimated_duration_minutes, created_at')
    .is('assigned_to', null)
    .eq('status', 'pending')
    .not('latitude', 'is', null)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Available Jobs</h1>
        <p className="text-sm text-gray-500">Within 25 miles · First to accept wins</p>
      </div>
      <AvailableJobs
        jobs={jobs ?? []}
        techId={tech.id}
        techLat={tech.latitude}
        techLng={tech.longitude}
      />
    </div>
  )
}
