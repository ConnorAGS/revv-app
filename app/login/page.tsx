'use client'

import { useActionState, useState } from 'react'
import { signIn } from './actions'
import type { LoginState } from './actions'
import Link from 'next/link'

const initialState: LoginState = { error: null }

export default function LoginPage() {
  const [role, setRole] = useState<'customer' | 'technician'>('customer')
  const [state, formAction, isPending] = useActionState(signIn, initialState)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-4xl text-red-600 tracking-wider">REVV</Link>
          <p className="text-gray-500 text-sm mt-2">Mobile auto repair, at your door.</p>
        </div>

        {/* Role toggle */}
        <div className="flex bg-gray-200 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              role === 'customer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('technician')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              role === 'technician' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Technician
          </button>
        </div>

        {/* Customer view */}
        {role === 'customer' && (
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-3">
            <p className="text-center text-gray-500 text-sm mb-2">
              Get your car fixed — we come to you.
            </p>
            <Link
              href="/book"
              className="block w-full text-center bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-500 transition-colors shadow-[0_4px_20px_rgba(220,38,38,0.2)]"
            >
              Book a Service
            </Link>
            <Link
              href="/track"
              className="block w-full text-center border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Track My Job
            </Link>
          </div>
        )}

        {/* Technician view */}
        {role === 'technician' && (
          <form action={formAction} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
            <p className="text-center text-gray-500 text-sm mb-2">Sign in to your tech dashboard.</p>

            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {state.error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gray-900 text-white rounded-lg py-3 font-bold text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link href="/" className="hover:text-gray-600 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
