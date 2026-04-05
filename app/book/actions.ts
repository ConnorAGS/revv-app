'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type BookingState = { success: boolean; error: string | null }

export async function submitBooking(
  _prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
  const supabase = await createServerSupabase()

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string | null
  const service_type = formData.get('service_type') as string
  const vehicle_year = formData.get('vehicle_year') as string | null
  const vehicle_make = formData.get('vehicle_make') as string | null
  const vehicle_model = formData.get('vehicle_model') as string | null
  const address = formData.get('address') as string
  const notes = formData.get('notes') as string | null

  const { error } = await supabase.from('bookings').insert({
    name,
    phone,
    email: email || null,
    service_type,
    vehicle_year: vehicle_year || null,
    vehicle_make: vehicle_make || null,
    vehicle_model: vehicle_model || null,
    address,
    notes: notes || null,
    status: 'pending',
  })

  if (error) return { success: false, error: error.message }

  if (email) {
    const vehicle = [vehicle_year, vehicle_make, vehicle_model].filter(Boolean).join(' ')
    await resend.emails.send({
      from: 'Revv <onboarding@resend.dev>',
      to: email,
      subject: 'Your Revv booking is confirmed',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#111">We got your booking, ${name}!</h2>
          <p style="color:#555">Here's a summary of your request:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 0;color:#888;width:40%">Service</td><td style="padding:8px 0;color:#111;font-weight:600">${service_type}</td></tr>
            ${vehicle ? `<tr><td style="padding:8px 0;color:#888">Vehicle</td><td style="padding:8px 0;color:#111;font-weight:600">${vehicle}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#888">Location</td><td style="padding:8px 0;color:#111;font-weight:600">${address}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Phone</td><td style="padding:8px 0;color:#111;font-weight:600">${phone}</td></tr>
          </table>
          <p style="color:#555">We'll reach out shortly to confirm your appointment time.</p>
          <p style="color:#888;font-size:13px;margin-top:32px">— The Revv Team</p>
        </div>
      `,
    })
  }

  return { success: true, error: null }
}
