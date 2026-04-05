import { createServerSupabase } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { JobDetail } from '../JobDetail'

const DEFAULT_CHECKLISTS: Record<string, string[]> = {
  'Oil Change': ['Check current oil level', 'Drain old oil', 'Replace oil filter', 'Add new oil', 'Check for leaks', 'Reset oil life monitor'],
  'Brake Service': ['Inspect brake pads — front', 'Inspect brake pads — rear', 'Remove wheel, clean caliper', 'Install new pads — front', 'Install new pads — rear', 'Torque lugnuts to spec', 'Test drive + brake check', 'Customer sign-off photo'],
  'Battery Replacement': ['Test old battery', 'Disconnect negative terminal', 'Disconnect positive terminal', 'Remove old battery', 'Install new battery', 'Connect positive terminal', 'Connect negative terminal', 'Test new battery'],
  'Tire Rotation': ['Loosen lug nuts', 'Jack up vehicle', 'Remove all 4 tires', 'Rotate to correct positions', 'Torque lug nuts to spec', 'Check tire pressure', 'Test drive'],
  'Engine Diagnostic': ['Connect OBD scanner', 'Record all fault codes', 'Diagnose root cause', 'Perform repair', 'Clear fault codes', 'Verify fix with test drive'],
  'AC Service': ['Check refrigerant level', 'Inspect AC compressor', 'Check for leaks', 'Recharge refrigerant if needed', 'Test AC output temp', 'Inspect cabin air filter'],
  'Transmission Service': ['Check fluid level and condition', 'Drain old fluid', 'Replace transmission filter', 'Add new fluid', 'Test drive + check shifting'],
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tech } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!tech) redirect('/login')

  const { data: job } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .eq('assigned_to', tech.id)
    .single()

  if (!job) notFound()

  // Auto-populate checklist if none exist yet
  const { data: existingChecklist } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('booking_id', id)

  if (!existingChecklist?.length) {
    const defaults = DEFAULT_CHECKLISTS[job.service_type] ?? DEFAULT_CHECKLISTS['Engine Diagnostic']
    await supabase.from('checklist_items').insert(
      defaults.map((label, i) => ({ booking_id: id, label, sort_order: i }))
    )
  }

  const [{ data: checklist }, { data: parts }] = await Promise.all([
    supabase.from('checklist_items').select('*').eq('booking_id', id).order('sort_order'),
    supabase.from('parts_requests').select('*').eq('booking_id', id).order('created_at'),
  ])

  return (
    <JobDetail
      job={job}
      checklist={checklist ?? []}
      parts={parts ?? []}
    />
  )
}
