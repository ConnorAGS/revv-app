'use client'

import { useState } from 'react'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function PhoneInput({
  name = 'phone',
  required = false,
  className = '',
  onChange,
}: {
  name?: string
  required?: boolean
  className?: string
  onChange?: (value: string) => void
}) {
  const [value, setValue] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value)
    setValue(formatted)
    onChange?.(formatted)
  }

  return (
    <input
      type="tel"
      name={name}
      required={required}
      value={value}
      placeholder="555-123-4567"
      onChange={handleChange}
      className={className}
    />
  )
}
