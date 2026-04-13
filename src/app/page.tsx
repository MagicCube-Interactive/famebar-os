'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleJoinNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter your invite code');
      return;
    }

    try {
      setIsValidating(true);
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('code', trimmed)
        .eq('is_active', true)
        .single();

      if (queryError || !data) {
        setError('Invalid or expired invite code. Ask your sponsor for a valid link.');
        return;
      }

      router.push(`/register?ref=${encodeURIComponent(data.code)}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-on-surface relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-container/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* ================================================================ */}
      {/* HERO SECTION */}
      {/* ================================================================ */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-16 md:pt-28 md:pb-20">
        {/* Logo */}
        <h1 className="text-6xl md:text-7xl font-display font-black mb-4 tracking-tight">
          <span className="text-on-surface">Fame</span>
          <span className="bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">Club</span>
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl text-center max-w-xl mb-6">
          Share a $25 premium product. Keep 50% in community commissions. Earn $FAME tokens on every sale.
        </p>

        {/* Stats strip */}
        <div className="flex items-center justify-center gap-6 md:gap-10 mb-12">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-black text-primary-container">$25</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Per Unit</p>
          </div>
          <div className="w-px h-10 bg-outline-variant/30" />
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-black text-secondary">50%</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Community Payout</p>
          </div>
          <div className="w-px h-10 bg-outline-variant/30" />
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-black text-primary-container">7</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Tiers Deep</p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* REFERRAL CODE GATE */}
        {/* ============================================================ */}
        <div className="w-full max-w-md">
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
            <h2 className="text-lg font-bold text-on-surface text-center mb-1">Ready to earn?</h2>
            <p className="text-on-surface-variant text-sm text-center mb-5">Enter the invite code from your sponsor</p>

            <form onSubmit={handleJoinNow} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="Enter your invite code"
                disabled={isValidating}
                className="w-full px-4 py-3.5 bg-surface-container-high border border-outline-variant/20 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent disabled:opacity-50 transition text-center text-lg tracking-wider font-mono"
              />

              {error && (
                <p className="text-error text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isValidating}
                className="w-full px-4 py-3.5 bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold rounded-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20 text-sm"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    Join Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* HOW IT WORKS */}
      {/* ================================================================ */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-3">How It Works</h2>
          <p className="text-on-surface-variant text-center mb-12 max-w-lg mx-auto">Three steps from invite to income</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10 text-center relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-on-primary font-black text-lg">1</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Get Invited</h3>
              <p className="text-on-surface-variant text-sm">
                Receive an invite code from an existing ambassador. Every new member joins through a personal referral.
              </p>
              {/* Connector arrow (hidden on mobile) */}
              <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-primary-container/40">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10 text-center relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-on-primary font-black text-lg">2</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Share & Sell</h3>
              <p className="text-on-surface-variant text-sm">
                Share the $25 premium product with your network. Use your personal referral code to track every sale.
              </p>
              <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-primary-container/40">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center mx-auto mb-4">
                <span className="text-on-primary font-black text-lg">3</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Get Paid</h3>
              <p className="text-on-surface-variant text-sm">
                Earn cash commissions on your sales and your team's sales across 7 tiers. Plus $FAME token rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* COMMISSION BREAKDOWN */}
      {/* ================================================================ */}
      <section className="relative z-10 px-6 py-16 md:py-20 bg-surface-container/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-3">50% Community Payout</h2>
          <p className="text-on-surface-variant text-center mb-10 max-w-lg mx-auto">
            Half of every $25 sale flows back to the community through 7 tiers of commissions
          </p>

          {/* Commission tiers visual */}
          <div className="space-y-3">
            {[
              { tier: 'Direct Sale (You)', rate: '25%', amount: '$6.25', width: 'w-full', highlight: true },
              { tier: 'Level 1', rate: '10%', amount: '$2.50', width: 'w-[80%]', highlight: false },
              { tier: 'Level 2', rate: '5%', amount: '$1.25', width: 'w-[60%]', highlight: false },
              { tier: 'Level 3', rate: '4%', amount: '$1.00', width: 'w-[48%]', highlight: false },
              { tier: 'Level 4', rate: '3%', amount: '$0.75', width: 'w-[36%]', highlight: false },
              { tier: 'Level 5', rate: '2%', amount: '$0.50', width: 'w-[24%]', highlight: false },
              { tier: 'Level 6', rate: '1%', amount: '$0.25', width: 'w-[16%]', highlight: false },
            ].map((level) => (
              <div key={level.tier} className="flex items-center gap-4">
                <div className="w-28 md:w-36 text-right shrink-0">
                  <span className={`text-sm font-medium ${level.highlight ? 'text-primary-container' : 'text-on-surface-variant'}`}>
                    {level.tier}
                  </span>
                </div>
                <div className="flex-1 relative">
                  <div
                    className={`${level.width} h-8 rounded-md flex items-center justify-between px-3 transition-all ${
                      level.highlight
                        ? 'bg-gradient-to-r from-primary-container to-primary'
                        : 'bg-surface-container-high border border-outline-variant/10'
                    }`}
                  >
                    <span className={`text-xs font-bold ${level.highlight ? 'text-on-primary' : 'text-on-surface'}`}>
                      {level.rate}
                    </span>
                    <span className={`text-xs font-mono ${level.highlight ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                      {level.amount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 flex items-center justify-center gap-3 bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <span className="text-on-surface-variant text-sm">Total community payout per sale:</span>
            <span className="text-2xl font-black text-primary-container">$12.50</span>
            <span className="text-on-surface-variant text-sm">(50%)</span>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* $FAME TOKENS */}
      {/* ================================================================ */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Text */}
            <div>
              <h2 className="text-2xl md:text-3xl font-black mb-4">
                <span className="text-primary-container">$FAME</span> Token Rewards
              </h2>
              <p className="text-on-surface-variant mb-4">
                Every sale earns you $FAME tokens on top of cash commissions. Tokens are awarded at 10 $FAME per $1 of revenue.
              </p>
              <p className="text-on-surface-variant mb-4">
                Founders (first 20 ambassadors) receive a <span className="text-primary-container font-semibold">2x multiplier</span> on token earnings for their first 6 months.
              </p>
              <p className="text-on-surface-variant">
                Exchange rate: <span className="font-mono text-on-surface">1 $FAME = $0.01</span>
              </p>
            </div>

            {/* Hold-to-Save card */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
              <h3 className="text-lg font-bold text-on-surface mb-4">Hold-to-Save Discounts</h3>
              <p className="text-on-surface-variant text-sm mb-4">
                Hold $FAME in your wallet to unlock personal purchase discounts:
              </p>
              <div className="space-y-2">
                {[
                  { tokens: '10,000', discount: '5%' },
                  { tokens: '25,000', discount: '10%' },
                  { tokens: '50,000', discount: '15%' },
                  { tokens: '100,000', discount: '20%' },
                ].map((tier) => (
                  <div key={tier.tokens} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-container-high">
                    <span className="text-sm text-on-surface-variant font-mono">{tier.tokens} $FAME</span>
                    <span className="text-sm font-bold text-secondary">{tier.discount} off</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* INCOME SIMULATION: THE 50/3 HUSTLE */}
      {/* ================================================================ */}
      <section className="relative z-10 px-6 py-16 md:py-20 bg-surface-container/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-3">The 50/3 Hustle</h2>
          <p className="text-on-surface-variant mb-10 max-w-lg mx-auto">
            A realistic first-month scenario: you sell 50 units and invite 3 friends who each sell 50 units.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Your direct sales */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
              <h3 className="text-sm uppercase tracking-widest text-primary-container font-semibold mb-4">Your Direct Sales</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">50 units x $25</span>
                  <span className="text-on-surface font-mono">$1,250 revenue</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Your 25% commission</span>
                  <span className="text-primary-container font-bold font-mono">$312.50</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">$FAME earned (10/dollar)</span>
                  <span className="text-on-surface font-mono">12,500 $FAME</span>
                </div>
              </div>
            </div>

            {/* Team sales */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
              <h3 className="text-sm uppercase tracking-widest text-secondary font-semibold mb-4">3 Friends x 50 Units Each</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">150 units x $25</span>
                  <span className="text-on-surface font-mono">$3,750 revenue</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Your 10% L1 commission</span>
                  <span className="text-secondary font-bold font-mono">$375.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Their 25% each</span>
                  <span className="text-on-surface-variant font-mono">$312.50/ea</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="mt-8 bg-surface-container rounded-xl p-6 border border-primary-container/20">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <div>
                <p className="text-on-surface-variant text-sm mb-1">Your First Month Total</p>
                <p className="text-4xl md:text-5xl font-black text-primary-container">$687.50</p>
              </div>
              <div className="w-px h-12 bg-outline-variant/30 hidden md:block" />
              <div className="text-center md:text-left">
                <p className="text-on-surface-variant text-sm mb-1">Plus if each friend recruits 3 more (L2)</p>
                <p className="text-2xl font-bold text-secondary">+$562.50</p>
                <p className="text-on-surface-variant text-xs mt-1">9 people x 50 units x 5% = $562.50</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant/10">
              <p className="text-on-surface-variant text-sm">
                Month 1 potential with just 2 tiers active: <span className="text-on-surface font-bold">$1,250.00 in commissions</span> + <span className="text-primary-container font-bold">62,500 $FAME</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* BOTTOM CTA */}
      {/* ================================================================ */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-4">Got Your Code?</h2>
          <p className="text-on-surface-variant mb-6">Scroll back up and enter it to get started, or sign in if you already have an account.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-3.5 bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all shadow-lg shadow-primary-container/20"
            >
              Enter Invite Code
            </button>
            <Link
              href="/login"
              className="px-8 py-3.5 bg-surface-container border border-outline-variant/20 text-on-surface font-medium rounded-lg text-sm hover:bg-surface-container-high transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}
      <footer className="relative z-10 px-6 py-8 border-t border-outline-variant/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-on-surface">Fame</span>
            <span className="text-sm font-black bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">Club</span>
          </div>
          <p className="text-on-surface-variant/50 text-xs">
            Already a member?{' '}
            <Link href="/login" className="text-primary-container hover:text-primary transition">
              Sign In
            </Link>
          </p>
          <p className="text-on-surface-variant/40 text-[10px] uppercase tracking-widest">
            Aureum Obsidian v1.0
          </p>
        </div>
      </footer>
    </main>
  );
}
