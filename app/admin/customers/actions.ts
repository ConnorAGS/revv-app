'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function addCustomerVehicle(phone: string, formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createServerSupabase()

  const { error } = await supabase.from('customer_vehicles').insert({
    customer_phone: phone.replace(/\D/g, ''),
    year:          (formData.get('year') as string) || null,
    make:          (formData.get('make') as string) || null,
    model:         (formData.get('model') as string) || null,
    trim:          (formData.get('trim') as string) || null,
    color:         (formData.get('color') as string) || null,
    license_plate: (formData.get('license_plate') as string) || null,
    vin:           (formData.get('vin') as string) || null,
    mileage:       formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null,
    engine:        (formData.get('engine') as string) || null,
    notes:         (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/customers', 'page')
  return { error: null }
}
