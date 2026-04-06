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
  const [techResult, updatesResult] = await Promise.all([
    booking.assigned_to
      ? supabase.from('technicians').select('name, phone').eq('id', booking.assigned_to).single()
      : Promise.resolve({ data: null }),
    supabase.from('job_updates').select('id, message, photo_url, created_at').eq('booking_id', id).order('created_at'),
  ])

  return (
    <div>
      <SiteNav />
      <JobTracker
        initialBooking={booking}
        technician={techResult.data}
        initialUpdates={updatesResult.data ?? []}
      />
    </div>
  )
}
