'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export type LoginState = { error: string | null }

export async function signIn(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  // Check if this user is a technician
  const { data: tech } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', data.user.id)
    .single()

  redirect(tech ? '/tech' : '/admin')
}
