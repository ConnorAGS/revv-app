'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import maplibregl from 'maplibre-gl'
import Map, { Marker, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createClient } from '@/lib/supabase'

const BASEMAP = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const STATUS_COLOR: Record<string, string> = {
  pending: '#ca8a04',
  confirmed: '#2563eb',
  in_progress: '#16a34a',
  completed: '#9ca3af',
  cancelled: '#9ca3af',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'In progress',
  confirmed: 'Up next',
  pending: 'Pending',
  completed: 'Done',
  cancelled: 'Cancelled',
}

type Job = {
  id: string
  name: string
  phone: string
  service_type: string
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  address: string
  latitude: number | null
  longitude: number | null
  status: string
  price: number | null
  estimated_duration_minutes: number | null
  clocked_in_at: string | null
  created_at: string
}

function LiveTimer({ clockedInAt }: { clockedInAt: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(clockedInAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [clockedInAt])

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  return (
    <span className="font-mono text-2xl font-bold text-green-600">
      {h > 0 ? `${h}:` : ''}{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

export function TechDashboard({
  initialJobs,
  techId,
  techName,
}: {
  initialJobs: Job[]
  techId: string
  techName: string
}) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [selectedPin, setSelectedPin] = useState<Job | null>(null)
  const mapRef = useRef<MapRef>(null)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Supabase Realtime — subscribe to booking changes for this tech
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('tech-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `assigned_to=eq.${techId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [...prev, payload.new as Job])
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((j) => (j.id === payload.new.id ? (payload.new as Job) : j))
            )
          } else if (payload.eventType === 'DELETE') {
            setJobs((prev) => prev.filter((j) => j.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [techId])

  // Fit map to all plotted jobs
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const plotted = jobs.filter(j => j.latitude != null && j.longitude != null)
    if (plotted.length === 0) return
    if (plotted.length === 1) {
      map.flyTo({ center: [plotted[0].longitude!, plotted[0].latitude!], zoom: 13, duration: 800 })
      return
    }
    const bounds = new maplibregl.LngLatBounds()
    plotted.forEach(j => bounds.extend([j.longitude!, j.latitude!]))
    map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 800 })
  }, [jobs])

  const activeJob = jobs.find(j => j.status === 'in_progress')
  const nextJob = jobs.find(j => ['pending', 'confirmed'].includes(j.status))
  const completedToday = jobs.filter(j => j.status === 'completed')
  const remainingJobs = jobs.filter(j => !['completed', 'cancelled'].includes(j.status))
  const todayRevenue = completedToday.reduce((sum, j) => sum + (j.price ?? 0), 0)
  const estRemaining = remainingJobs.reduce((sum, j) => sum + (j.estimated_duration_minutes ?? 0), 0)
  const plottedJobs = jobs.filter(j => j.latitude != null && j.longitude != null && !['completed', 'cancelled'].includes(j.status))

  const initialView = plottedJobs[0]
    ? { longitude: plottedJobs[0].longitude!, latitude: plottedJobs[0].latitude!, zoom: 11 }
    : { longitude: -98.5795, latitude: 39.8283, zoom: 4 }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-4">
        <p className="text-sm text-gray-500">{greeting()}</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{techName.split(' ')[0]}</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-gray-900">${todayRevenue.toFixed(0)}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Revenue</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-gray-900">{completedToday.length}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Done</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-gray-900">{remainingJobs.length}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Remaining</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-gray-900">
              {estRemaining ? `${Math.round(estRemaining / 60 * 10) / 10}h` : '—'}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Est. left</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Active job card */}
        {activeJob && (
          <Link href={`/tech/jobs/${activeJob.id}`} className="block bg-green-600 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-green-100 uppercase tracking-wide">Active Job</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <span className="text-xs text-green-100">Live</span>
              </div>
            </div>
            <p className="text-white font-bold text-lg leading-tight">{activeJob.service_type}</p>
            <p className="text-green-100 text-sm mb-3">{activeJob.name}</p>
            {activeJob.clocked_in_at && <LiveTimer clockedInAt={activeJob.clocked_in_at} />}
            <p className="text-green-200 text-xs mt-2 truncate">{activeJob.address}</p>
          </Link>
        )}

        {/* Next job card */}
        {!activeJob && nextJob && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Next Job</p>
            <p className="font-bold text-gray-900 text-lg leading-tight">{nextJob.service_type}</p>
            <p className="text-gray-500 text-sm mb-1">{nextJob.name}</p>
            <p className="text-gray-400 text-sm truncate mb-3">{nextJob.address}</p>
            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextJob.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl"
              >
                Get Directions
              </a>
              <Link
                href={`/tech/jobs/${nextJob.id}`}
                className="flex-1 text-center border border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl"
              >
                View Job
              </Link>
            </div>
          </div>
        )}

        {/* Live map */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-900">Today's Jobs</p>
              <p className="text-xs text-gray-400">Live · {plottedJobs.length} locations</p>
            </div>
            <Link href="/tech/map" className="text-xs text-blue-600 font-medium">Full map →</Link>
          </div>

          {plottedJobs.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No geocoded locations yet
            </div>
          ) : (
            <div className="relative h-52">
              <Map
                ref={mapRef}
                initialViewState={{ ...initialView, bearing: 0, pitch: 0 }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={BASEMAP}
              >
                {plottedJobs.map((job, i) => (
                  <Marker
                    key={job.id}
                    longitude={job.longitude!}
                    latitude={job.latitude!}
                    anchor="center"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation()
                      setSelectedPin(selectedPin?.id === job.id ? null : job)
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: STATUS_COLOR[job.status] ?? '#6b7280' }}
                    >
                      {i + 1}
                    </div>
                  </Marker>
                ))}
              </Map>

              {/* Pin popup */}
              {selectedPin && (
                <div className="absolute bottom-3 left-3 right-3 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{selectedPin.service_type}</p>
                      <p className="text-xs text-gray-500">{selectedPin.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{selectedPin.address}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[selectedPin.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[selectedPin.status] ?? selectedPin.status}
                      </span>
                      <button onClick={() => setSelectedPin(null)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <Link
                    href={`/tech/jobs/${selectedPin.id}`}
                    className="block mt-2 text-center bg-gray-900 text-white text-xs font-semibold py-2 rounded-lg"
                  >
                    View Job
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Job list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">All Jobs Today</p>
          {jobs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="font-medium">No jobs assigned</p>
              <p className="text-sm mt-1">Check Available Jobs for open bookings near you.</p>
            </div>
          ) : (
            jobs.map((job, i) => {
              const vehicle = [job.vehicle_year, job.vehicle_make, job.vehicle_model].filter(Boolean).join(' ')
              return (
                <Link
                  key={job.id}
                  href={`/tech/jobs/${job.id}`}
                  className={`flex items-center gap-3 bg-white rounded-2xl border shadow-sm p-4 active:bg-gray-50 ${
                    job.status === 'completed' ? 'border-gray-100 opacity-60' : 'border-gray-100'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: STATUS_COLOR[job.status] ?? '#6b7280' }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm">{job.service_type}</p>
                      {job.price && <p className="text-sm font-bold text-gray-900">${job.price}</p>}
                    </div>
                    <p className="text-xs text-gray-500">{job.name}{vehicle ? ` · ${vehicle}` : ''}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-400 truncate flex-1">{job.address}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2 shrink-0 ${STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[job.status] ?? job.status}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
