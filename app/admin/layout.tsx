import { AdminSidebar } from './AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0 lg:ml-56">
        {children}
      </div>
    </div>
  )
}
