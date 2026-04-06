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
  { step: '01', title: 'Book Online', desc: 'Tell us your vehicle, service needed, and where you are. Takes under 2 minutes.' },
  { step: '02', title: 'We Come to You', desc: 'A certified technician arrives at your home, work, or wherever your car is parked.' },
  { step: '03', title: 'Done.', desc: 'We handle the repair on-site. No tow truck, no waiting room, no hassle.' },
]

function SectionDivider() {
  return (
    <div className="relative h-px w-full overflow-visible">
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.25) 30%, rgba(220,38,38,0.5) 50%, rgba(220,38,38,0.25) 70%, transparent 100%)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)' }}
      />
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#08090C] font-sans">
      <SiteNav />

      {/* Hero */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 overflow-hidden -mt-16 pt-16">
        {/* Atmospheric glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 90% 55% at 50% 105%, rgba(220,38,38,0.12) 0%, transparent 65%)',
          }}
        />
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
          }}
        />
        {/* Top edge line */}
        <div className="absolute top-0 left-0 w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.2), transparent)' }} />

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <div className="fade-up fade-up-1 inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            Certified Mobile Mechanics
          </div>

          <h1 className="fade-up fade-up-2 font-display text-[clamp(4rem,14vw,11rem)] text-white leading-none tracking-wide mb-6">
            Car repair<br />
            <span className="text-red-600">at your door.</span>
          </h1>

          <p className="fade-up fade-up-3 text-gray-400 text-lg max-w-lg mx-auto mb-12 leading-relaxed">
            No shop visit. No waiting room. No tow truck.
            We come to your home, work, or wherever your car is.
          </p>

          <div className="fade-up fade-up-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="w-full sm:w-auto bg-red-600 text-white font-bold px-10 py-4 rounded-2xl text-base hover:bg-red-500 transition-all shadow-[0_0_50px_rgba(220,38,38,0.3)] hover:shadow-[0_0_70px_rgba(220,38,38,0.5)]"
            >
              Book a Service
            </Link>
            <Link
              href="/track"
              className="w-full sm:w-auto text-gray-400 font-semibold px-10 py-4 rounded-2xl text-base border border-gray-800 hover:border-gray-600 hover:text-white transition-all text-center"
            >
              Track a Job →
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#08090C] to-transparent pointer-events-none" />
      </section>

      <SectionDivider />

      {/* Stats bar */}
      <section className="py-14 px-6" style={{ background: 'linear-gradient(180deg, #0D1018 0%, #08090C 100%)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { value: '4.9★', label: 'Average rating' },
            { value: '< 2hr', label: 'Average arrival' },
            { value: '100%', label: 'Mobile service' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-display text-4xl sm:text-5xl text-white tracking-wide mb-1">{value}</p>
              <p className="text-gray-500 text-xs uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* How it works */}
      <section className="py-28 px-6 relative overflow-hidden">
        {/* Diagonal stripe texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <p className="text-red-600 text-xs font-bold tracking-[0.25em] uppercase mb-4">How it works</p>
            <h2 className="font-display text-5xl sm:text-7xl text-white tracking-wide">Three steps to fixed.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="group">
                <div className="font-display text-7xl text-red-600/15 group-hover:text-red-600/30 transition-colors mb-5 leading-none select-none">
                  {step}
                </div>
                <h3 className="font-bold text-white text-xl mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Services */}
      <section className="py-24 px-6 relative" style={{ background: 'linear-gradient(180deg, #08090C 0%, #0D1018 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-red-600 text-xs font-bold tracking-[0.25em] uppercase mb-4">What we do</p>
            <h2 className="font-display text-5xl sm:text-7xl text-white tracking-wide">Services we offer</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICES.map(({ icon, label }) => (
              <div
                key={label}
                className="group bg-[#0E1016] border border-[#1C2030] hover:border-red-600/30 rounded-2xl px-4 py-6 text-center transition-all hover:bg-[#121620] cursor-default"
              >
                <div className="text-2xl mb-3">{icon}</div>
                <p className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* CTA */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(220,38,38,0.07) 0%, transparent 70%)' }}
        />
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="font-display text-6xl sm:text-8xl text-white tracking-wide mb-6">
            Ready to roll?
          </h2>
          <p className="text-gray-500 mb-12 text-lg">Book in minutes. We handle the rest.</p>
          <Link
            href="/book"
            className="inline-block bg-red-600 text-white font-bold px-14 py-5 rounded-2xl text-lg hover:bg-red-500 transition-all shadow-[0_0_60px_rgba(220,38,38,0.35)] hover:shadow-[0_0_90px_rgba(220,38,38,0.55)]"
          >
            Book a Service
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-gray-700">
        © {new Date().getFullYear()} Revv. All rights reserved.
      </footer>
    </div>
  )
}
