'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { isAmbassador } from '@/types';
import ProgressRing from '@/components/shared/ProgressRing';
import { Coins, TrendingUp, Zap, Gift, Shield, Clock } from 'lucide-react';

/**
 * Token Vault Page
 * $FAME token management and trading interface
 */
export default function TokenVaultPage() {
  const { userProfile } = useAuthContext();
  const [selectedTab, setSelectedTab] = useState<'balance' | 'history' | 'store'>('balance');

  if (!userProfile || !isAmbassador(userProfile)) {
    return null;
  }

  const ambassador = userProfile;

  // Mock token data
  const tokenData = {
    totalBalance: 45000,
    availableBalance: 45000,
    pendingBalance: 12500,
    isFounder: ambassador.isFounder,
    founderMultiplier: 2,
    holdToSaveTier: 20,
    monthlyMiningRate: 125,
    tokenHistory: [
      {
        id: 1,
        date: '2024-04-08',
        type: 'earned',
        amount: 2500,
        source: 'Direct Sales',
        orderId: 'ORD-2024-4821',
      },
      {
        id: 2,
        date: '2024-04-07',
        type: 'earned',
        amount: 1850,
        source: 'L1 Team Commission',
        orderId: 'ORD-2024-4798',
      },
      {
        id: 3,
        date: '2024-04-05',
        type: 'spent',
        amount: 500,
        source: 'Merch Purchase - Hoodie',
        orderId: 'MERCH-2024-125',
      },
      {
        id: 4,
        date: '2024-03-31',
        type: 'earned',
        amount: 1200,
        source: 'Monthly Bonus',
        orderId: 'BONUS-MARCH',
      },
    ],
    spendingOptions: [
      {
        id: 1,
        name: 'Exclusive Merch',
        description: 'Limited edition FameBar apparel',
        cost: 500,
        icon: Gift,
        available: true,
      },
      {
        id: 2,
        name: 'Discount Boost',
        description: 'Extra 10% discount on next order',
        cost: 1000,
        icon: Zap,
        available: true,
      },
      {
        id: 3,
        name: 'VIP Event Access',
        description: 'Early access to exclusive events',
        cost: 2000,
        icon: Shield,
        available: true,
      },
      {
        id: 4,
        name: 'Team Bonus',
        description: 'Give 500 tokens to team member',
        cost: 500,
        icon: TrendingUp,
        available: true,
      },
    ],
  };

  // Hold-to-Save tiers
  const holdToSaveTiers = [
    { required: 10000, discount: 5, tier: 'Silver' },
    { required: 25000, discount: 10, tier: 'Gold' },
    { required: 50000, discount: 15, tier: 'Diamond' },
    { required: 100000, discount: 20, tier: 'Platinum' },
  ];

  const currentTierIndex = holdToSaveTiers.findIndex(
    t => tokenData.totalBalance >= t.required
  );
  const nextTier = currentTierIndex < holdToSaveTiers.length - 1
    ? holdToSaveTiers[currentTierIndex + 1]
    : null;

  const tierProgress = nextTier
    ? ((tokenData.totalBalance - holdToSaveTiers[currentTierIndex].required) /
        (nextTier.required - holdToSaveTiers[currentTierIndex].required)) *
      100
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Token Vault</h1>
        <p className="mt-2 text-gray-400">Manage your $FAME tokens and rewards</p>
      </div>

      {/* Main Balance Card */}
      <div className="rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-950/30 to-amber-950/20 p-8">
        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          {/* Balance Info */}
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-gray-500">Total $FAME Balance</p>
            <p className="mb-6 text-5xl font-bold text-yellow-400">
              {tokenData.totalBalance.toLocaleString()}
            </p>

            {/* Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Available</span>
                <span className="font-semibold text-yellow-300">
                  {tokenData.availableBalance.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Pending (14-day settlement)</span>
                <span className="font-semibold text-amber-300">
                  +{tokenData.pendingBalance.toLocaleString()} tokens
                </span>
              </div>
            </div>
          </div>

          {/* Ring */}
          <div className="flex flex-col items-center">
            <ProgressRing
              progress={75}
              size={140}
              color="amber"
              label="Earning"
              sublabel="Monthly Rate"
              showPercentage={false}
            />
            <p className="mt-4 text-center text-xs text-gray-400">
              <span className="font-semibold text-amber-400">
                ~{tokenData.monthlyMiningRate}/day
              </span>
              <br />
              at current pace
            </p>
          </div>
        </div>
      </div>

      {/* Founder Boost Badge */}
      {tokenData.isFounder && (
        <div className="rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-950/50 to-yellow-950/30 p-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl">👑</div>
            <div>
              <h3 className="font-bold text-amber-300">Founder 2x Token Boost Active</h3>
              <p className="mt-1 text-sm text-gray-300">
                All tokens earned from direct sales are multiplied by 2x for the next 6 months.
              </p>
              <p className="mt-2 text-xs text-amber-200/70">
                Boost ends: <span className="font-semibold">September 15, 2024</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hold-to-Save Tier Status */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-100">
          <Shield className="h-5 w-5 text-amber-400" />
          Hold-to-Save Tier Status
        </h2>

        {/* Current Tier */}
        <div className="mb-6 rounded-lg bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Current Tier</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">
            {holdToSaveTiers[Math.min(currentTierIndex, holdToSaveTiers.length - 1)].tier} Tier
          </p>
          <p className="mt-2 text-sm text-gray-400">
            <span className="font-semibold text-amber-300">
              {holdToSaveTiers[Math.min(currentTierIndex, holdToSaveTiers.length - 1)].discount}%
            </span>
            {' '}personal order discount
          </p>
        </div>

        {/* Tier Progress */}
        {nextTier && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">Progress to Next Tier</p>
              <p className="text-xs font-semibold text-amber-300">
                {nextTier.required - tokenData.totalBalance} tokens needed
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-700/50">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                style={{ width: `${tierProgress}%` }}
              />
            </div>

            <div className="text-xs text-gray-400">
              Next: <span className="font-semibold text-amber-300">{nextTier.tier} Tier</span> (
              <span className="font-semibold">{nextTier.discount}%</span> discount)
            </div>
          </div>
        )}

        {!nextTier && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
            <p className="text-xs text-emerald-300">
              <span className="font-semibold">Platinum unlocked!</span> You've reached the highest
              tier with 20% discount on all personal orders.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-gray-700/50">
        {(['balance', 'history', 'store'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              selectedTab === tab
                ? 'border-b-2 border-amber-400 text-amber-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'balance' && 'Balance & Earning'}
            {tab === 'history' && 'Transaction History'}
            {tab === 'store' && 'Token Store'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'balance' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
            <h3 className="mb-4 font-semibold text-gray-100">Token Earning Rate</h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-gray-400">Daily Average</p>
                  <p className="font-bold text-yellow-400">~125 tokens/day</p>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="font-bold text-yellow-400">~3,750 tokens earned</p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                <p className="text-xs text-amber-300">
                  <span className="font-semibold">Founder Boost:</span> Multiply all direct sales tokens by
                  2x for 6 months (ends Sept 15, 2024)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-4">
            <p className="text-xs text-blue-300">
              <span className="font-semibold">Tip:</span> Tokens are earned from every order placed
              through your code (10 tokens per $1). Founder status doubles this!
            </p>
          </div>
        </div>
      )}

      {selectedTab === 'history' && (
        <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr className="border-b border-gray-700/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Source</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {tokenData.tokenHistory.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-700/20 transition-all duration-200 hover:bg-gray-800/30"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-200">{record.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          record.type === 'earned'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-orange-500/20 text-orange-300'
                        }`}
                      >
                        {record.type === 'earned' ? '+' : '-'}
                        {record.type === 'earned' ? 'Earned' : 'Spent'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-200">{record.source}</p>
                      <p className="text-xs text-gray-500">{record.orderId}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p
                        className={`text-sm font-bold ${
                          record.type === 'earned' ? 'text-yellow-400' : 'text-orange-400'
                        }`}
                      >
                        {record.type === 'earned' ? '+' : '-'}
                        {record.amount.toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'store' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Redeem your tokens for exclusive rewards</p>

          <div className="grid gap-4 md:grid-cols-2">
            {tokenData.spendingOptions.map((item) => {
              const Icon = item.icon;
              const canAfford = tokenData.availableBalance >= item.cost;

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-6 transition-all duration-200 ${
                    canAfford
                      ? 'border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-yellow-950/20 hover:from-amber-950/40 hover:to-yellow-950/40'
                      : 'border-gray-700/50 bg-gray-800/30 opacity-60'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <Icon className={`h-6 w-6 ${canAfford ? 'text-amber-400' : 'text-gray-500'}`} />
                    <p className="rounded-full bg-gray-900/50 px-3 py-1 text-xs font-bold text-yellow-400">
                      {item.cost.toLocaleString()} tokens
                    </p>
                  </div>

                  <h3 className="font-semibold text-gray-100">{item.name}</h3>
                  <p className="mt-2 text-xs text-gray-400">{item.description}</p>

                  <button
                    disabled={!canAfford}
                    className={`mt-4 w-full rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 hover:from-amber-600 hover:to-yellow-500'
                        : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Redeem' : 'Insufficient Tokens'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
