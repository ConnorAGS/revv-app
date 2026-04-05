import { createServerSupabase } from '@/lib/supabase-server'
import { TechnicianManager } from './TechnicianManager'

export default async function TechniciansPage() {
  const supabase = await createServerSupabase()

  const { data: technicians } = await supabase
    .from('technicians')
    .select('id, name, email, phone, status, user_id, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <TechnicianManager technicians={technicians ?? []} />
      </div>
    </div>
  )
}
