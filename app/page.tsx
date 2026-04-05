import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'

const SERVICES = [
  { icon: '🔧', label: 'Oil Change' },
  { icon: '🛑', label: 'Brake Service' },
  { icon: '🔋', label: 'Battery Replacement' },
  { icon: '🔍', label: 'Engine Diagnostic' },
  { icon: '❄️', label: 'AC Service' },
  { icon: '⚙️', label: 'Transmission Service' },
  { icon: '🔄', label: 'Tire Rotation' },
  { icon: '🛠️', label: 'And More' },
]

const HOW_IT_WORKS = [
  { step: '1', title: 'Book Online', desc: 'Tell us your vehicle, service needed, and where you are.' },
  { step: '2', title: 'We Come to You', desc: 'A certified technician arrives at your home, work, or wherever.' },
  { step: '3', title: 'Done', desc: 'We handle the repair on-site. No tow truck, no waiting room.' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <SiteNav />

      {/* Hero */}
      <section className="bg-gray-50 py-24 px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-2xl mx-auto">
          Auto repair that comes to you
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-md mx-auto">
          Certified mobile mechanics. No shop visit, no hassle — we fix your car at home or work.
        </p>
        <Link
          href="/book"
          className="inline-block mt-8 bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-blue-700 transition-colors shadow-sm"
        >
          Book a Service
        </Link>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Services we offer</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SERVICES.map(({ icon, label }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-5 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to get started?</h2>
        <p className="text-gray-500 mb-6 text-sm">Book in minutes. We handle the rest.</p>
        <Link
          href="/book"
          className="inline-block bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-blue-700 transition-colors shadow-sm"
        >
          Book a Service
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Revv. All rights reserved.
      </footer>
    </div>
  )
}
