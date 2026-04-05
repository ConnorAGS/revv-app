import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { BottomNav } from './BottomNav'
import { TechMenu } from './TechMenu'

export default async function TechLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tech } = await supabase
    .from('technicians')
    .select('name')
    .eq('user_id', user.id)
    .single()

  if (!tech) redirect('/login')

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4 h-12">
        <span className="text-base font-bold text-gray-900">Revv</span>
        <TechMenu name={tech.name} />
      </div>
      <div className="h-12" />
      {children}
      <BottomNav />
    </div>
  )
}
