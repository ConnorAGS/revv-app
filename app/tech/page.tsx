import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { TechDashboard } from './TechDashboard'

export default async function TechPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tech } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!tech) redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: jobs } = await supabase
    .from('bookings')
    .select('id, name, phone, service_type, vehicle_year, vehicle_make, vehicle_model, address, latitude, longitude, status, price, estimated_duration_minutes, clocked_in_at, created_at')
    .eq('assigned_to', tech.id)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: true })

  return (
    <TechDashboard
      initialJobs={jobs ?? []}
      techId={tech.id}
      techName={tech.name}
    />
  )
}
