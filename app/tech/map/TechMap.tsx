'use client'

import { useMemo, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import Link from 'next/link'

const BASEMAP = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const STATUS_COLOR: Record<string, string> = {
  pending: '#ca8a04',
  confirmed: '#2563eb',
  in_progress: '#16a34a',
}

type Job = {
  id: string
  name: string
  service_type: string
  address: string
  status: string
  latitude: number | null
  longitude: number | null
}

export function TechMap({ jobs }: { jobs: Job[] }) {
  const mapRef = useRef<MapRef>(null)
  const plotted = useMemo(() => jobs.filter(j => j.latitude != null && j.longitude != null) as (Job & { latitude: number; longitude: number })[], [jobs])

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || plotted.length === 0) return
    if (plotted.length === 1) {
      map.jumpTo({ center: [plotted[0].longitude, plotted[0].latitude], zoom: 13 })
      return
    }
    const bounds = new maplibregl.LngLatBounds()
    plotted.forEach(j => bounds.extend([j.longitude, j.latitude]))
    map.fitBounds(bounds, { padding: 60, maxZoom: 14 })
  }, [plotted])

  const initialViewState = plotted[0]
    ? { longitude: plotted[0].longitude, latitude: plotted[0].latitude, zoom: 12 }
    : { longitude: -98.5795, latitude: 39.8283, zoom: 4 }

  if (plotted.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm px-4 text-center">
        No geocoded job locations. New bookings will appear here automatically.
      </div>
    )
  }

  return (
    <div>
      <div className="h-[55vh]">
        <Map
          ref={mapRef}
          initialViewState={{ ...initialViewState, bearing: 0, pitch: 0 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={BASEMAP}
          onLoad={onLoad}
        >
          <NavigationControl position="top-right" />
          {plotted.map((job, i) => (
            <Marker key={job.id} longitude={job.longitude} latitude={job.latitude} anchor="center">
              <div
                className="w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: STATUS_COLOR[job.status] ?? '#6b7280' }}
              >
                {i + 1}
              </div>
            </Marker>
          ))}
        </Map>
      </div>

      {/* Job list below map */}
      <div className="px-4 py-4 space-y-3">
        {plotted.map((job, i) => (
          <Link key={job.id} href={`/tech/jobs/${job.id}`} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 active:bg-gray-50">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: STATUS_COLOR[job.status] ?? '#6b7280' }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{job.service_type}</p>
              <p className="text-xs text-gray-500 truncate">{job.address}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
