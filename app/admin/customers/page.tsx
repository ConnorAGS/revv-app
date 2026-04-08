import { createServerSupabase } from '@/lib/supabase-server'
import { CustomersTable } from './CustomersTable'

export default async function CustomersPage() {
  const supabase = await createServerSupabase()

  const [{ data: bookings }, { data: savedVehicles }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, name, phone, email, status, price, service_type, created_at, vehicle_year, vehicle_make, vehicle_model')
      .order('created_at', { ascending: false }),
    supabase
      .from('customer_vehicles')
      .select('id, customer_phone, year, make, model, trim, color, license_plate, vin, mileage, engine, notes')
      .order('created_at', { ascending: false }),
  ])

  // Aggregate bookings into customers (keyed by phone digits)
  const customerMap = new Map<string, {
    name: string
    phone: string
    email: string | null
    totalBookings: number
    completedJobs: number
    totalSpent: number
    lastBookingAt: string
    services: string[]
    bookings: NonNullable<typeof bookings>
  }>()

  for (const b of bookings ?? []) {
    const key = b.phone.replace(/\D/g, '')
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: b.name,
        phone: b.phone,
        email: b.email,
        totalBookings: 0,
        completedJobs: 0,
        totalSpent: 0,
        lastBookingAt: b.created_at,
        services: [],
        bookings: [],
      })
    }
    const c = customerMap.get(key)!
    c.totalBookings++
    if (b.status === 'completed') {
      c.completedJobs++
      c.totalSpent += b.price ?? 0
    }
    if (b.created_at > c.lastBookingAt) {
      c.lastBookingAt = b.created_at
      c.name = b.name
      if (b.email) c.email = b.email
    }
    if (!c.services.includes(b.service_type)) c.services.push(b.service_type)
    c.bookings.push(b)
  }

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.lastBookingAt).getTime() - new Date(a.lastBookingAt).getTime()
  )

  // Group saved vehicles by phone
  const vehiclesByPhone = new Map<string, NonNullable<typeof savedVehicles>>()
  for (const v of savedVehicles ?? []) {
    const key = v.customer_phone
    if (!vehiclesByPhone.has(key)) vehiclesByPhone.set(key, [])
    vehiclesByPhone.get(key)!.push(v)
  }

  return (
    <div className="pt-14 pb-8 px-4 sm:px-6 sm:pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500 mt-0.5">{customers.length} unique customers</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Customers</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              ${customers.reduce((s, c) => s + c.totalSpent, 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Total Revenue</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {customers.length > 0
                ? (customers.reduce((s, c) => s + c.totalBookings, 0) / customers.length).toFixed(1)
                : '0'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Avg Jobs / Customer</p>
          </div>
        </div>

        <CustomersTable customers={customers} vehiclesByPhone={vehiclesByPhone} />
      </div>
    </div>
  )
}
