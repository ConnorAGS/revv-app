'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateJobStatus(jobId: string, status: string) {
  const supabase = await createServerSupabase()
  await supabase.from('bookings').update({ status }).eq('id', jobId)
  revalidatePath('/admin')
}

export async function assignTechnician(jobId: string, technicianId: string) {
  const supabase = await createServerSupabase()
  await supabase
    .from('bookings')
    .update({ assigned_to: technicianId || null })
    .eq('id', jobId)
  revalidatePath('/admin')
}

export async function updateJobPriceAndDuration(jobId: string, price: number | null, estimatedMinutes: number | null) {
  const supabase = await createServerSupabase()
  await supabase
    .from('bookings')
    .update({ price, estimated_duration_minutes: estimatedMinutes })
    .eq('id', jobId)
  revalidatePath('/admin')
}

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/login')
}
