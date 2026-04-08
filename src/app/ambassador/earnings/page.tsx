'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { isAmbassador } from '@/types';
import { TrendingUp, DollarSign, Calendar, Clock } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Earnings</h1>
        <p className="mt-2 text-gray-400">Complete breakdown of commissions and payouts</p>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={() => setSelectedPeriod('day')}
          className={`rounded-lg border p-4 text-left transition-all duration-200 ${
            selectedPeriod === 'day'
              ? 'border-amber-500/50 bg-amber-950/30'
              : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50'
          }`}
        >
          <p className="text-xs text-gray-500">Today</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            ${earnings.today.toFixed(2)}
          </p>
        </button>

        <button
          onClick={() => setSelectedPeriod('week')}
          className={`rounded-lg border p-4 text-left transition-all duration-200 ${
            selectedPeriod === 'week'
              ? 'border-amber-500/50 bg-amber-950/30'
              : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50'
          }`}
        >
          <p className="text-xs text-gray-500">This Week</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            ${earnings.week.toFixed(2)}
          </p>
        </button>

        <button
          onClick={() => setSelectedPeriod('month')}
          className={`rounded-lg border p-4 text-left transition-all duration-200 ${
            selectedPeriod === 'month'
              ? 'border-amber-500/50 bg-amber-950/30'
              : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50'
          }`}
        >
          <p className="text-xs text-gray-500">This Month</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            ${earnings.month.toFixed(2)}
          </p>
        </button>

        <button
          onClick={() => setSelectedPeriod('all')}
          className={`rounded-lg border p-4 text-left transition-all duration-200 ${
            selectedPeriod === 'all'
              ? 'border-amber-500/50 bg-amber-950/30'
              : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50'
          }`}
        >
          <p className="text-xs text-gray-500">All Time</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            ${earnings.allTime.toFixed(2)}
          </p>
        </button>
      </div>

      {/* Available vs Pending */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-green-950/20 p-6">
          <p className="text-xs font-medium text-gray-500">Available for Withdrawal</p>
          <p className="mt-3 text-3xl font-bold text-emerald-400">
            ${earnings.available.toFixed(2)}
          </p>
          <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 font-semibold text-white transition-all duration-200 hover:from-emerald-700 hover:to-green-700">
            Withdraw Now
          </button>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-yellow-950/20 p-6">
          <p className="text-xs font-medium text-gray-500">Pending (Settlement Window)</p>
          <p className="mt-3 text-3xl font-bold text-amber-400">
            ${earnings.pending.toFixed(2)}
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Becomes available in 7-14 days. Check back soon!
          </p>
        </div>
      </div>

      {/* Earnings by Source */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-100">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          Earnings by Tier (This Month)
        </h2>

        <div className="space-y-3">
          {Object.entries(earnings.earningsBySource).map(([tier, data]) => {
            const tierLabels: Record<string, string> = {
              direct: 'Direct Sales (L0)',
              l1: 'Level 1',
              l2: 'Level 2',
              l3: 'Level 3',
              l4: 'Level 4',
              l5: 'Level 5',
              l6: 'Level 6',
            };

            return (
              <div key={tier} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-300">{tierLabels[tier]}</p>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-400">
                      ${data.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{data.percentage}% of total</p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commission History */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 overflow-hidden">
        <div className="border-b border-gray-700/30 bg-gray-900/50 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <Clock className="h-5 w-5 text-amber-400" />
            Recent Commission History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700/30">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Source</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400">Tier</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissionHistory.map((commission) => (
                <tr
                  key={commission.id}
                  className="border-b border-gray-700/20 transition-all duration-200 hover:bg-gray-800/30"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-200">{commission.date}</p>
                    <p className="text-xs text-gray-500">{commission.orderId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-200">{commission.source}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                      {commission.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      ${commission.amount.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                        commission.status
                      )}`}
                    >
                      {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-700/30 bg-gray-900/50 px-6 py-3">
          <button className="text-sm font-semibold text-amber-300 hover:text-amber-200 transition-all">
            View All Commissions
          </button>
        </div>
      </div>

      {/* Payout History */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 overflow-hidden">
        <div className="border-b border-gray-700/30 bg-gray-900/50 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            Payout History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700/30">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Method</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((payout) => (
                <tr
                  key={payout.id}
                  className="border-b border-gray-700/20 transition-all duration-200 hover:bg-gray-800/30"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-200">{payout.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-200">{payout.method}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      ${payout.amount.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Info Notice */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-4">
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Tax Information:</span> We'll send you a 1099 form by January 31st for
          all earnings. Keep track of your expenses for tax deductions.
        </p>
      </div>
    </div>
  );
}
