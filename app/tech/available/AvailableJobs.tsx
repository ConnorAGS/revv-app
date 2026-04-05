'use client'

import { useEffect, useState, useTransition } from 'react'
import { acceptJob, updateTechLocation } from '../actions'
import { useRouter } from 'next/navigation'

type Job = {
  id: string
  name: string
  service_type: string
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  address: string
  latitude: number | null
  longitude: number | null
  price: number | null
  estimated_duration_minutes: number | null
  created_at: string
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function AvailableJobs({
  jobs,
  techId,
  techLat,
  techLng,
}: {
  jobs: Job[]
  techId: string
  techLat: number | null
  techLng: number | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [currentLat, setCurrentLat] = useState<number | null>(techLat)
  const [currentLng, setCurrentLng] = useState<number | null>(techLng)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'denied'>('loading')

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCurrentLat(latitude)
        setCurrentLng(longitude)
        setLocationStatus('ready')
        updateTechLocation(techId, latitude, longitude)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        if (techLat !== null && techLng !== null) {
          setLocationStatus('ready') // Use stored location
        } else {
          setLocationStatus('denied')
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }, [techId, techLat, techLng])

  function handleAccept(jobId: string) {
    setAcceptingId(jobId)
    startTransition(async () => {
      const ok = await acceptJob(jobId, techId)
      if (ok) {
        router.push(`/tech/jobs/${jobId}`)
      } else {
        setAcceptingId(null)
        router.refresh() // Job was taken by someone else
      }
    })
  }

  if (locationStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Getting your location…
      </div>
    )
  }

  if (locationStatus === 'denied') {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-600 font-medium mb-1">Location required</p>
        <p className="text-sm text-gray-400">Enable location access in your browser settings to see nearby jobs.</p>
      </div>
    )
  }

  if (currentLat === null || currentLng === null) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Getting your location…
      </div>
    )
  }

  const nearbyJobs = jobs
    .filter(j => j.latitude != null && j.longitude != null)
    .map(j => ({
      ...j,
      distance: haversineDistance(currentLat!, currentLng!, j.latitude!, j.longitude!),
    }))
    .filter(j => j.distance <= 25)
    .sort((a, b) => a.distance - b.distance)

  if (nearbyJobs.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-gray-400">
        <p className="text-lg font-medium">No jobs nearby</p>
        <p className="text-sm mt-1">Check back soon — new bookings appear here instantly.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {nearbyJobs.map((job) => {
        const vehicle = [job.vehicle_year, job.vehicle_make, job.vehicle_model].filter(Boolean).join(' ')
        const isAccepting = acceptingId === job.id

        return (
          <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{job.service_type}</p>
                {vehicle && <p className="text-sm text-gray-500">{vehicle}</p>}
              </div>
              {job.price && (
                <p className="text-lg font-bold text-gray-900 ml-3">${job.price}</p>
              )}
            </div>

            <p className="text-sm text-gray-500 truncate mb-3">{job.address}</p>

            <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {job.distance.toFixed(1)} mi away
              </span>
              {job.estimated_duration_minutes && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {job.estimated_duration_minutes} min est.
                </span>
              )}
            </div>

            <button
              disabled={isPending}
              onClick={() => handleAccept(job.id)}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 active:bg-blue-700 transition-colors"
            >
              {isAccepting ? 'Accepting…' : 'Accept Job'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
