'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { isAmbassador } from '@/types';
import {
  TrendingUp,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MoreVertical,
} from 'lucide-react';

/**
 * Earnings Page
 * Detailed breakdown of all earnings sources with charts and history
 */
export default function EarningsPage() {
  const { userProfile } = useAuthContext();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');

  if (!userProfile || !isAmbassador(userProfile)) {
    return null;
  }

  // Mock earnings data
  const earnings = {
    today: 127.50,
    week: 850.25,
    month: 3750.50,
    allTime: 12450.75,
    available: 1250.75,
    pending: 450.25,
    earningsBySource: {
      direct: { amount: 3200.00, percentage: 43 },
      l1: { amount: 1800.50, percentage: 24 },
      l2: { amount: 892.30, percentage: 12 },
      l3: { amount: 650.40, percentage: 9 },
      l4: { amount: 420.60, percentage: 7 },
      l5: { amount: 180.20, percentage: 2 },
      l6: { amount: 75.50, percentage: 1 },
    },
  };

  // Commission history
  const commissionHistory = [
    {
      id: 1,
      date: '2024-04-08',
      source: 'Direct Sales',
      tier: 'L0',
      amount: 125.00,
      status: 'available',
      orderId: 'ORD-2024-4821',
    },
    {
      id: 2,
      date: '2024-04-07',
      source: 'L1 Team',
      tier: 'L1',
      amount: 85.50,
      status: 'pending',
      orderId: 'ORD-2024-4798',
    },
    {
      id: 3,
      date: '2024-04-07',
      source: 'Direct Sales',
      tier: 'L0',
      amount: 112.00,
      status: 'available',
      orderId: 'ORD-2024-4797',
    },
    {
      id: 4,
      date: '2024-04-06',
      source: 'L2 Team',
      tier: 'L2',
      amount: 45.30,
      status: 'available',
      orderId: 'ORD-2024-4756',
    },
    {
      id: 5,
      date: '2024-04-05',
      source: 'Direct Sales',
      tier: 'L0',
      amount: 150.00,
      status: 'paid',
      orderId: 'ORD-2024-4712',
    },
  ];

  // Payout history
  const payoutHistory = [
    {
      id: 1,
      date: '2024-03-31',
      amount: 2500.00,
      method: 'Bank Transfer',
      status: 'completed',
    },
    {
      id: 2,
      date: '2024-02-28',
      amount: 1875.50,
      method: 'Bank Transfer',
      status: 'completed',
    },
    {
      id: 3,
      date: '2024-01-31',
      amount: 2105.25,
      method: 'Bank Transfer',
      status: 'completed',
    },
  ];

  const getPeriodEarnings = () => {
    switch (selectedPeriod) {
      case 'day':
        return earnings.today;
      case 'week':
        return earnings.week;
      case 'month':
        return earnings.month;
      case 'all':
        return earnings.allTime;
      default:
        return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'paid':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Tier card data
  const tierCards = [
    { label: 'Direct Sales', rate: '15.0%', earned: '$1,420.00', orders: 142, highlight: true },
    { label: 'L1 Ambassador', rate: '5.0%', earned: '$640.50', orders: 88 },
    { label: 'L2 Ambassador', rate: '3.0%', earned: '$312.20', orders: 54 },
    { label: 'L3 Ambassador', rate: '2.0%', earned: '$185.80', orders: 42 },
    { label: 'L4 Ambassador', rate: '1.0%', earned: '$95.00', orders: 19, opacity: 'opacity-80' },
    { label: 'L5 Ambassador', rate: '1.0%', earned: '$64.00', orders: 12, opacity: 'opacity-60' },
  ];

  // Stacked bar chart data (simulated)
  const barData = [
    { label: '01 OCT', segments: [20, 15, 10, 5] },
    { label: '05 OCT', segments: [35, 20, 15, 0] },
    { label: '10 OCT', segments: [45, 25, 10, 8] },
    { label: '15 OCT', segments: [30, 10, 20, 0] },
    { label: '20 OCT', segments: [55, 15, 0, 0] },
    { label: '25 OCT', segments: [25, 30, 15, 0] },
    { label: '31 OCT', segments: [40, 20, 10, 0] },
  ];

  const periodTabs: { key: typeof selectedPeriod; label: string }[] = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="pt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-on-surface-variant font-semibold tracking-wider text-xs uppercase mb-2">
              Total Cash Earned All-Time
            </p>
            <h2 className="text-5xl font-black text-secondary leading-none">
              ${earnings.allTime.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center gap-2 mt-4">
              <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> +14.2%
              </span>
              <span className="text-on-surface-variant text-xs">vs. last period</span>
            </div>
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

      {/* Chart + Milestone Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stacked Bar Chart */}
        <div className="lg:col-span-8 bg-surface-container-low rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-semibold text-on-surface">Earnings by Source</h3>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
          {/* Simulated Stacked Bar Chart */}
          <div className="h-[300px] flex items-end justify-between gap-4 px-4">
            {barData.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                {bar.segments[0] > 0 && (
                  <div className="bg-primary w-full rounded-t-sm" style={{ height: `${bar.segments[0]}%` }} />
                )}
                {bar.segments[1] > 0 && (
                  <div className="bg-primary-fixed-dim w-full" style={{ height: `${bar.segments[1]}%` }} />
                )}
                {bar.segments[2] > 0 && (
                  <div className="bg-secondary w-full" style={{ height: `${bar.segments[2]}%` }} />
                )}
                {bar.segments[3] > 0 && (
                  <div className="bg-tertiary-container w-full" style={{ height: `${bar.segments[3]}%` }} />
                )}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-on-surface-variant font-mono">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-semibold text-on-surface-variant">L0 DIRECT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-fixed-dim" />
              <span className="text-[10px] font-semibold text-on-surface-variant">L1 NETWORK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-[10px] font-semibold text-on-surface-variant">L2 NETWORK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-tertiary-container" />
              <span className="text-[10px] font-semibold text-on-surface-variant">L3-L5 OVERRIDE</span>
            </div>
          </div>
        </div>

        {/* Next Milestone Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container rounded-xl p-6 border border-primary/10 relative overflow-hidden h-full group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,185,95,0.08),transparent_70%)]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase">
                  Next Milestone
                </span>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-2">Emerald Ambassador</h4>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                Unlock an extra 2.5% override on all L4-L5 network sales by reaching $5k in personal volume.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-on-surface-variant">PROGRESS</span>
                    <span className="text-primary">82%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[82%] rounded-full" />
                  </div>
                </div>
                <button className="w-full py-3 rounded-lg bg-gradient-to-br from-primary-container to-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  View Requirements
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Tier Cards */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-4 min-w-max pb-4">
          {tierCards.map((card, i) => (
            <div
              key={i}
              className={`w-48 rounded-xl p-5 transition-colors ${
                card.highlight
                  ? 'bg-surface-container border-l-4 border-primary'
                  : `bg-surface-container-low hover:bg-surface-container ${card.opacity || ''}`
              }`}
            >
              <p className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-tighter">
                {card.label}
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-on-surface-variant text-[10px]">RATE</p>
                  <p className="text-lg font-bold font-mono text-on-surface">{card.rate}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px]">TOTAL EARNED</p>
                  <p className={`text-lg font-bold ${card.highlight ? 'text-secondary' : 'text-on-surface'}`}>
                    {card.earned}
                  </p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px]">ORDERS</p>
                  <p className="text-lg font-bold font-mono text-on-surface">{card.orders}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission History Table */}
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
                <th className="px-6 py-4">Source Ambassador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/50">
              {commissionHistory.map((commission) => {
                const tierLabel =
                  commission.tier === 'L0'
                    ? 'DIRECT'
                    : `${commission.tier} NET`;
                const rate =
                  commission.tier === 'L0'
                    ? '15%'
                    : commission.tier === 'L1'
                    ? '5%'
                    : commission.tier === 'L2'
                    ? '3%'
                    : '2%';

                const isCompleted = commission.status === 'available' || commission.status === 'paid';
                const statusLabel = isCompleted ? 'COMPLETED' : 'PENDING';
                const statusColor = isCompleted ? 'text-secondary' : 'text-primary-fixed-dim';
                const dotColor = isCompleted ? 'bg-secondary' : 'bg-primary-fixed-dim';
                const amountColor = isCompleted ? 'text-secondary' : 'text-primary-fixed-dim';

                return (
                  <tr
                    key={commission.id}
                    className="hover:bg-surface-container/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">
                      {commission.date}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-primary">
                      #{commission.orderId}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-bold text-on-surface">
                        {tierLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-on-surface">
                      {rate}
                    </td>
                    <td className={`px-6 py-4 text-sm font-mono text-right font-bold ${amountColor}`}>
                      +${commission.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-[10px] font-bold ${statusColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {commission.tier === 'L0' ? (
                        <span>&mdash;</span>
                      ) : (
                        <span className="text-xs font-semibold text-on-surface">{commission.source}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 bg-surface-container-lowest flex items-center justify-between">
          <p className="text-xs text-on-surface-variant font-mono">
            Showing 1-{commissionHistory.length} of {commissionHistory.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-variant transition-colors">
              <ChevronLeft className="h-4 w-4 text-on-surface-variant" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-xs font-bold">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-variant transition-colors text-xs font-bold text-on-surface">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-variant transition-colors text-xs font-bold text-on-surface">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-variant transition-colors">
              <ChevronRight className="h-4 w-4 text-on-surface-variant" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
