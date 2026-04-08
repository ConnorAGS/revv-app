'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function addCustomerVehicle(phone: string, formData: FormData) {
  const supabase = await createServerSupabase()
  const year = (formData.get('year') as string) || null
  const make = (formData.get('make') as string) || null
  const model = (formData.get('model') as string) || null
  const notes = (formData.get('notes') as string) || null

  await supabase.from('customer_vehicles').insert({
    customer_phone: phone.replace(/\D/g, ''),
    year,
    make,
    model,
    notes,
  })

  revalidatePath('/admin/customers', 'page')
}
