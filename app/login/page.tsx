'use client'

import { useActionState } from 'react'
import { signIn } from './actions'
import type { LoginState } from './actions'

const initialState: LoginState = { error: null }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Revv</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your dashboard</p>
        </div>

        <form action={formAction} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
