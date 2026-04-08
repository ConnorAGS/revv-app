'use client'

import { useActionState, useState } from 'react'
import { submitBooking } from '@/app/book/actions'
import { SERVICE_MINIMUMS } from '@/lib/service-prices'
import type { BookingState } from '@/app/book/actions'
import Link from 'next/link'

const SERVICE_TYPES = [
  'Oil Change',
  'Brake Service',
  'Tire Rotation',
  'Battery Replacement',
  'Engine Diagnostic',
  'AC Service',
  'Transmission Service',
  'Other',
]

const TIME_WINDOWS = [
  { value: 'Morning (8am – 12pm)',   label: 'Morning',   sub: '8am – 12pm' },
  { value: 'Afternoon (12pm – 5pm)', label: 'Afternoon', sub: '12pm – 5pm' },
  { value: 'Evening (5pm – 8pm)',    label: 'Evening',   sub: '5pm – 8pm' },
]

function getDateOptions() {
  const options = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    options.push({
      value: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      sub: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  return options
}

type Vehicle = {
  year: string | null
  make: string | null
  model: string | null
}

type Props = {
  customer: {
    name: string
    phone: string
    email: string | null
  }
  vehicles: Vehicle[]
  onClose: () => void
}

const initialState: BookingState = { success: false, error: null }

export function QuickBookingPanel({ customer, vehicles, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(submitBooking, initialState)
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState<number | 'new'>(vehicles.length > 0 ? 0 : 'new')

  const dateOptions = getDateOptions()
  const estimatedPrice = selectedService ? SERVICE_MINIMUMS[selectedService] : null
  const selectedVehicle = selectedVehicleIdx !== 'new' ? vehicles[selectedVehicleIdx] : null

  if (state.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Booking Created</h3>
            <p className="text-sm text-gray-500 mt-1">{state.serviceType} for {customer.name}</p>
          </div>
          <div className="flex gap-3">
            {state.bookingId && (
              <Link
                href={`/track/${state.bookingId}`}
                className="flex-1 bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl text-center hover:bg-red-500 transition-colors"
              >
                View Job
              </Link>
            )}
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Booking</h2>
            <p className="text-xs text-gray-500 mt-0.5">{customer.name} · {customer.phone}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Scrollable form */}
        <form action={formAction} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Hidden pre-filled fields */}
          <input type="hidden" name="name" value={customer.name} />
          <input type="hidden" name="phone" value={customer.phone} />
          <input type="hidden" name="email" value={customer.email ?? ''} />
          <input type="hidden" name="preferred_date" value={selectedDate} />
          <input type="hidden" name="preferred_time" value={selectedTime} />

          {/* Pre-filled customer info banner */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
              {customer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
              <p className="text-xs text-gray-500">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</p>
            </div>
          </div>

          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {state.error}
            </div>
          )}

          {/* Service type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type <span className="text-red-600">*</span>
            </label>
            <select
              name="service_type"
              required
              defaultValue=""
              onChange={e => setSelectedService(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="" disabled>Select a service...</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {estimatedPrice && (
              <div className="mt-1.5 flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
                <span className="text-xs text-green-700 font-medium">Starting from</span>
                <span className="text-sm font-bold text-green-700">${estimatedPrice}+</span>
              </div>
            )}
          </div>

          {/* Vehicle selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
            {vehicles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {vehicles.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedVehicleIdx(i)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      selectedVehicleIdx === i
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-red-300'
                    }`}
                  >
                    {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedVehicleIdx('new')}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    selectedVehicleIdx === 'new'
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-red-300'
                  }`}
                >
                  + Different vehicle
                </button>
              </div>
            )}

            {selectedVehicleIdx !== 'new' ? (
              <>
                <input type="hidden" name="vehicle_year" value={selectedVehicle?.year ?? ''} />
                <input type="hidden" name="vehicle_make" value={selectedVehicle?.make ?? ''} />
                <input type="hidden" name="vehicle_model" value={selectedVehicle?.model ?? ''} />
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <input name="vehicle_year" placeholder="Year" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                <input name="vehicle_make" placeholder="Make" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                <input name="vehicle_model" placeholder="Model" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            )}}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Location <span className="text-red-600">*</span>
            </label>
            <input
              name="address"
              required
              placeholder="123 Main St, Austin, TX"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Day</label>
            <div className="grid grid-cols-4 gap-1.5">
              {dateOptions.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDate(selectedDate === d.value ? '' : d.value)}
                  className={`py-2 rounded-xl text-center border transition-all ${
                    selectedDate === d.value
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-red-300'
                  }`}
                >
                  <p className="text-[11px] font-bold leading-tight">{d.label}</p>
                  <p className="text-[9px] opacity-70 mt-0.5">{d.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Time</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_WINDOWS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedTime(selectedTime === t.value ? '' : t.value)}
                  className={`py-2.5 rounded-xl text-center border transition-all ${
                    selectedTime === t.value
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-red-300'
                  }`}
                >
                  <p className="text-xs font-bold">{t.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{t.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Any details about the issue..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <div className="pb-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
