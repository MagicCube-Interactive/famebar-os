'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Shield, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

// ---------- types ----------
interface TokenEvent {
  id: string;
  ambassador_id: string;
  order_id: string;
  tokens_earned: number;
  founder_multiplier: number;
  final_tokens: number;
  status: 'pending' | 'available' | 'spent' | 'clawedback';
  created_at: string;
  available_at: string | null;
}

interface AmbassadorProfile {
  id: string;
  is_founder: boolean;
  founder_start_date: string | null;
}

// ---------- Hold-to-Save tiers ----------
const HOLD_TIERS = [
  { required: 10_000, discount: 5, tier: 'Silver' },
  { required: 25_000, discount: 10, tier: 'Gold' },
  { required: 50_000, discount: 15, tier: 'Diamond' },
  { required: 100_000, discount: 20, tier: 'Platinum' },
] as const;

// ---------- helpers ----------
function fmtTokens(n: number): string {
  return n.toLocaleString('en-US');
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  available: 'bg-primary-container/30 text-primary-fixed-dim',
  spent: 'bg-tertiary-container/30 text-tertiary',
  clawedback: 'bg-error/20 text-error',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  available: 'bg-primary-fixed-dim',
  spent: 'bg-tertiary',
  clawedback: 'bg-error',
};

// ---------- component ----------
export default function TokenVaultPage() {
  const { user } = useAuthContext();

  const [tokenEvents, setTokenEvents] = useState<TokenEvent[]>([]);
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // ---- fetch data ----
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function fetchData() {
      setLoading(true);
      try {
        const [tokRes, profRes] = await Promise.all([
          supabase
            .from('token_events')
            .select('*')
            .eq('ambassador_id', user!.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('ambassador_profiles')
            .select('id, is_founder, founder_start_date')
            .eq('id', user!.id)
            .single(),
        ]);

        if (tokRes.data) setTokenEvents(tokRes.data as TokenEvent[]);
        if (profRes.data) setProfile(profRes.data as AmbassadorProfile);
      } catch (err) {
        console.error('Error loading token data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // ---- derived data ----

  const availableBalance = useMemo(
    () =>
      tokenEvents
        .filter((t) => t.status === 'available')
        .reduce((sum, t) => sum + t.final_tokens, 0),
    [tokenEvents],
  );

  const pendingBalance = useMemo(
    () =>
      tokenEvents
        .filter((t) => t.status === 'pending')
        .reduce((sum, t) => sum + t.final_tokens, 0),
    [tokenEvents],
  );

  const totalEarned = useMemo(
    () =>
      tokenEvents
        .filter((t) => t.status !== 'clawedback')
        .reduce((sum, t) => sum + t.final_tokens, 0),
    [tokenEvents],
  );

  const founderMultiplier = profile?.is_founder ? 2 : 1;

  // Hold-to-Save tier
  const currentTierIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < HOLD_TIERS.length; i++) {
      if (availableBalance >= HOLD_TIERS[i].required) idx = i;
    }
    return idx;
  }, [availableBalance]);

  const currentTier = currentTierIndex >= 0 ? HOLD_TIERS[currentTierIndex] : null;
  const nextTier =
    currentTierIndex < HOLD_TIERS.length - 1 ? HOLD_TIERS[currentTierIndex + 1] : null;

  const tierProgress = useMemo(() => {
    if (!nextTier) return 100;
    const base = currentTier ? currentTier.required : 0;
    return Math.min(100, Math.round(((availableBalance - base) / (nextTier.required - base)) * 100));
  }, [availableBalance, currentTier, nextTier]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(tokenEvents.length / PAGE_SIZE));
  const pagedEvents = tokenEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---- loading / auth guard ----
  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ========== Hero ========== */}
      <section className="pt-8">
        <p className="text-on-surface-variant font-semibold tracking-wider text-xs uppercase mb-2">
          Available $FAME Balance
        </p>
        <h2 className="text-5xl font-black text-primary leading-none">
          {fmtTokens(availableBalance)}
        </h2>
      </section>

      {/* ========== Stats Row ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: fmtTokens(pendingBalance), color: 'text-amber-300' },
          { label: 'Available', value: fmtTokens(availableBalance), color: 'text-primary-fixed-dim' },
          { label: 'Total Earned', value: fmtTokens(totalEarned), color: 'text-secondary' },
          {
            label: 'Founder Multiplier',
            value: `${founderMultiplier}x`,
            color: profile?.is_founder ? 'text-primary' : 'text-on-surface-variant',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container rounded-xl p-5"
          >
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <p className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ========== Founder Boost Badge ========== */}
      {profile?.is_founder && (
        <div className="rounded-xl border border-primary/30 bg-surface-container-low p-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl">&#x1f451;</div>
            <div>
              <h3 className="font-bold text-primary">Founder 2x Token Boost Active</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                All tokens earned from sales are multiplied by 2x during your founder window.
              </p>
              {profile.founder_start_date && (
                <p className="mt-2 text-xs text-primary-fixed-dim/70">
                  Founder since:{' '}
                  <span className="font-semibold">{fmtDate(profile.founder_start_date)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== Hold-to-Save Tier ========== */}
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-on-surface">
          <Shield className="h-5 w-5 text-primary-fixed-dim" />
          Hold-to-Save Tier Status
        </h2>

        {/* Current Tier */}
        <div className="mb-6 rounded-lg bg-surface-container p-4">
          <p className="text-xs text-on-surface-variant">Current Tier</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {currentTier ? `${currentTier.tier} Tier` : 'No Tier'}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            {currentTier ? (
              <>
                <span className="font-semibold text-primary">{currentTier.discount}%</span>{' '}
                personal order discount
              </>
            ) : (
              <>Hold at least 10,000 $FAME to unlock Silver tier (5% discount)</>
            )}
          </p>
        </div>

        {/* All tiers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {HOLD_TIERS.map((t, i) => {
            const isActive = currentTierIndex >= i;
            return (
              <div
                key={t.tier}
                className={`rounded-lg p-3 border transition-colors ${
                  isActive
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-outline-variant/10 bg-surface-container'
                }`}
              >
                <p
                  className={`text-xs font-bold ${
                    isActive ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {t.tier}
                </p>
                <p className="text-lg font-bold font-mono text-on-surface">{t.discount}%</p>
                <p className="text-[10px] text-on-surface-variant">
                  {fmtTokens(t.required)} $FAME
                </p>
              </div>
            );
          })}
        </div>

        {/* Progress to next */}
        {nextTier && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-on-surface-variant">Progress to Next Tier</p>
              <p className="text-xs font-semibold text-primary">
                {fmtTokens(nextTier.required - availableBalance)} tokens needed
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full bg-gradient-to-r from-primary-fixed-dim to-primary transition-all duration-500"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <div className="text-xs text-on-surface-variant">
              Next:{' '}
              <span className="font-semibold text-primary">{nextTier.tier} Tier</span> (
              <span className="font-semibold">{nextTier.discount}%</span> discount)
            </div>
          </div>
        )}

        {!nextTier && currentTier && (
          <div className="rounded-lg border border-secondary/20 bg-surface-container-low p-3">
            <p className="text-xs text-secondary">
              <span className="font-semibold">Platinum unlocked!</span> You&apos;ve reached the
              highest tier with 20% discount on all personal orders.
            </p>
          </div>
        )}
      </div>

      {/* ========== Token History Table ========== */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <div className="p-6 border-b border-surface-container">
          <h3 className="text-lg font-semibold text-on-surface">Token History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-lowest">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4 text-right">Base Tokens</th>
                <th className="px-6 py-4 text-center">Multiplier</th>
                <th className="px-6 py-4 text-right">Final Tokens</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/50">
              {pagedEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-on-surface-variant"
                  >
                    No token events found.
                  </td>
                </tr>
              ) : (
                pagedEvents.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-container/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">
                      {fmtDate(t.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-primary">
                      #{t.order_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-on-surface text-right">
                      {fmtTokens(t.tokens_earned)}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.founder_multiplier > 1
                            ? 'bg-primary/20 text-primary'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {t.founder_multiplier}x
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-mono text-right font-bold ${
                        t.status === 'clawedback'
                          ? 'text-error line-through'
                          : t.status === 'spent'
                            ? 'text-tertiary'
                            : 'text-primary'
                      }`}
                    >
                      {t.status === 'clawedback' ? '-' : '+'}
                      {fmtTokens(t.final_tokens)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1 text-[10px] font-bold uppercase ${STATUS_STYLE[t.status] ?? ''}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.status] ?? 'bg-on-surface-variant'}`}
                        />
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 bg-surface-container-lowest flex items-center justify-between">
          <p className="text-xs text-on-surface-variant font-mono">
            Showing {tokenEvents.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, tokenEvents.length)} of {tokenEvents.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-variant transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4 text-on-surface-variant" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    p === page
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container hover:bg-surface-variant text-on-surface'
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-variant transition-colors disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4 text-on-surface-variant" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
