export type VehicleDecodeResult = {
  year: string | null
  make: string | null
  model: string | null
  trim: string | null
  engine: string | null
  bodyClass: string | null
  driveType: string | null
  fuelType: string | null
}

export async function decodeVin(vin: string): Promise<VehicleDecodeResult | null> {
  if (!vin || vin.length < 11) return null

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${encodeURIComponent(vin)}?format=json`,
      { cache: 'force-cache' }
    )
    if (!res.ok) return null
    const data = await res.json()
    const results: { Variable: string; Value: string | null }[] = data.Results ?? []

    const get = (key: string) => {
      const val = results.find(r => r.Variable === key)?.Value
      return val && val !== 'Not Applicable' && val !== '0' ? val : null
    }

    const cylinders = get('Engine Number of Cylinders')
    const displacement = get('Displacement (L)')
    const engineStr = displacement && cylinders
      ? `${parseFloat(displacement).toFixed(1)}L ${cylinders}-cyl`
      : displacement
        ? `${parseFloat(displacement).toFixed(1)}L`
        : null

    return {
      year:      get('Model Year'),
      make:      get('Make'),
      model:     get('Model'),
      trim:      get('Trim'),
      engine:    engineStr,
      bodyClass: get('Body Class'),
      driveType: get('Drive Type'),
      fuelType:  get('Fuel Type - Primary'),
    }
  } catch {
    return null
  }
}
