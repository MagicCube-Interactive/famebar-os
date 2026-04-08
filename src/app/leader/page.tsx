'use client';

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import EarningsCard from '@/components/shared/EarningsCard';
import NBAWidget from '@/components/shared/NBAWidget';
import RevenueWaterfall from '@/components/leader/RevenueWaterfall';
import TeamHeatmap from '@/components/leader/TeamHeatmap';
import MilestoneLadder from '@/components/leader/MilestoneLadder';

/**
 * Leader Home Dashboard
 * Key metrics: earnings, team sales by level, opportunities, milestones
 */
export default function LeaderHome() {
  const { userProfile } = useAuthContext();
  const leaderProfile = userProfile as any;

  // Mock data
  const personalSalesThisMonth = 2850.00;
  const monthlyGoal = 5000.00;
  const leaderRank = leaderProfile?.tier || 0;

  // Team sales by level
  const teamSalesByLevel = {
    0: 2850.00,    // Personal
    1: 8400.00,    // L1
    2: 12500.00,   // L2
    3: 9200.00,    // L3
    4: 4100.00,    // L4
    5: 1800.00,    // L5
    6: 600.00,     // L6
  };

  const totalTeamSales = Object.values(teamSalesByLevel).reduce((a, b) => a + b, 0);
  const totalUnclaimedValue = 12400.00; // From locked L4-6

  // Earnings
  const commissionAvailable = 3241.50;
  const commissionPending = 1847.65;
  const tokensAvailable = 32415;
  const tokensPending = 18476;

  // Team activity heatmap data
  const teamActivityData = Array(24).fill(null).map((_, i) => ({
    id: `member-${i}`,
    name: `Ambassador ${i + 1}`,
    status: ['active', 'stalled', 'new', 'at-risk'][Math.floor(Math.random() * 4)] as any,
    salesThisMonth: Math.random() * 5000,
    recruits: Math.floor(Math.random() * 10),
  }));

  const activeCount = teamActivityData.filter(m => m.status === 'active').length;
  const stalledCount = teamActivityData.filter(m => m.status === 'stalled').length;

  // Help opportunities
  const opportunities = [
    {
      id: '1',
      title: '2 people in L1 are $40 away from active',
      icon: <AlertCircle className="h-4 w-4 text-amber-400" />,
      action: 'Coach them to the finish line',
      potential: '$840 in new commission',
    },
    {
      id: '2',
      title: '3 pending ambassadors need approval',
      icon: <Clock className="h-4 w-4 text-blue-400" />,
      action: 'Review and activate',
      potential: 'New team members ready',
    },
    {
      id: '3',
      title: '5 stalled team members this month',
      icon: <AlertCircle className="h-4 w-4 text-red-400" />,
      action: 'Reach out with motivation',
      potential: 'Re-engage at-risk team',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Leader Dashboard</h1>
        <p className="text-gray-400">Track your team performance, earnings, and growth opportunities</p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Personal Sales */}
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-400">Personal Sales (This Month)</p>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">${personalSalesThisMonth.toFixed(2)}</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                style={{ width: `${Math.min(100, (personalSalesThisMonth / monthlyGoal) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{Math.round((personalSalesThisMonth / monthlyGoal) * 100)}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Goal: ${monthlyGoal.toFixed(2)}</p>
        </div>

        {/* Total Team Sales */}
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-400">Total Team Sales</p>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">${totalTeamSales.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-3">
            {activeCount} active • {stalledCount} stalled
          </p>
        </div>

        {/* Commission Available */}
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-400">Commission Available</p>
            <Zap className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">${commissionAvailable.toFixed(2)}</p>
          {commissionPending > 0 && (
            <p className="text-xs text-gray-500 mt-2">+${commissionPending.toFixed(2)} pending</p>
          )}
        </div>

        {/* Unclaimed Value (Motivation) */}
        <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-red-900/20 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-400">Unclaimed Value</p>
            <AlertCircle className="h-4 w-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-400">${totalUnclaimedValue.toFixed(2)}</p>
          <p className="text-xs text-orange-300 mt-2">Locked in L4-L6 (activate to unlock)</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sales & Earnings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Sales by Level */}
          <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-100 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Team Sales by Level
            </h3>

            <div className="grid grid-cols-4 gap-3">
              {Object.entries(teamSalesByLevel).map(([level, sales], idx) => (
                <div key={level} className="rounded-lg bg-gray-700/20 p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    {idx === 0 ? 'Personal' : `L${level}`}
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                    ${(sales as number).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((sales as number / totalTeamSales) * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Waterfall Chart */}
          <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Revenue Waterfall (L1-L6)</h3>
            <RevenueWaterfall data={teamSalesByLevel} />
          </div>

          {/* Team Heatmap */}
          <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Team Activity Heatmap</h3>
            <TeamHeatmap data={teamActivityData} />
          </div>
        </div>

        {/* Right Column: Earnings & Opportunities */}
        <div className="space-y-6">
          {/* Earnings Card */}
          <EarningsCard
            availableCash={commissionAvailable}
            pendingCash={commissionPending}
            availableTokens={tokensAvailable}
            pendingTokens={tokensPending}
            holdToSaveTier={20}
            fameBalance={324150}
            isAmbassador={true}
            onWithdraw={() => console.log('Withdraw')}
            onViewDetails={() => console.log('View Details')}
          />

          {/* Help Opportunities */}
          <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-100 flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400" />
              Help Opportunities
            </h3>

            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-lg border border-gray-700/30 bg-gray-800/30 p-3"
                >
                  <div className="flex items-start gap-2 mb-2">
                    {opp.icon}
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-200">{opp.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opp.action}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-300 font-medium">{opp.potential}</p>
                </div>
              ))}
            </div>
          </div>

          {/* NBA Widget */}
          <div>
            <NBAWidget maxActions={2} title="Next Steps" />
          </div>
        </div>
      </div>

      {/* Milestone Ladder */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-400" />
          Rank & Milestone Tracker
        </h3>
        <MilestoneLadder currentRank={leaderRank} />
      </div>
    </div>
  );
}
