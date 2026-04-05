'use client'

import { useCallback, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import type { Booking } from './JobsTable'

/** Carto light basemap — no API key required for tiles */
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

/** Pin fill colors aligned with dashboard status badges */
const STATUS_PIN: Record<string, string> = {
  pending: '#ca8a04',
  confirmed: '#2563eb',
  in_progress: '#9333ea',
  completed: '#16a34a',
  cancelled: '#dc2626',
}

function hasCoords(b: Booking): b is Booking & { latitude: number; longitude: number } {
  return b.latitude != null && b.longitude != null && Number.isFinite(b.latitude) && Number.isFinite(b.longitude)
}

export function JobsMap({ bookings }: { bookings: Booking[] }) {
  const mapRef = useRef<MapRef>(null)

  const plotted = useMemo(() => bookings.filter(hasCoords), [bookings])

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || plotted.length === 0) return

    if (plotted.length === 1) {
      map.jumpTo({
        center: [plotted[0].longitude, plotted[0].latitude],
        zoom: 12,
      })
      return
    }

    const bounds = new maplibregl.LngLatBounds()
    plotted.forEach((b) => bounds.extend([b.longitude, b.latitude]))
    map.fitBounds(bounds, { padding: 56, maxZoom: 14 })
  }, [plotted])

  const initialViewState = useMemo(() => {
    if (plotted.length === 0) {
      return { longitude: -98.5795, latitude: 39.8283, zoom: 3 }
    }
    if (plotted.length === 1) {
      return { longitude: plotted[0].longitude, latitude: plotted[0].latitude, zoom: 12 }
    }
    const lngs = plotted.map((b) => b.longitude)
    const lats = plotted.map((b) => b.latitude)
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: 4,
    }
  }, [plotted])

  const missing = bookings.length - plotted.length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Job locations</h2>
          <p className="text-xs text-gray-500">
            Pins match job status
            {missing > 0
              ? ` · ${missing} job${missing === 1 ? '' : 's'} without coordinates (add Mapbox geocoding token + run SQL migration)`
              : ''}
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
          {Object.entries(STATUS_PIN).map(([status, color]) => (
            <li key={status} className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full border border-white shadow shrink-0"
                style={{ backgroundColor: color }}
              />
              {status.replace('_', ' ')}
            </li>
          ))}
        </ul>
      </div>
      {plotted.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12 px-4">
          No geocoded locations yet. After you add coordinates to the database and configure geocoding, new bookings will appear here.
        </p>
      ) : (
        <div className="h-[380px] w-full relative">
          <Map
            ref={mapRef}
            initialViewState={{ ...initialViewState, bearing: 0, pitch: 0 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={BASEMAP_STYLE}
            onLoad={onLoad}
          >
            <NavigationControl position="top-right" />
            {plotted.map((b) => (
              <Marker key={b.id} longitude={b.longitude} latitude={b.latitude} anchor="center">
                <div
                  title={`${b.name} — ${b.service_type}`}
                  className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: STATUS_PIN[b.status] ?? '#6b7280' }}
                />
              </Marker>
            ))}
          </Map>
        </div>
      )}
    </div>
  )
}
