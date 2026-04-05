'use client'

import { JobsMap } from './JobsMap'
import type { Booking } from './JobsTable'

export function AdminMapSection({ bookings }: { bookings: Booking[] }) {
  return <JobsMap bookings={bookings} />
}
