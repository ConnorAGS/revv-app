'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type TechActionState = { error: string | null; success: boolean }

export async function createTechnician(
  _prev: TechActionState,
  formData: FormData
): Promise<TechActionState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  const admin = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return { error: authError.message, success: false }

  // Create technician record
  const { error: dbError } = await admin.from('technicians').insert({
    name,
    email,
    phone,
    user_id: authData.user.id,
    status: 'active',
  })

  if (dbError) {
    // Roll back the auth user
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: dbError.message, success: false }
  }

  revalidatePath('/admin/technicians', 'page')
  revalidatePath('/admin', 'page')
  return { success: true, error: null }
}

export async function deleteTechnician(techId: string, userId: string) {
  const admin = createAdminClient()
  await admin.from('technicians').delete().eq('id', techId)
  await admin.auth.admin.deleteUser(userId)
  revalidatePath('/admin/technicians')
}

export async function updateTechStatus(techId: string, status: string) {
  const supabase = await createServerSupabase()
  await supabase.from('technicians').update({ status }).eq('id', techId)
  revalidatePath('/admin/technicians')
}
