import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { JobTracker } from './JobTracker'
import { SiteNav } from '@/components/SiteNav'

export default async function TrackJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, name, phone, service_type, vehicle_year, vehicle_make, vehicle_model, address, notes, status, clocked_in_at, clocked_out_at, created_at, price, estimated_duration_minutes, assigned_to, photo_before, photo_after')
    .eq('id', id)
    .single()

  if (!booking) notFound()

  // Fetch the assigned technician if there is one
  let technician = null
  if (booking.assigned_to) {
    const { data: tech } = await supabase
      .from('technicians')
      .select('name, phone')
      .eq('id', booking.assigned_to)
      .single()
    technician = tech
  }

  return (
    <div>
      <SiteNav />
      <JobTracker initialBooking={booking} technician={technician} />
    </div>
  )
}
