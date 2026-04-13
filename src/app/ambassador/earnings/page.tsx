'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createSafeClient } from '@/lib/supabase/safe-client';
import {
  TrendingUp,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

// ---------- types ----------
interface CommissionEvent {
  id: string;
  order_id: string;
  ambassador_id: string;
  tier_level: number;
  rate: number;
  amount: number;
  status: 'pending' | 'available' | 'paid' | 'clawedback';
  source_ambassador_id: string | null;
  created_at: string;
  available_at: string | null;
  paid_at: string | null;
}

interface AmbassadorProfile {
  id: string;
  tier: string;
  personal_sales_this_month: number;
  total_sales: number;
  is_founder: boolean;
}

type Period = 'all' | 'this_month' | 'last_month';

// ---------- helpers ----------
const ACTIVE_REQ = 300; // $300 monthly personal sales requirement

function startOfThisMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function startOfLastMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
}

function endOfLastMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999).toISOString();
}

function fmtCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function tierLabel(level: number): string {
  return level === 0 ? 'Direct' : `L${level}`;
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-fuchsia-500/20 text-fuchsia-300',
  available: 'bg-primary-container/30 text-primary-fixed-dim',
  paid: 'bg-secondary/20 text-secondary',
  clawedback: 'bg-error/20 text-error',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-fuchsia-400',
  available: 'bg-primary-fixed-dim',
  paid: 'bg-secondary',
  clawedback: 'bg-error',
};

const AMOUNT_COLOR: Record<string, string> = {
  pending: 'text-fuchsia-300',
  available: 'text-primary-fixed-dim',
  paid: 'text-secondary',
  clawedback: 'text-error line-through',
};

// ---------- component ----------
export default function EarningsPage() {
  const { user } = useAuthContext();

  const [commissions, setCommissions] = useState<CommissionEvent[]>([]);
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // ---- fetch data ----
  useEffect(() => {
    if (!user) return;

    const safeSupa = createSafeClient();

    async function fetchData() {
      setLoading(true);
      try {
        const [commRes, profRes] = await Promise.all([
          safeSupa
            .from('commission_events')
            .select('*')
            .eq('ambassador_id', user!.id)
            .order('created_at', { ascending: false }),
          safeSupa
            .from('ambassador_profiles')
            .select('id, tier, personal_sales_this_month, total_sales, is_founder')
            .eq('id', user!.id)
            .single(),
        ]);

        if (commRes.data) setCommissions(commRes.data as CommissionEvent[]);
        if (profRes.data) setProfile(profRes.data as AmbassadorProfile);
      } catch (err) {
        console.error('Error loading earnings data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // ---- derived data ----

  // lifetime earnings (exclude clawedback)
  const lifetimeEarnings = useMemo(
    () =>
      commissions
        .filter((c) => c.status !== 'clawedback')
        .reduce((sum, c) => sum + c.amount, 0),
    [commissions],
  );

  // filtered by period
  const periodCommissions = useMemo(() => {
    if (selectedPeriod === 'all') return commissions;
    const from = selectedPeriod === 'this_month' ? startOfThisMonth() : startOfLastMonth();
    const to = selectedPeriod === 'this_month' ? new Date().toISOString() : endOfLastMonth();
    return commissions.filter((c) => c.created_at >= from && c.created_at <= to);
  }, [commissions, selectedPeriod]);

  const periodTotal = useMemo(
    () =>
      periodCommissions
        .filter((c) => c.status !== 'clawedback')
        .reduce((sum, c) => sum + c.amount, 0),
    [periodCommissions],
  );

  // earnings grouped by tier
  const earningsByTier = useMemo(() => {
    const map = new Map<number, { total: number; count: number; rate: number }>();
    for (const c of periodCommissions) {
      if (c.status === 'clawedback') continue;
      const prev = map.get(c.tier_level) || { total: 0, count: 0, rate: c.rate };
      map.set(c.tier_level, {
        total: prev.total + c.amount,
        count: prev.count + 1,
        rate: c.rate,
      });
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, data]) => ({ level, ...data }));
  }, [periodCommissions]);

  // filtered + paginated table
  const filteredCommissions = useMemo(() => {
    if (!searchQuery) return periodCommissions;
    const q = searchQuery.toLowerCase();
    return periodCommissions.filter(
      (c) =>
        c.order_id.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        tierLabel(c.tier_level).toLowerCase().includes(q),
    );
  }, [periodCommissions, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCommissions.length / PAGE_SIZE));
  const pagedCommissions = filteredCommissions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // milestone: progress toward $300 active requirement
  const personalSales = profile?.personal_sales_this_month ?? 0;
  const milestoneProgress = Math.min(100, Math.round((personalSales / ACTIVE_REQ) * 100));
  const milestoneRemaining = Math.max(0, ACTIVE_REQ - personalSales);

  // reset page when period or search changes
  useEffect(() => {
    setPage(1);
  }, [selectedPeriod, searchQuery]);

  // ---- period tabs ----
  const periodTabs: { key: Period; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
  ];

  // ---- loading state ----
  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ========== Hero ========== */}
      <section className="pt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-on-surface-variant font-semibold tracking-wider text-xs uppercase mb-2">
              Total Lifetime Earnings
            </p>
            <h2 className="text-5xl font-black text-secondary leading-none">
              {fmtCurrency(lifetimeEarnings)}
            </h2>
            {selectedPeriod !== 'all' && (
              <div className="flex items-center gap-2 mt-4">
                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {fmtCurrency(periodTotal)}
                </span>
                <span className="text-on-surface-variant text-xs">
                  {selectedPeriod === 'this_month' ? 'this month' : 'last month'}
                </span>
              </div>
            )}
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-xl">
            {periodTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedPeriod(tab.key)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedPeriod === tab.key
                    ? 'bg-surface-container text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Tier Cards + Milestone ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier breakdown cards */}
        <div className="lg:col-span-8">
          <h3 className="text-lg font-semibold text-on-surface mb-4">Earnings by Tier</h3>
          {earningsByTier.length === 0 ? (
            <div className="bg-surface-container-low rounded-xl p-8 text-center text-on-surface-variant text-sm">
              No commissions for this period.
            </div>
          ) : (
            <div className="overflow-x-auto hide-scrollbar">
              <div className="flex gap-4 min-w-max pb-4">
                {earningsByTier.map((tier) => (
                  <div
                    key={tier.level}
                    className={`w-48 rounded-xl p-5 transition-colors ${
                      tier.level === 0
                        ? 'bg-surface-container border-l-4 border-primary'
                        : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <p className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-tighter">
                      {tier.level === 0 ? 'Direct Sales' : `L${tier.level} Network`}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-on-surface-variant text-[10px]">RATE</p>
                        <p className="text-lg font-bold font-mono text-on-surface">
                          {(tier.rate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant text-[10px]">TOTAL EARNED</p>
                        <p
                          className={`text-lg font-bold ${
                            tier.level === 0 ? 'text-secondary' : 'text-on-surface'
                          }`}
                        >
                          {fmtCurrency(tier.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant text-[10px]">ORDERS</p>
                        <p className="text-lg font-bold font-mono text-on-surface">
                          {tier.count}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Next Milestone Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container rounded-xl p-6 border border-primary/10 relative overflow-hidden h-full group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,185,95,0.08),transparent_70%)]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase">
                  Active Requirement
                </span>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-2">
                {milestoneProgress >= 100 ? 'Active Status Achieved' : '$300 Monthly Goal'}
              </h4>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                {milestoneProgress >= 100
                  ? 'You have met the $300 personal sales requirement for this month. Keep going!'
                  : `Reach $300 in personal sales this month to maintain active status. ${fmtCurrency(milestoneRemaining)} remaining.`}
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-on-surface-variant">
                      {fmtCurrency(personalSales)} / {fmtCurrency(ACTIVE_REQ)}
                    </span>
                    <span className="text-primary">{milestoneProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        milestoneProgress >= 100 ? 'bg-secondary' : 'bg-primary'
                      }`}
                      style={{ width: `${milestoneProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== Commission History Table ========== */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        {/* Header with search */}
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-surface-container">
          <h3 className="text-lg font-semibold text-on-surface">Commission History</h3>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                className="w-full bg-surface-container-lowest border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary/40 text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="Search orders..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors">
              <SlidersHorizontal className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-lowest">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/50">
              {pagedCommissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-on-surface-variant"
                  >
                    No commissions found.
                  </td>
                </tr>
              ) : (
                pagedCommissions.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-surface-container/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">
                      {fmtDate(c.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-primary">
                      #{c.order_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-bold text-on-surface">
                        {c.tier_level === 0 ? 'DIRECT' : `L${c.tier_level} NET`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-on-surface">
                      {(c.rate * 100).toFixed(1)}%
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-mono text-right font-bold ${AMOUNT_COLOR[c.status] ?? 'text-on-surface'}`}
                    >
                      {c.status === 'clawedback' ? '-' : '+'}
                      {fmtCurrency(c.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1 text-[10px] font-bold uppercase ${STATUS_STYLE[c.status] ?? ''}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[c.status] ?? 'bg-on-surface-variant'}`}
                        />
                        {c.status}
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
            Showing {filteredCommissions.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, filteredCommissions.length)} of{' '}
            {filteredCommissions.length} entries
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
              .slice(
                Math.max(0, page - 3),
                Math.min(totalPages, page + 2),
              )
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
