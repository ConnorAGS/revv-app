'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { geocodeAddress } from '@/lib/geocode'
import { Resend } from 'resend'
import twilio from 'twilio'
import { SERVICE_MINIMUMS } from '@/lib/service-prices'

const resend = new Resend(process.env.RESEND_API_KEY)

export type BookingState = {
  success: boolean
  error: string | null
  bookingId?: string
  name?: string
  serviceType?: string
}

function getTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  return twilio(sid, token)
}

async function sendSMS(to: string, body: string) {
  const client = getTwilio()
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!client || !from) return
  const digits = to.replace(/\D/g, '')
  if (digits.length < 10) return
  const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`
  try {
    await client.messages.create({ to: e164, from, body })
  } catch {
    // SMS failure shouldn't break the booking
  }
}

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
  const preferred_date = formData.get('preferred_date') as string | null
  const preferred_time = formData.get('preferred_time') as string | null

  const [coords, { data: historicalJobs }] = await Promise.all([
    geocodeAddress(address),
    supabase
      .from('bookings')
      .select('clocked_in_at, clocked_out_at')
      .eq('service_type', service_type)
      .eq('status', 'completed')
      .not('clocked_in_at', 'is', null)
      .not('clocked_out_at', 'is', null),
  ])

  let estimatedMinutes: number | null = null
  if (historicalJobs && historicalJobs.length >= 3) {
    const durations = historicalJobs
      .map(j => Math.round((new Date(j.clocked_out_at).getTime() - new Date(j.clocked_in_at).getTime()) / 60000))
      .filter(d => d > 0 && d < 600)
    if (durations.length) {
      estimatedMinutes = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    }
  }

  const { data: booking, error } = await supabase.from('bookings').insert({
    name,
    phone,
    email: email || null,
    service_type,
    vehicle_year: vehicle_year || null,
    vehicle_make: vehicle_make || null,
    vehicle_model: vehicle_model || null,
    address,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
    notes: notes || null,
    status: 'pending',
    estimated_duration_minutes: estimatedMinutes,
    price: SERVICE_MINIMUMS[service_type] ?? 79,
    preferred_date: preferred_date || null,
    preferred_time: preferred_time || null,
  }).select('id').single()

  if (error) return { success: false, error: error.message }

  const bookingId = booking?.id
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://revv-app.vercel.app'
  const trackUrl = `${siteUrl}/track/${bookingId}`
  const vehicle = [vehicle_year, vehicle_make, vehicle_model].filter(Boolean).join(' ')
  const timeSlot = preferred_date && preferred_time
    ? `${preferred_date} · ${preferred_time}`
    : preferred_date ?? null

  // SMS confirmation
  await sendSMS(
    phone,
    `Hi ${name.split(' ')[0]}! Your Revv booking is confirmed.\n\nService: ${service_type}${vehicle ? `\nVehicle: ${vehicle}` : ''}\nLocation: ${address}${timeSlot ? `\nRequested: ${timeSlot}` : ''}\n\nWe'll reach out shortly to confirm your appointment. Track your job: ${trackUrl}`
  )

  // Email confirmation
  if (email) {
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
            ${timeSlot ? `<tr><td style="padding:8px 0;color:#888">Requested time</td><td style="padding:8px 0;color:#111;font-weight:600">${timeSlot}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#888">Starting from</td><td style="padding:8px 0;color:#111;font-weight:600">$${SERVICE_MINIMUMS[service_type] ?? 79}</td></tr>
          </table>
          <p style="color:#555">We'll reach out shortly to confirm your appointment time.</p>
          <a href="${trackUrl}" style="display:inline-block;margin-top:16px;background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Track Your Job</a>
          <p style="color:#888;font-size:13px;margin-top:32px">— The Revv Team</p>
        </div>
      `,
    })
  }

  return { success: true, error: null, bookingId, name, serviceType: service_type }
}
