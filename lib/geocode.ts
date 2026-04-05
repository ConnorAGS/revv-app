/**
 * Forward-geocode a free-text address using the Mapbox Geocoding API.
 * Returns null if the token is missing, the request fails, or there is no result.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = address.trim()
  if (!trimmed) return null

  const token = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token?.trim()) return null

  const encoded = encodeURIComponent(trimmed)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`

  const res = await fetch(url)
  if (!res.ok) return null

  const data = (await res.json()) as {
    features?: { center?: [number, number] }[]
  }
  const center = data.features?.[0]?.center
  if (!center) return null

  return { lng: center[0], lat: center[1] }
}
