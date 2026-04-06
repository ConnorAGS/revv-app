'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/book', label: 'Book a Service' },
  { href: '/track', label: 'Track a Job' },
]

export function SiteNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#08090C]/95 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-display text-2xl text-red-600 tracking-wider">
          REVV
        </Link>

        <nav className="hidden sm:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname === href ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white font-medium transition-colors">
            Sign in
          </Link>
          <Link
            href="/book"
            className="text-sm font-bold bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.25)] hover:shadow-[0_0_30px_rgba(220,38,38,0.45)]"
          >
            Book Now
          </Link>
        </div>

        <button
          className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden bg-[#08090C] border-t border-white/5 px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`block py-2.5 text-sm font-medium transition-colors ${
                pathname === href ? 'text-white' : 'text-gray-400'
              }`}
            >
              {label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium text-gray-400">
            Sign in
          </Link>
          <Link
            href="/book"
            onClick={() => setMenuOpen(false)}
            className="block mt-3 text-center bg-red-600 text-white text-sm font-bold px-4 py-3 rounded-xl"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  )
}
