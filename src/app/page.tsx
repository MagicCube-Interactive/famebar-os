import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container/5 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center relative z-10 max-w-lg">
        {/* Logo */}
        <h1 className="text-5xl md:text-6xl font-black mb-3">
          <span className="text-on-surface">Fame</span>
          <span className="bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">Bar</span>
        </h1>
        <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant font-medium mb-2">OS</p>
        <p className="text-on-surface-variant text-lg mb-10">
          Direct-selling excellence, powered by data.
        </p>

        {/* CTA */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all shadow-lg shadow-primary-container/20"
        >
          Sign In
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>

        {/* Stats strip */}
        <div className="mt-16 flex items-center justify-center gap-8 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-container">4</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Portals</p>
          </div>
          <div className="w-px h-8 bg-outline-variant/30" />
          <div>
            <p className="text-2xl font-bold text-secondary">Real-time</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Analytics</p>
          </div>
          <div className="w-px h-8 bg-outline-variant/30" />
          <div>
            <p className="text-2xl font-bold text-primary-container">$FAME</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Token Economy</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-[10px] uppercase tracking-widest text-on-surface-variant/50">
        Aureum Obsidian v1.0
      </p>
    </main>
  );
}
