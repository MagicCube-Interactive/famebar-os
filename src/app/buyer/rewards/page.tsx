'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { PLATFORM_CONFIG } from '@/types';

interface TokenTransaction {
  id: string;
  date: string;
  type: 'earned' | 'pending' | 'spent' | 'clawedback';
  amount: number;
  order_id: string | null;
}

type LedgerFilter = 'all' | 'earned' | 'spent' | 'pending';

export default function RewardsPage() {
  const { user, role } = useAuthContext();
  const [fameBalance, setFameBalance] = useState(0);
  const [holdToSaveTier, setHoldToSaveTier] = useState(0);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('all');

  useEffect(() => {
    if (!user || role !== 'buyer') return;

    const fetchData = async () => {
      const supabase = createClient();

      const [profileResult, ordersResult] = await Promise.all([
        supabase
          .from('buyer_profiles')
          .select('fame_balance, hold_to_save_tier')
          .eq('id', user.id)
          .single(),

        // Get buyer's order IDs to look up token events
        supabase
          .from('orders')
          .select('id')
          .eq('buyer_id', user.id),
      ]);

      if (profileResult.data) {
        setFameBalance(Number(profileResult.data.fame_balance));
        setHoldToSaveTier(Number(profileResult.data.hold_to_save_tier));
      }

      const orderIds = (ordersResult.data || []).map((o: any) => o.id);
      if (orderIds.length > 0) {
        const { data: tokenData } = await supabase
          .from('token_events')
          .select('id, order_id, final_tokens, status, created_at')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false })
          .limit(50);

        setTransactions(
          (tokenData || []).map((t: any) => ({
            id: t.id,
            date: t.created_at?.split('T')[0] || '',
            type: t.status === 'available' ? 'earned' : t.status === 'pending' ? 'pending' : t.status === 'spent' ? 'spent' : 'clawedback',
            amount: Number(t.final_tokens),
            order_id: t.order_id,
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, [user, role]);

  if (!user || role !== 'buyer') return null;

  const totalEarned = transactions.filter(t => t.type === 'earned').reduce((s, t) => s + t.amount, 0);
  const totalPending = transactions.filter(t => t.type === 'pending').reduce((s, t) => s + t.amount, 0);

  const tierThresholds = [10000, 25000, 50000, 100000];
  const currentTierIndex = tierThresholds.findIndex(t => fameBalance < t);
  const nextThreshold = currentTierIndex >= 0 ? tierThresholds[currentTierIndex] : 100000;
  const tokensToNextTier = nextThreshold - fameBalance;

  const tierLabel = holdToSaveTier === 0 ? 'Bronze (No Discount)' : holdToSaveTier === 5 ? 'Silver' : holdToSaveTier === 10 ? 'Gold' : holdToSaveTier === 15 ? 'Diamond' : 'Platinum';

  // Compute daily earning rate from earned transactions (rough average over last 30 days)
  const earnedTxs = transactions.filter(t => t.type === 'earned');
  const dailyRate = earnedTxs.length > 0
    ? Math.round((totalEarned / Math.max(earnedTxs.length, 1)) * 100) / 100
    : 0;

  // Mini bar chart heights from recent transactions
  const recentBars = earnedTxs.slice(0, 7).reverse();
  const maxBar = Math.max(...recentBars.map(t => t.amount), 1);

  // Filtered transactions for ledger
  const filteredTransactions = ledgerFilter === 'all'
    ? transactions
    : transactions.filter(t => t.type === ledgerFilter);

  const tiers = [
    { threshold: 10000, label: '10K', pct: 5, desc: 'Silver tier -- 5% Hold-to-Save discount', romanNum: 'I' },
    { threshold: 25000, label: '25K', pct: 10, desc: 'Gold tier -- 10% Hold-to-Save discount', romanNum: 'II' },
    { threshold: 50000, label: '50K', pct: 15, desc: 'Diamond tier -- 15% Hold-to-Save discount', romanNum: 'III' },
    { threshold: 100000, label: '100K', pct: 20, desc: 'Platinum tier -- 20% Hold-to-Save discount', romanNum: 'IV' },
  ];

  // Determine which tier is the active one (highest unlocked)
  const activeTierIdx = (() => {
    let idx = -1;
    for (let i = 0; i < tiers.length; i++) {
      if (fameBalance >= tiers[i].threshold) idx = i;
    }
    return idx;
  })();

  const txTypeIcon = (type: string) => {
    switch (type) {
      case 'earned': return { bg: 'bg-secondary/10', text: 'text-secondary', label: 'Tokens Earned' };
      case 'pending': return { bg: 'bg-primary/10', text: 'text-primary', label: 'Pending Settlement' };
      case 'spent': return { bg: 'bg-primary-fixed-dim/10', text: 'text-primary-fixed-dim', label: 'Tokens Spent' };
      case 'clawedback': return { bg: 'bg-error/10', text: 'text-error', label: 'Clawed Back' };
      default: return { bg: 'bg-primary/10', text: 'text-primary', label: type };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <p className="text-sm font-medium text-on-surface/60 tracking-widest uppercase">
              Total $FAME Balance
            </p>
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-fixed-dim">
              {fameBalance.toLocaleString()}
            </h1>
            <p className="text-sm text-on-surface/50">
              Equivalent to ${(fameBalance * PLATFORM_CONFIG.FAME_TO_USD).toFixed(2)} USD
            </p>
          </div>

          {/* Mining Rate Card */}
          <div className="w-full md:w-80 bg-surface-container-high/60 backdrop-blur-xl p-6 rounded-xl border border-outline-variant/10 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xs font-bold text-on-surface/60 uppercase tracking-widest">
                  Mining Rate
                </h3>
                <p className="text-2xl font-mono text-secondary">
                  +{dailyRate.toLocaleString()}{' '}
                  <span className="text-xs text-on-surface">/DAY</span>
                </p>
              </div>
              <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
            </div>
            <div className="h-16 flex items-end gap-1">
              {recentBars.length > 0 ? (
                recentBars.map((bar, i) => (
                  <div
                    key={bar.id}
                    className={`flex-1 rounded-t-sm ${i === recentBars.length - 1 ? 'bg-secondary' : 'bg-secondary/20'}`}
                    style={{ height: `${Math.max(10, (bar.amount / maxBar) * 100)}%` }}
                  />
                ))
              ) : (
                <>
                  <div className="flex-1 bg-secondary/20 rounded-t-sm h-[20%]" />
                  <div className="flex-1 bg-secondary/20 rounded-t-sm h-[30%]" />
                  <div className="flex-1 bg-secondary/20 rounded-t-sm h-[25%]" />
                  <div className="flex-1 bg-secondary/20 rounded-t-sm h-[40%]" />
                  <div className="flex-1 bg-secondary/20 rounded-t-sm h-[35%]" />
                  <div className="flex-1 bg-secondary/20 rounded-t-sm h-[50%]" />
                  <div className="flex-1 bg-secondary/10 rounded-t-sm h-[15%]" />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/5">
          <p className="text-xs font-bold text-on-surface/50 uppercase tracking-widest mb-1">Earned</p>
          <p className="text-2xl font-bold text-secondary">{totalEarned.toLocaleString()}</p>
        </div>
        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/5">
          <p className="text-xs font-bold text-on-surface/50 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-2xl font-bold text-primary">{totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/5">
          <p className="text-xs font-bold text-on-surface/50 uppercase tracking-widest mb-1">Tier</p>
          <p className="text-2xl font-bold text-primary-fixed-dim">{tierLabel}</p>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Growth Horizon Tier Ladder */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xl font-semibold tracking-tight text-on-surface">Growth Horizon</h2>

          {/* Progress to next tier */}
          {currentTierIndex >= 0 && currentTierIndex < 4 && (
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/5">
              <div className="flex justify-between text-xs text-on-surface/50 mb-1">
                <span>{fameBalance.toLocaleString()}</span>
                <span>{nextThreshold.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-fixed-dim transition-all duration-500"
                  style={{ width: `${Math.min(100, (fameBalance / nextThreshold) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-primary mt-2">
                {tokensToNextTier.toLocaleString()} to next tier
              </p>
            </div>
          )}

          <div className="space-y-4">
            {[...tiers].reverse().map((tier, _revIdx) => {
              const tierIdx = tiers.length - 1 - _revIdx;
              const unlocked = fameBalance >= tier.threshold;
              const isActive = tierIdx === activeTierIdx;
              const isLocked = !unlocked;

              return (
                <div
                  key={tier.threshold}
                  className={`relative p-6 rounded-xl transition-all ${
                    isActive
                      ? 'bg-surface-container-high border-2 border-primary shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                      : unlocked
                        ? 'bg-surface-container-low opacity-60'
                        : 'bg-surface-container border border-outline-variant/5 hover:border-primary/20'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" />
                  )}

                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono ${isActive ? 'text-primary' : 'text-on-surface/50'}`}>
                          THRESHOLD {tier.romanNum}
                        </span>
                        {isActive && (
                          <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-bold text-on-surface">
                        {tier.threshold.toLocaleString()} $FAME
                      </p>
                    </div>

                    {isLocked ? (
                      <svg className="w-5 h-5 text-surface-container-highest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : isActive ? (
                      <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  {(isActive || isLocked) && (
                    <div className={`mt-4 text-sm ${isActive ? 'text-on-surface' : 'text-on-surface/50'}`}>
                      {tier.desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Redemptions + Ledger */}
        <div className="lg:col-span-8 space-y-10">
          {/* Vault Redemptions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-on-surface">Vault Redemptions</h2>
              <span className="text-primary text-sm font-bold">Coming Soon</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placeholder redemption card 1 */}
              <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
                <div className="h-32 bg-surface-container-highest relative flex items-center justify-center">
                  <div className="text-center text-on-surface/30">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-widest">Exclusive Merch</p>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-black/60 text-[10px] font-bold text-on-surface px-2 py-1 rounded backdrop-blur-sm">
                      LIMITED EDITION
                    </span>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-on-surface">Exclusive Hoodie</h4>
                    <p className="text-sm text-on-surface/50">Premium Heavyweight Cotton</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-primary font-bold">12,000</span>
                    <span className="text-[10px] text-on-surface/50 font-mono">$FAME</span>
                  </div>
                </div>
              </div>

              {/* Placeholder redemption card 2 */}
              <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
                <div className="h-32 bg-surface-container-highest relative flex items-center justify-center">
                  <div className="text-center text-on-surface/30">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-widest">Alpha Pass</p>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-primary/20 text-[10px] font-bold text-primary px-2 py-1 rounded backdrop-blur-sm">
                      RARE DROP
                    </span>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-on-surface">Season Pass</h4>
                    <p className="text-sm text-on-surface/50">Early Access &amp; Airdrops</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-primary font-bold">45,000</span>
                    <span className="text-[10px] text-on-surface/50 font-mono">$FAME</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger History */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-on-surface">Ledger History</h2>
              <div className="flex bg-surface-container-low p-1 rounded-full">
                {(['all', 'earned', 'spent', 'pending'] as LedgerFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLedgerFilter(filter)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-full capitalize transition-colors ${
                      ledgerFilter === filter
                        ? 'bg-surface-container-highest text-on-surface'
                        : 'text-on-surface/50 hover:text-on-surface'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container rounded-xl overflow-hidden">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-on-surface/40 text-sm">
                  {transactions.length === 0
                    ? 'No token transactions yet. Start shopping to earn $FAME!'
                    : `No ${ledgerFilter} transactions found.`}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-surface-container-high/50 text-on-surface/50 uppercase text-[10px] tracking-widest font-bold">
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Activity</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {filteredTransactions.map((tx) => {
                        const style = txTypeIcon(tx.type);
                        const isDebit = tx.type === 'spent' || tx.type === 'clawedback';
                        return (
                          <tr key={tx.id} className="hover:bg-surface-container-high transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-on-surface/50">
                              {tx.id.slice(0, 10).toUpperCase()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center`}>
                                  {tx.type === 'earned' && (
                                    <svg className={`w-4 h-4 ${style.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                  )}
                                  {tx.type === 'pending' && (
                                    <svg className={`w-4 h-4 ${style.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                  {tx.type === 'spent' && (
                                    <svg className={`w-4 h-4 ${style.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                    </svg>
                                  )}
                                  {tx.type === 'clawedback' && (
                                    <svg className={`w-4 h-4 ${style.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-on-surface">{style.label}</p>
                                  {tx.order_id && (
                                    <p className="text-[10px] text-on-surface/40 font-mono">
                                      Order {tx.order_id.slice(0, 8).toUpperCase()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-on-surface/50">{tx.date}</td>
                            <td className={`px-6 py-4 text-right font-bold ${
                              isDebit ? 'text-primary-fixed-dim' : tx.type === 'pending' ? 'text-primary' : 'text-secondary'
                            }`}>
                              {isDebit ? '-' : '+'}{tx.amount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5">
        <h3 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-widest">How $FAME Works</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-on-surface/60">
          <div>
            <p className="font-mono text-primary text-lg mb-1">10x</p>
            <p>Earn 10 $FAME per $1 spent</p>
          </div>
          <div>
            <p className="font-mono text-primary text-lg mb-1">14d</p>
            <p>Settlement window before tokens unlock</p>
          </div>
          <div>
            <p className="font-mono text-primary text-lg mb-1">10K+</p>
            <p>Hold to unlock your first 5% discount</p>
          </div>
          <div>
            <p className="font-mono text-primary text-lg mb-1">$0.01</p>
            <p>1 $FAME ecosystem credit value</p>
          </div>
        </div>
      </div>
    </div>
  );
}
