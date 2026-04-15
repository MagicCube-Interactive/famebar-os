'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createSafeClient } from '@/lib/supabase/safe-client';

interface AdminMetrics {
  dailyGMV: number;
  monthlyGMV: number;
  totalPendingCommissions: number;
  totalAvailableCommissions: number;
  totalPaidCommissions: number;
  tokenLiabilities: number;
  totalAmbassadors: number;
  activeAmbassadors: number;
  totalOrders: number;
  ordersToday: number;
  refundCount: number;
  pendingSettlementCount: number;
}

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'realtime' | 'historical'>('realtime');
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [settlementResult, setSettlementResult] = useState<{
    settledCount: number;
    totalCommissionReleased: number;
    totalTokensReleased: number;
  } | null>(null);

  const handleRunSettlement = async () => {
    setSettlementLoading(true);
    setNotification(null);
    setSettlementResult(null);
    try {
      const res = await fetch('/api/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysOld: 14 }),
      });
      const data = await res.json();
      if (data.success) {
        setSettlementResult({
          settledCount: data.settledCount,
          totalCommissionReleased: data.totalCommissionReleased,
          totalTokensReleased: data.totalTokensReleased,
        });
        setNotification({
          type: 'success',
          message: `Settlement complete: ${data.settledCount} order${data.settledCount !== 1 ? 's' : ''} settled, ${fmt(data.totalCommissionReleased)} commissions released.`,
        });
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Settlement failed. Please try again.',
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error during settlement.',
      });
    } finally {
      setSettlementLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const safe = createSafeClient();
      const supabase = createClient(); // kept for campaigns (not in safe-client whitelist)
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [
        dailyOrdersResult,
        monthlyOrdersResult,
        pendingCommResult,
        availCommResult,
        paidCommResult,
        tokenResult,
        totalAmbResult,
        activeAmbResult,
        totalOrdersResult,
        refundResult,
        pendingSettleResult,
        campaignsResult,
      ] = await Promise.all([
        // Daily GMV
        safe
          .from('orders')
          .select('total')
          .gte('created_at', today)
          .eq('payment_status', 'paid'),

        // Monthly GMV
        safe
          .from('orders')
          .select('total')
          .gte('created_at', monthStart)
          .eq('payment_status', 'paid'),

        // Pending commissions
        safe
          .from('commission_events')
          .select('amount')
          .eq('status', 'pending'),

        // Available commissions
        safe
          .from('commission_events')
          .select('amount')
          .eq('status', 'available'),

        // Paid commissions
        safe
          .from('commission_events')
          .select('amount')
          .eq('status', 'paid'),

        // Token liabilities (pending + available)
        safe
          .from('token_events')
          .select('final_tokens')
          .in('status', ['pending', 'available']),

        // Total ambassadors
        safe
          .from('ambassador_profiles')
          .select('id'),

        // Active ambassadors (hit $300 personal sales)
        safe
          .from('ambassador_profiles')
          .select('id')
          .eq('is_active', true),

        // Total orders
        safe
          .from('orders')
          .select('id'),

        // Refund requests
        safe
          .from('orders')
          .select('id')
          .eq('payment_status', 'refunded'),

        // Pending settlement orders
        safe
          .from('orders')
          .select('id')
          .eq('settlement_status', 'pending')
          .eq('payment_status', 'paid'),

        // Campaigns (not in safe-client whitelist, use regular client)
        supabase
          .from('campaigns')
          .select('id, name, status, metrics')
          .eq('status', 'active')
          .limit(3),
      ]);

      const dailyGMV = (dailyOrdersResult.data || []).reduce((s: number, r: any) => s + Number(r.total), 0);
      const monthlyGMV = (monthlyOrdersResult.data || []).reduce((s: number, r: any) => s + Number(r.total), 0);
      const pendingComm = (pendingCommResult.data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      const availComm = (availCommResult.data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      const paidComm = (paidCommResult.data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      const tokenLiabilities = (tokenResult.data || []).reduce((s: number, r: any) => s + Number(r.final_tokens), 0);

      setMetrics({
        dailyGMV,
        monthlyGMV,
        totalPendingCommissions: pendingComm,
        totalAvailableCommissions: availComm,
        totalPaidCommissions: paidComm,
        tokenLiabilities,
        totalAmbassadors: totalAmbResult.data?.length || 0,
        activeAmbassadors: activeAmbResult.data?.length || 0,
        totalOrders: totalOrdersResult.data?.length || 0,
        ordersToday: dailyOrdersResult.data?.length || 0,
        refundCount: refundResult.data?.length || 0,
        pendingSettlementCount: pendingSettleResult.data?.length || 0,
      });

      setCampaigns(campaignsResult.data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const fmt = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtCompact = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : fmt(n);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary-container border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface">
            OPS COCKPIT
          </h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">
            Live Global Operations Instance:{' '}
            <span className="text-primary-fixed-dim">FB-OS-PRIME-01</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('realtime')}
            className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${
              activeTab === 'realtime'
                ? 'bg-primary-container text-on-primary-container'
                : 'text-gray-500 hover:text-on-surface'
            }`}
          >
            REAL-TIME
          </button>
          <button
            onClick={() => setActiveTab('historical')}
            className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${
              activeTab === 'historical'
                ? 'bg-primary-container text-on-primary-container'
                : 'text-gray-500 hover:text-on-surface'
            }`}
          >
            HISTORICAL
          </button>
        </div>
      </header>

      {/* ── Inline Notification ── */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-lg p-3 ${
            notification.type === 'success'
              ? 'bg-secondary/10 border border-secondary/30 text-secondary'
              : 'bg-error/10 border border-error/30 text-error'
          }`}
        >
          <p className="text-xs font-bold">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-sm font-bold opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── Settlement Results ── */}
      {settlementResult && settlementResult.settledCount > 0 && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3">
          <p className="text-xs font-bold text-secondary mb-1">Settlement Results</p>
          <div className="grid grid-cols-3 gap-4 text-[10px] font-mono text-secondary">
            <div>
              <span className="text-gray-500">ORDERS SETTLED:</span>{' '}
              <span className="font-bold">{settlementResult.settledCount}</span>
            </div>
            <div>
              <span className="text-gray-500">COMMISSIONS RELEASED:</span>{' '}
              <span className="font-bold">{fmt(settlementResult.totalCommissionReleased)}</span>
            </div>
            <div>
              <span className="text-gray-500">TOKENS RELEASED:</span>{' '}
              <span className="font-bold">{settlementResult.totalTokensReleased.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Stats Row (6 cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Daily GMV */}
        <div className="bg-surface-container-low p-4 rounded-lg border-b-2 border-secondary">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Daily GMV</p>
          <h3 className="text-2xl font-black text-secondary mt-1">{fmt(metrics.dailyGMV)}</h3>
          <p className="text-[10px] font-mono text-secondary/70 mt-1">
            {metrics.ordersToday} ORDERS TODAY
          </p>
        </div>

        {/* Monthly GMV */}
        <div className="bg-surface-container-low p-4 rounded-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Monthly GMV</p>
          <h3 className="text-2xl font-black text-on-surface mt-1">{fmtCompact(metrics.monthlyGMV)}</h3>
          <p className="text-[10px] font-mono text-secondary mt-1">THIS MONTH</p>
        </div>

        {/* Pending Payouts */}
        <div className="bg-surface-container-low p-4 rounded-lg border-b-2 border-primary-container">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pending Payouts</p>
          <h3 className="text-2xl font-black text-primary-container mt-1">
            {fmtCompact(metrics.totalPendingCommissions + metrics.totalAvailableCommissions)}
          </h3>
          <p className="text-[10px] font-mono text-primary-fixed-dim/70 mt-1">EST. 48H CLEAR</p>
        </div>

        {/* Token Liabilities */}
        <div className="bg-surface-container-low p-4 rounded-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Token Liabilities</p>
          <h3 className="text-2xl font-black text-primary mt-1">
            {metrics.tokenLiabilities >= 1_000_000
              ? `${(metrics.tokenLiabilities / 1_000_000).toFixed(2)}M`
              : metrics.tokenLiabilities.toLocaleString()}{' '}
            <span className="text-xs font-mono">$FAME</span>
          </h3>
          <p className="text-[10px] font-mono text-gray-600 mt-1">
            VALUE: {fmt(metrics.tokenLiabilities * 0.01)}
          </p>
        </div>

        {/* Active Ambassadors */}
        <div className="bg-surface-container-low p-4 rounded-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Ambassadors</p>
          <h3 className="text-2xl font-black text-on-surface mt-1">
            {metrics.activeAmbassadors.toLocaleString()}
          </h3>
          <p className="text-[10px] font-mono text-gray-600 mt-1">
            OF {metrics.totalAmbassadors.toLocaleString()} TOTAL
          </p>
        </div>

        {/* Fraud Queue */}
        <div className="bg-surface-container-low p-4 rounded-lg border border-error/50">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fraud Queue</p>
          <h3 className="text-2xl font-black text-error mt-1">{metrics.refundCount}</h3>
          <p className="text-[10px] font-mono text-error/70 mt-1 uppercase">Immediate Action</p>
        </div>
      </div>

      {/* ── 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column (8/12) ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Queue Alerts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container flex items-center p-4 rounded border-l-4 border-error">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400">Orders Review</p>
                <p className="text-2xl font-black text-on-surface">{metrics.pendingSettlementCount}</p>
              </div>
              <svg className="w-8 h-8 text-error opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <div className="bg-surface-container flex items-center p-4 rounded border-l-4 border-error">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400">Missing Payout Info</p>
                <p className="text-2xl font-black text-on-surface">{metrics.refundCount}</p>
              </div>
              <svg className="w-8 h-8 text-error opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
              </svg>
            </div>
            <div className="bg-surface-container flex items-center p-4 rounded border-l-4 border-error">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400">Pending Approvals</p>
                <p className="text-2xl font-black text-on-surface">{metrics.totalOrders > 0 ? Math.min(5, metrics.totalOrders) : 0}</p>
              </div>
              <svg className="w-8 h-8 text-error opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily GMV Bar Chart Mockup */}
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/5">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-bold tracking-tight text-gray-400 uppercase">
                  Daily GMV Line (30D)
                </h4>
                <svg className="w-5 h-5 text-primary-fixed-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
              </div>
              <div className="h-48 flex items-end gap-1 px-2">
                <div className="w-full bg-primary-container/20 h-[30%] rounded-t-sm" />
                <div className="w-full bg-primary-container/30 h-[45%] rounded-t-sm" />
                <div className="w-full bg-primary-container/40 h-[60%] rounded-t-sm" />
                <div className="w-full bg-primary-container/20 h-[40%] rounded-t-sm" />
                <div className="w-full bg-primary-container/50 h-[75%] rounded-t-sm" />
                <div className="w-full bg-primary-container/70 h-[90%] rounded-t-sm" />
                <div className="w-full bg-primary-container/60 h-[80%] rounded-t-sm" />
                <div className="w-full bg-primary-container h-[100%] rounded-t-sm" />
                <div className="w-full bg-primary-container/40 h-[55%] rounded-t-sm" />
                <div className="w-full bg-primary-container/30 h-[40%] rounded-t-sm" />
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-mono text-gray-600">
                <span>01 DAY</span>
                <span>15 DAY</span>
                <span>30 DAY</span>
              </div>
            </div>

            {/* Commission by Tier Donut Mockup */}
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/5">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-bold tracking-tight text-gray-400 uppercase">
                  Commission by Tier
                </h4>
                <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                </svg>
              </div>
              <div className="flex items-center justify-center h-48">
                <div className="relative w-40 h-40 rounded-full border-[20px] border-primary-container flex items-center justify-center">
                  <div className="absolute inset-0 w-full h-full rounded-full border-[20px] border-secondary border-t-transparent border-r-transparent border-b-transparent rotate-[45deg]" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-on-surface">64%</p>
                    <p className="text-[10px] text-gray-500 uppercase">Elite Tier</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-container" />
                  <span className="text-[10px] font-mono text-gray-400">ELITE: 64%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-[10px] font-mono text-gray-400">PRO: 22%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-tertiary" />
                  <span className="text-[10px] font-mono text-gray-400">BASE: 14%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Global Order Ledger (Bloomberg-style table) */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
            <div className="bg-surface-container px-6 py-3 flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Global Order Ledger
              </h4>
              <span className="text-[10px] font-mono text-secondary">LIVE FEED ON</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="border-b border-outline-variant/10">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-mono text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-[10px] font-mono text-gray-500 uppercase">Entity</th>
                    <th className="px-6 py-3 text-[10px] font-mono text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-[10px] font-mono text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-[10px] font-mono text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {/* Paid commissions row */}
                  <tr className="hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-primary-fixed-dim">#FB-COMM-P</td>
                    <td className="px-6 py-4 text-xs font-semibold text-on-surface">Paid Commissions</td>
                    <td className="px-6 py-4 font-mono text-xs text-secondary">
                      {fmtCompact(metrics.totalPaidCommissions)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">
                        SETTLED
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href="/admin/cash-ledger" className="text-gray-500 hover:text-on-surface text-sm">View</Link>
                    </td>
                  </tr>
                  {/* Pending commissions row */}
                  <tr className="hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-primary-fixed-dim">#FB-COMM-Q</td>
                    <td className="px-6 py-4 text-xs font-semibold text-on-surface">Pending Commissions</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface">
                      {fmt(metrics.totalPendingCommissions)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-primary-container/10 text-primary-container text-[10px] font-bold">
                        PENDING
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href="/admin/cash-ledger" className="text-gray-500 hover:text-on-surface text-sm">View</Link>
                    </td>
                  </tr>
                  {/* Available commissions row */}
                  <tr className="hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-primary-fixed-dim">#FB-COMM-A</td>
                    <td className="px-6 py-4 text-xs font-semibold text-on-surface">Available Commissions</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface">
                      {fmt(metrics.totalAvailableCommissions)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-primary-container/10 text-primary-container text-[10px] font-bold">
                        READY
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href="/admin/cash-ledger" className="text-gray-500 hover:text-on-surface text-sm">View</Link>
                    </td>
                  </tr>
                  {/* Refunds row (if any) */}
                  {metrics.refundCount > 0 && (
                    <tr className="hover:bg-surface-container-high transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-primary-fixed-dim">#FB-REFUND</td>
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface">Refund Requests</td>
                      <td className="px-6 py-4 font-mono text-xs text-error">
                        {metrics.refundCount} orders
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-bold">
                          FLAGGED
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href="/admin/orders" className="text-gray-500 hover:text-on-surface text-sm">View</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right Column (4/12) ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* NBA Widget - Urgent Actions */}
          <div className="bg-surface-container-highest p-6 rounded-xl border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <svg className="w-16 h-16 text-primary-fixed-dim opacity-20 rotate-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z" />
              </svg>
            </div>
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4">
              Urgent Actions (NBA)
            </h4>
            <div className="space-y-4">
              {metrics.pendingSettlementCount > 0 && (
                <div className="p-3 rounded bg-background/50 border-l-2 border-primary">
                  <p className="text-xs font-bold text-on-surface">
                    {metrics.pendingSettlementCount} orders need settlement
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Paid orders awaiting settlement processing.
                  </p>
                  <button
                    onClick={handleRunSettlement}
                    disabled={settlementLoading}
                    className="mt-3 text-[10px] font-black text-primary-fixed-dim uppercase hover:underline disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {settlementLoading ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-primary-fixed-dim border-t-transparent animate-spin" />
                        Running...
                      </>
                    ) : (
                      'Run Settlement'
                    )}
                  </button>
                </div>
              )}
              {metrics.refundCount > 0 && (
                <div className="p-3 rounded bg-background/50 border-l-2 border-error">
                  <p className="text-xs font-bold text-on-surface">
                    {metrics.refundCount} refund requests pending
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Refunded orders requiring review and processing.
                  </p>
                  <Link href="/admin/orders" className="mt-3 text-[10px] font-black text-error uppercase hover:underline inline-block">
                    Process Refunds
                  </Link>
                </div>
              )}
              {metrics.activeAmbassadors > 0 && (
                <div className="p-3 rounded bg-background/50 border-l-2 border-secondary">
                  <p className="text-xs font-bold text-on-surface">
                    {metrics.activeAmbassadors} active ambassadors
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Currently qualified ambassadors generating revenue.
                  </p>
                  <Link href="/admin/ambassadors" className="mt-3 text-[10px] font-black text-secondary uppercase hover:underline inline-block">
                    View Network
                  </Link>
                </div>
              )}
              {campaigns.length > 0 && (
                <div className="p-3 rounded bg-background/50 border-l-2 border-primary">
                  <p className="text-xs font-bold text-on-surface">
                    {campaigns.length} active campaign{campaigns.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {campaigns.map((c) => c.name).join(', ')}
                  </p>
                  <Link href="/admin/campaigns" className="mt-3 text-[10px] font-black text-primary-fixed-dim uppercase hover:underline inline-block">
                    Manage Campaigns
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              System Health
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-gray-400">API LATENCY</span>
                  <span className="text-[10px] font-mono text-secondary">OPTIMAL</span>
                </div>
                <div className="h-1 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[15%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-gray-400">LEDGER SYNC</span>
                  <span className="text-[10px] font-mono text-on-surface">99.99%</span>
                </div>
                <div className="h-1 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container w-[99%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-gray-400">AUTH CLUSTER</span>
                  <span className="text-[10px] font-mono text-error">REDUNDANCY LOW</span>
                </div>
                <div className="h-1 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-error w-[40%]" />
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span>INSTANCE ID</span>
                <span className="text-on-surface">FB-OS-01</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mt-2">
                <span>REGION</span>
                <span className="text-on-surface">US-EAST-1</span>
              </div>
            </div>
          </div>

          {/* Command Terminal */}
          <div className="bg-surface-container-lowest p-4 rounded-lg border border-primary/10">
            <p className="text-[10px] font-mono text-primary/60 mb-2 uppercase">Command Terminal</p>
            <div className="flex items-center bg-background rounded border border-outline-variant/20 px-3 py-2">
              <span className="text-primary-fixed-dim font-mono text-xs mr-2">&gt;</span>
              <input
                type="text"
                disabled
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs font-mono w-full text-on-surface/50 p-0 disabled:cursor-not-allowed"
                placeholder="Read-only: use Commerce Hub and Finance actions for live operations"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
