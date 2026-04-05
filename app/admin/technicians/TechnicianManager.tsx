'use client'

import { useActionState, useTransition, useState } from 'react'
import { createTechnician, deleteTechnician, updateTechStatus } from './actions'
import type { TechActionState } from './actions'

type Technician = {
  id: string
  name: string
  email: string
  phone: string
  status: string
  user_id: string | null
  created_at: string
}

const initialState: TechActionState = { error: null, success: false }

export function TechnicianManager({ technicians }: { technicians: Technician[] }) {
  const [showForm, setShowForm] = useState(false)
  const [state, formAction, isPending] = useActionState(createTechnician, initialState)
  const [deletePending, startDeleteTransition] = useTransition()
  const [statusPending, startStatusTransition] = useTransition()

  // Close form on success
  if (state.success && showForm) setShowForm(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
          <p className="text-sm text-gray-500 mt-0.5">{technicians.length} team member{technicians.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Technician
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form action={formAction} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">New Technician</h2>

          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input name="name" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input name="phone" type="tel" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input name="email" type="email" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password *</label>
              <input name="password" type="password" required minLength={6} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Creating...' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-gray-200 text-gray-600 font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Technician list */}
      {technicians.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <p className="font-medium">No technicians yet</p>
          <p className="text-sm mt-1">Add your first team member above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-5 py-3.5 font-semibold text-gray-600">Name</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">Contact</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">Joined</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {technicians.map((tech) => (
                <tr key={tech.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {tech.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <p className="font-medium text-gray-900">{tech.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-700">{tech.email}</p>
                    <p className="text-gray-400 text-xs">{tech.phone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={tech.status}
                      disabled={statusPending}
                      onChange={(e) => startStatusTransition(() => updateTechStatus(tech.id, e.target.value))}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
                        tech.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(tech.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      disabled={deletePending}
                      onClick={() => {
                        if (!confirm(`Remove ${tech.name}? This cannot be undone.`)) return
                        startDeleteTransition(() => deleteTechnician(tech.id, tech.user_id ?? ''))
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
