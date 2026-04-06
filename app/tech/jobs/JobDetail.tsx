'use client'

import { useTransition, useRef, useState } from 'react'
import Link from 'next/link'
import { clockIn, clockOut, markComplete, uploadPhoto, toggleChecklistItem, requestPart, postJobUpdate } from '../actions'

type Job = {
  id: string
  name: string
  phone: string
  email: string | null
  service_type: string
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  address: string
  notes: string | null
  status: string
  clocked_in_at: string | null
  clocked_out_at: string | null
  photo_before: string | null
  photo_after: string | null
  price: number | null
  estimated_duration_minutes: number | null
}

type ChecklistItem = {
  id: string
  label: string
  completed: boolean
  sort_order: number
}

type Part = {
  id: string
  name: string
  brand: string | null
  qty: number
  status: string
}

const PART_STATUS_STYLES: Record<string, string> = {
  on_truck: 'bg-green-100 text-green-800',
  incoming: 'bg-blue-100 text-blue-800',
  needed: 'bg-red-100 text-red-800',
  ordered: 'bg-yellow-100 text-yellow-800',
}

const PART_STATUS_LABELS: Record<string, string> = {
  on_truck: 'On truck',
  incoming: 'Incoming',
  needed: 'Not ordered',
  ordered: 'Ordered',
}

function ElapsedTimer({ clockedInAt }: { clockedInAt: string }) {
  const start = new Date(clockedInAt).getTime()
  const now = Date.now()
  const elapsed = Math.floor((now - start) / 1000 / 60)
  const h = Math.floor(elapsed / 60)
  const m = elapsed % 60
  return <span>{h > 0 ? `${h}h ${m}m` : `${m}m`}</span>
}

type Update = {
  id: string
  message: string | null
  photo_url: string | null
  created_at: string
}

const QUICK_UPDATES = [
  'Starting diagnosis',
  'Parts installed',
  'Almost done',
  'Found an issue — will call',
  'Waiting on parts',
  'Job complete',
]

export function JobDetail({
  job,
  checklist,
  parts,
  updates: initialUpdates,
}: {
  job: Job
  checklist: ChecklistItem[]
  parts: Part[]
  updates: Update[]
}) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'checklist' | 'parts' | 'photos' | 'updates' | 'notes'>('checklist')
  const [showPartForm, setShowPartForm] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [updatePending, setUpdatePending] = useState(false)
  const beforeRef = useRef<HTMLInputElement>(null)
  const afterRef = useRef<HTMLInputElement>(null)
  const updatePhotoRef = useRef<HTMLInputElement>(null)

  const vehicle = [job.vehicle_year, job.vehicle_make, job.vehicle_model].filter(Boolean).join(' ')
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`
  const completedCount = checklist.filter(i => i.completed).length

  function handlePhoto(type: 'before' | 'after') {
    const ref = type === 'before' ? beforeRef : afterRef
    const file = ref.current?.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    startTransition(() => uploadPhoto(job.id, fd, type))
  }

  async function handlePostUpdate(messageOverride?: string) {
    const msg = messageOverride ?? updateText
    const file = updatePhotoRef.current?.files?.[0]
    if (!msg.trim() && !file) return
    setUpdatePending(true)
    const fd = new FormData()
    if (msg.trim()) fd.append('message', msg)
    if (file) fd.append('photo', file)
    await postJobUpdate(job.id, fd)
    setUpdateText('')
    if (updatePhotoRef.current) updatePhotoRef.current.value = ''
    setUpdatePending(false)
  }

  const TABS = [
    { key: 'checklist', label: `Checklist${checklist.length ? ` (${completedCount}/${checklist.length})` : ''}` },
    { key: 'updates', label: `Updates${initialUpdates.length ? ` (${initialUpdates.length})` : ''}` },
    { key: 'parts', label: `Parts${parts.length ? ` (${parts.length})` : ''}` },
    { key: 'photos', label: 'Photos' },
    { key: 'notes', label: 'Notes' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/tech" className="text-blue-600 text-sm font-medium">← Jobs</Link>
          <div className="flex-1">
            <p className="text-xs text-gray-400">
              {job.status === 'in_progress' ? 'In progress' : job.status.replace('_', ' ')}
            </p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{job.service_type}</h1>
            <p className="text-sm text-gray-500">{job.name}{vehicle ? ` · ${vehicle}` : ''}</p>
          </div>
        </div>

        {/* Timer */}
        {job.clocked_in_at && job.status !== 'completed' && (
          <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                Timer: <ElapsedTimer clockedInAt={job.clocked_in_at} />
              </span>
            </div>
            {job.estimated_duration_minutes && (
              <span className="text-xs text-gray-500">Est. {job.estimated_duration_minutes}min</span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 -mx-4 px-4 gap-4 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`text-sm font-medium pb-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <div className="space-y-3">
            {/* Customer + Address */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
              <a href={`tel:${job.phone}`} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{job.name}</span>
                <span className="text-blue-600 text-sm">{job.phone}</span>
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-gray-500 underline-offset-2 hover:underline block truncate">
                {job.address}
              </a>
            </div>

            {/* Clock in/out */}
            {!job.clocked_in_at && job.status !== 'completed' && (
              <button
                disabled={isPending}
                onClick={() => startTransition(() => clockIn(job.id))}
                className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-2xl disabled:opacity-50 text-sm"
              >
                Clock In
              </button>
            )}

            {/* Checklist items */}
            {checklist.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {checklist.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
                  <button
                    key={item.id}
                    disabled={isPending}
                    onClick={() => startTransition(() => toggleChecklistItem(item.id, !item.completed, job.id))}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50"
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                      item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {item.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {checklist.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-400 text-sm">
                No checklist items for this job.
              </div>
            )}

            {/* Mark Complete */}
            {job.status !== 'completed' && (
              <button
                disabled={isPending}
                onClick={() => startTransition(() => markComplete(job.id))}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl text-base disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Mark Job Complete'}
              </button>
            )}
            {job.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-center font-semibold py-4 rounded-2xl">
                Job Complete {job.price ? `· $${job.price}` : ''}
              </div>
            )}
          </div>
        )}

        {/* Parts Tab */}
        {activeTab === 'parts' && (
          <div className="space-y-3">
            {parts.length === 0 && !showPartForm && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-400 text-sm">
                No parts logged for this job yet.
              </div>
            )}

            {parts.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {parts.map((part) => (
                  <div key={part.id} className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{part.name}</p>
                      {part.brand && <p className="text-xs text-gray-400">{part.brand} · Qty {part.qty}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PART_STATUS_STYLES[part.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {PART_STATUS_LABELS[part.status] ?? part.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {showPartForm && (
              <form
                action={(fd) => {
                  startTransition(() => requestPart(job.id, fd))
                  setShowPartForm(false)
                }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-gray-900">Add Part</p>
                <input name="name" required placeholder="Part name *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input name="brand" placeholder="Brand (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input name="qty" type="number" defaultValue="1" min="1" placeholder="Qty" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowPartForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm">Add Part</button>
                </div>
              </form>
            )}

            {!showPartForm && (
              <button
                onClick={() => setShowPartForm(true)}
                className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-2xl text-sm"
              >
                + Request Part
              </button>
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            {(['before', 'after'] as const).map((type) => {
              const url = type === 'before' ? job.photo_before : job.photo_after
              const ref = type === 'before' ? beforeRef : afterRef
              return (
                <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700 capitalize">{type}</p>
                  {url ? (
                    <img src={url} alt={type} className="w-full rounded-xl object-cover max-h-64" />
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={() => handlePhoto(type)} />
                      <button onClick={() => ref.current?.click()} disabled={isPending} className="text-sm text-blue-600 font-medium disabled:opacity-50">
                        Take / Upload Photo
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Updates Tab */}
        {activeTab === 'updates' && (
          <div className="space-y-3">
            {/* Quick chips */}
            <div className="flex flex-wrap gap-2">
              {QUICK_UPDATES.map(q => (
                <button
                  key={q}
                  type="button"
                  disabled={updatePending}
                  onClick={() => handlePostUpdate(q)}
                  className="text-xs font-medium bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Freeform post */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <textarea
                value={updateText}
                onChange={e => setUpdateText(e.target.value)}
                placeholder="What's happening with the job?"
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex items-center gap-2">
                <input ref={updatePhotoRef} type="file" accept="image/*" capture="environment" className="hidden" />
                <button
                  type="button"
                  onClick={() => updatePhotoRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Add Photo
                </button>
                <button
                  type="button"
                  disabled={updatePending || (!updateText.trim() && !updatePhotoRef.current?.files?.length)}
                  onClick={() => handlePostUpdate()}
                  className="ml-auto bg-red-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-red-500 disabled:opacity-40 transition-colors"
                >
                  {updatePending ? 'Posting...' : 'Post Update'}
                </button>
              </div>
            </div>

            {/* Update feed */}
            {initialUpdates.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No updates posted yet.</div>
            ) : (
              <div className="space-y-2">
                {[...initialUpdates].reverse().map(u => (
                  <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-xs text-gray-400 mb-2">
                      {new Date(u.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {' · '}
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {u.message && <p className="text-sm text-gray-800 mb-2">{u.message}</p>}
                    {u.photo_url && (
                      <img src={u.photo_url} alt="Update" className="w-full rounded-xl object-cover max-h-56" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            {job.notes ? (
              <p className="text-sm text-gray-700 leading-relaxed">{job.notes}</p>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No notes for this job.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
