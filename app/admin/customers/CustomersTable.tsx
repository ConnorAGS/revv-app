'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { addCustomerVehicle } from './actions'
import { QuickBookingPanel } from './QuickBookingPanel'
import { decodeVin } from '@/lib/nhtsa'

type Booking = {
  id: string
  name: string
  phone: string
  email: string | null
  status: string
  price: number | null
  service_type: string
  created_at: string
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
}

type SavedVehicle = {
  id: string
  year: string | null
  make: string | null
  model: string | null
  trim: string | null
  color: string | null
  license_plate: string | null
  vin: string | null
  mileage: number | null
  engine: string | null
  notes: string | null
}

type Customer = {
  name: string
  phone: string
  email: string | null
  totalBookings: number
  completedJobs: number
  totalSpent: number
  lastBookingAt: string
  services: string[]
  bookings: Booking[]
}

// Placeholder icons for future vehicle record features (invoices, service history, notes, photos)
function VehicleRecordIcons() {
  const icons = [
    { label: 'Invoices', path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Service History', path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Notes', path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: 'Photos', path: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z' },
  ]
  return (
    <div className="flex items-center gap-1 shrink-0">
      {icons.map(({ label, path }) => (
        <div
          key={label}
          title={`${label} — coming soon`}
          className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center cursor-not-allowed opacity-40 hover:opacity-70 transition-opacity"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
          </svg>
        </div>
      ))}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-gray-500">
          Customers are created automatically when a booking is submitted. To add a customer, create a booking for them.
        </p>
        <div className="flex gap-3">
          <Link
            href="/book"
            className="flex-1 bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center hover:bg-red-500 transition-colors"
          >
            Create Booking
          </Link>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

const INPUT = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full"

function AddCarForm({ phone, onDone }: { phone: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [decoding, setDecoding] = useState(false)
  const [decoded, setDecoded] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const setField = (name: string, value: string | null) => {
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | null
    if (el && value) el.value = value
  }

  async function handleVinDecode() {
    const vin = (formRef.current?.elements.namedItem('vin') as HTMLInputElement)?.value?.trim()
    if (!vin || vin.length < 11) return
    setDecoding(true)
    setDecoded(false)
    const result = await decodeVin(vin)
    setDecoding(false)
    if (!result) {
      setError('Could not decode VIN — check it and try again.')
      return
    }
    setField('year', result.year)
    setField('make', result.make)
    setField('model', result.model)
    setField('trim', result.trim)
    setField('engine', result.engine)
    setError(null)
    setDecoded(true)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await addCustomerVehicle(phone, fd)
      if (result.error) {
        setError(result.error)
      } else {
        onDone()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 mt-2">
      <p className="text-xs font-semibold text-gray-700">New Vehicle</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">{error}</div>
      )}

      {/* VIN with decode button */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">VIN — enter to auto-fill vehicle info</label>
        <div className="flex gap-2">
          <input name="vin" placeholder="17-digit VIN" maxLength={17} className={INPUT} />
          <button
            type="button"
            onClick={handleVinDecode}
            disabled={decoding}
            className="shrink-0 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {decoding ? 'Looking up...' : 'Decode VIN'}
          </button>
        </div>
        {decoded && (
          <p className="text-xs text-green-600 mt-1 font-medium">Vehicle info filled in from NHTSA</p>
        )}
      </div>

      {/* Year / Make / Model */}
      <div className="grid grid-cols-3 gap-2">
        <input name="year" placeholder="Year" maxLength={4} className={INPUT} />
        <input name="make" placeholder="Make" className={INPUT} />
        <input name="model" placeholder="Model" className={INPUT} />
      </div>

      {/* Trim / Color */}
      <div className="grid grid-cols-2 gap-2">
        <input name="trim" placeholder="Trim (e.g. Sport, EX-L)" className={INPUT} />
        <input name="color" placeholder="Color" className={INPUT} />
      </div>

      {/* License Plate / Mileage */}
      <div className="grid grid-cols-2 gap-2">
        <input name="license_plate" placeholder="License Plate" className={INPUT} />
        <input name="mileage" type="number" placeholder="Mileage" className={INPUT} />
      </div>

      {/* Engine */}
      <input name="engine" placeholder="Engine (e.g. 2.0L 4-cyl)" className={INPUT} />

      {/* Notes */}
      <textarea
        name="notes"
        placeholder="Notes (any other details)"
        rows={2}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full resize-none"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-red-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving...' : 'Save Vehicle'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export function CustomersTable({
  customers,
  vehiclesByPhone,
}: {
  customers: Customer[]
  vehiclesByPhone: Map<string, SavedVehicle[]>
}) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'spent' | 'jobs'>('recent')
  const [addingCarFor, setAddingCarFor] = useState<string | null>(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [activeTab, setActiveTab] = useState<Record<string, 'vehicles' | 'history'>>({})
  const [quickBookingFor, setQuickBookingFor] = useState<string | null>(null)

  const filtered = customers
    .filter(c => {
      const q = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent
      if (sortBy === 'jobs') return b.totalBookings - a.totalBookings
      return new Date(b.lastBookingAt).getTime() - new Date(a.lastBookingAt).getTime()
    })

  const quickBookingCustomer = quickBookingFor ? filtered.find(c => c.phone.replace(/\D/g, '') === quickBookingFor) : null
  const quickBookingVehicles = quickBookingFor
    ? [
        ...(vehiclesByPhone.get(quickBookingFor) ?? []).map(v => ({ year: v.year, make: v.make, model: v.model })),
        ...(quickBookingCustomer?.bookings.reduce<{ year: string | null; make: string | null; model: string | null }[]>((acc, b) => {
          if (!b.vehicle_make && !b.vehicle_model) return acc
          const label = [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(' ')
          if (!acc.find(v => [v.year, v.make, v.model].filter(Boolean).join(' ') === label)) {
            acc.push({ year: b.vehicle_year, make: b.vehicle_make, model: b.vehicle_model })
          }
          return acc
        }, []) ?? []),
      ]
    : []

  return (
    <>
      {showAddCustomer && <AddCustomerModal onClose={() => setShowAddCustomer(false)} />}
      {quickBookingCustomer && (
        <QuickBookingPanel
          customer={quickBookingCustomer}
          vehicles={quickBookingVehicles}
          onClose={() => setQuickBookingFor(null)}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-1 shrink-0">
            {([['recent', 'Recent'], ['spent', 'Top Spend'], ['jobs', 'Most Jobs']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  sortBy === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowAddCustomer(true)}
              className="ml-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">No customers found</p>
            {search && <p className="text-sm mt-1">Try a different search</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((customer) => {
              const key = customer.phone.replace(/\D/g, '')
              const isExpanded = expanded === key
              const initials = customer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
              const savedVehicles = vehiclesByPhone.get(key) ?? []

              // Unique vehicles from booking history
              const bookingVehicles = customer.bookings.reduce<{ year: string | null; make: string | null; model: string | null }[]>((acc, b) => {
                if (!b.vehicle_make && !b.vehicle_model) return acc
                const label = [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(' ')
                if (!acc.find(v => [v.year, v.make, v.model].filter(Boolean).join(' ') === label)) {
                  acc.push({ year: b.vehicle_year, make: b.vehicle_make, model: b.vehicle_model })
                }
                return acc
              }, [])

              const tab = activeTab[key] ?? 'vehicles'

              return (
                <div key={key}>
                  {/* Customer row */}
                  <div
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : key)}
                  >
                    <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={`tel:${customer.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        >
                          {customer.phone}
                        </a>
                        {customer.email && (
                          <>
                            <span className="text-gray-300">·</span>
                            <a
                              href={`mailto:${customer.email}`}
                              onClick={e => e.stopPropagation()}
                              className="text-xs text-gray-500 hover:text-red-600 transition-colors truncate"
                            >
                              {customer.email}
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{customer.totalBookings}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Jobs</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-600">${customer.totalSpent.toFixed(0)}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Spent</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(customer.lastBookingAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Last job</p>
                      </div>
                    </div>

                    <svg
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 space-y-3">

                      {/* Tabs */}
                      <div className="flex gap-1 border-b border-gray-200 pb-0">
                        {(['vehicles', 'history'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setActiveTab(prev => ({ ...prev, [key]: t }))}
                            className={`text-xs font-semibold px-3 py-2 border-b-2 transition-colors capitalize ${
                              tab === t ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {t === 'vehicles' ? `Vehicles (${savedVehicles.length + bookingVehicles.length})` : `Job History (${customer.bookings.length})`}
                          </button>
                        ))}
                      </div>

                      {/* Vehicles tab */}
                      {tab === 'vehicles' && (
                        <div className="space-y-2">
                          {/* Saved vehicles */}
                          {savedVehicles.map(v => (
                            <div key={v.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2.5.5M13 16l2.5.5M13 16H3m10 0h3.5" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'Unknown Vehicle'}
                                  {v.trim ? <span className="text-gray-400 font-normal"> · {v.trim}</span> : null}
                                </p>
                                <div className="flex flex-wrap gap-x-3 mt-0.5">
                                  {v.color && <span className="text-xs text-gray-400">{v.color}</span>}
                                  {v.license_plate && <span className="text-xs text-gray-400">🪪 {v.license_plate}</span>}
                                  {v.mileage && <span className="text-xs text-gray-400">{v.mileage.toLocaleString()} mi</span>}
                                  {v.vin && <span className="text-xs text-gray-300 font-mono truncate max-w-[120px]">{v.vin}</span>}
                                  {v.notes && <span className="text-xs text-gray-400 italic">{v.notes}</span>}
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Saved</span>
                              <VehicleRecordIcons />
                            </div>
                          ))}

                          {/* Vehicles from booking history */}
                          {bookingVehicles.map((v, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2.5.5M13 16l2.5.5M13 16H3m10 0h3.5" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">From booking</span>
                              <VehicleRecordIcons />
                            </div>
                          ))}

                          {savedVehicles.length === 0 && bookingVehicles.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-3">No vehicles on file.</p>
                          )}

                          <button
                            onClick={() => setQuickBookingFor(key)}
                            className="w-full bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-500 transition-colors"
                          >
                            + New Booking
                          </button>

                          {/* Add car form or button */}
                          {addingCarFor === key ? (
                            <AddCarForm phone={customer.phone} onDone={() => setAddingCarFor(null)} />
                          ) : (
                            <button
                              onClick={() => setAddingCarFor(key)}
                              className="w-full border border-dashed border-gray-300 text-gray-500 text-sm font-medium py-2.5 rounded-xl hover:border-red-400 hover:text-red-600 transition-colors"
                            >
                              + Add Car
                            </button>
                          )}
                        </div>
                      )}

                      {/* Job history tab */}
                      {tab === 'history' && (
                        <div className="space-y-2">
                          <div className="flex justify-end">
                            <button
                              onClick={() => setQuickBookingFor(key)}
                              className="text-xs text-red-600 font-semibold hover:text-red-500 transition-colors"
                            >
                              + New Booking
                            </button>
                          </div>
                          {customer.bookings.map(b => {
                            const vehicle = [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean).join(' ')
                            return (
                              <div key={b.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900">{b.service_type}</p>
                                    {b.price && <p className="text-xs font-bold text-green-600">${b.price}</p>}
                                  </div>
                                  {vehicle && <p className="text-xs text-gray-500 mt-0.5">{vehicle}</p>}
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                    {b.status.replace('_', ' ')}
                                  </span>
                                  <Link
                                    href={`/track/${b.id}`}
                                    className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    View →
                                  </Link>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
