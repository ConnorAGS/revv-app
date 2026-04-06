'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function clockIn(jobId: string) {
  const supabase = await createServerSupabase()
  await supabase
    .from('bookings')
    .update({ clocked_in_at: new Date().toISOString(), status: 'in_progress' })
    .eq('id', jobId)
  revalidatePath(`/tech/jobs/${jobId}`)
  revalidatePath('/tech')
}

export async function clockOut(jobId: string) {
  const supabase = await createServerSupabase()
  await supabase
    .from('bookings')
    .update({ clocked_out_at: new Date().toISOString() })
    .eq('id', jobId)
  revalidatePath(`/tech/jobs/${jobId}`)
}

export async function markComplete(jobId: string) {
  const supabase = await createServerSupabase()
  await supabase
    .from('bookings')
    .update({ status: 'completed', clocked_out_at: new Date().toISOString() })
    .eq('id', jobId)
  revalidatePath(`/tech/jobs/${jobId}`)
  revalidatePath('/tech')
}

export async function toggleChecklistItem(itemId: string, completed: boolean, jobId: string) {
  const supabase = await createServerSupabase()
  await supabase
    .from('checklist_items')
    .update({ completed })
    .eq('id', itemId)
  revalidatePath(`/tech/jobs/${jobId}`)
}

export async function requestPart(jobId: string, formData: FormData) {
  const supabase = await createServerSupabase()
  await supabase.from('parts_requests').insert({
    booking_id: jobId,
    name: formData.get('name') as string,
    brand: (formData.get('brand') as string) || null,
    qty: parseInt(formData.get('qty') as string) || 1,
    status: 'needed',
  })
  revalidatePath(`/tech/jobs/${jobId}`)
  revalidatePath('/tech/parts')
}

export async function updatePartStatus(partId: string, status: string, jobId: string) {
  const supabase = await createServerSupabase()
  await supabase.from('parts_requests').update({ status }).eq('id', partId)
  revalidatePath(`/tech/jobs/${jobId}`)
  revalidatePath('/tech/parts')
}

export async function uploadPhoto(jobId: string, formData: FormData, type: 'before' | 'after') {
  const supabase = await createServerSupabase()
  const file = formData.get('photo') as File
  if (!file || file.size === 0) return

  const ext = file.name.split('.').pop()
  const path = `${jobId}/${type}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('job-photos')
    .upload(path, file, { upsert: true })

  if (error) return

  const { data: { publicUrl } } = supabase.storage
    .from('job-photos')
    .getPublicUrl(path)

  const field = type === 'before' ? 'photo_before' : 'photo_after'
  await supabase.from('bookings').update({ [field]: publicUrl }).eq('id', jobId)
  revalidatePath(`/tech/jobs/${jobId}`)
}

export async function acceptJob(jobId: string, techId: string): Promise<boolean> {
  const supabase = await createServerSupabase()

  // Only accept if still unassigned (race condition protection)
  const { data: job } = await supabase
    .from('bookings')
    .select('assigned_to')
    .eq('id', jobId)
    .single()

  if (job?.assigned_to) return false // Already taken

  const { error } = await supabase
    .from('bookings')
    .update({
      assigned_to: techId,
      accepted_by: techId,
      accepted_at: new Date().toISOString(),
      status: 'confirmed',
    })
    .eq('id', jobId)
    .is('assigned_to', null) // Double-check in the update itself

  if (error) return false

  revalidatePath('/tech')
  revalidatePath('/tech/available')
  return true
}

export async function updateTechLocation(techId: string, latitude: number, longitude: number) {
  const supabase = await createServerSupabase()
  await supabase
    .from('technicians')
    .update({ latitude, longitude })
    .eq('id', techId)
}

export async function postJobUpdate(jobId: string, formData: FormData) {
  const supabase = await createServerSupabase()
  const message = (formData.get('message') as string | null)?.trim() || null
  const file = formData.get('photo') as File | null

  let photo_url: string | null = null

  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()
    const path = `${jobId}/update-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(path)
      photo_url = publicUrl
    }
  }

  if (!message && !photo_url) return

  await supabase.from('job_updates').insert({ booking_id: jobId, message, photo_url })
  revalidatePath(`/tech/jobs/${jobId}`)
}

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/login')
}
