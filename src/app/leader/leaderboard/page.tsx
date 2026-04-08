'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Trophy, Flame } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  value: number;
  trend: number;
  tier: number;
  badge?: string;
}

/**
 * Leaderboard Page
 * Weekly/monthly sales leaderboards and rankings
 */
export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'weekly_sales' | 'monthly_sales' | 'recruits' | 'campus' | 'faststart'>('weekly_sales');

  const leaderboards = {
    weekly_sales: [
      { rank: 1, name: 'Sarah Johnson', value: 8450, trend: 12, tier: 3, badge: '🔥 Hot' },
      { rank: 2, name: 'Alex Martinez', value: 7200, trend: 5, tier: 3 },
      { rank: 3, name: 'Lisa Anderson', value: 6800, trend: -2, tier: 3 },
      { rank: 4, name: 'Mike Chen', value: 5400, trend: 8, tier: 2 },
      { rank: 5, name: 'Emma Wilson', value: 3200, trend: -5, tier: 2 },
    ],
    monthly_sales: [
      { rank: 1, name: 'Sarah Johnson', value: 24500, trend: 8, tier: 3, badge: '👑 Leader' },
      { rank: 2, name: 'Alex Martinez', value: 21200, trend: -3, tier: 3 },
      { rank: 3, name: 'Lisa Anderson', value: 19800, trend: 2, tier: 3 },
      { rank: 4, name: 'Mike Chen', value: 15400, trend: 15, tier: 2 },
      { rank: 5, name: 'David Brown', value: 12100, trend: -8, tier: 2 },
    ],
    recruits: [
      { rank: 1, name: 'Sarah Johnson', value: 12, trend: 2, tier: 3, badge: '🎯 Top Recruiter' },
      { rank: 2, name: 'Alex Martinez', value: 9, trend: 1, tier: 3 },
      { rank: 3, name: 'Mike Chen', value: 8, trend: 0, tier: 2 },
      { rank: 4, name: 'Lisa Anderson', value: 7, trend: 1, tier: 3 },
      { rank: 5, name: 'Jessica Lee', value: 4, trend: 3, tier: 1 },
    ],
    campus: [
      { rank: 1, name: 'Stanford Campus (Alex M.)', value: 45200, trend: 18, tier: 3 },
      { rank: 2, name: 'UC Berkeley (Sarah J.)', value: 42800, trend: 10, tier: 3 },
      { rank: 3, name: 'MIT Campus (Mike C.)', value: 38500, trend: 5, tier: 2 },
      { rank: 4, name: 'UCLA Network (Lisa A.)', value: 31200, trend: -2, tier: 3 },
      { rank: 5, name: 'Harvard Group (David B.)', value: 28900, trend: 12, tier: 2 },
    ],
    faststart: [
      { rank: 1, name: 'Jessica Lee (3 weeks)', value: 4200, trend: 0, tier: 1, badge: '⭐ Rising' },
      { rank: 2, name: 'Michael Torres (2 weeks)', value: 2800, trend: 0, tier: 1 },
      { rank: 3, name: 'Amanda Chen (3 weeks)', value: 2100, trend: 0, tier: 1 },
      { rank: 4, name: 'James Wilson (4 weeks)', value: 1800, trend: 0, tier: 1 },
      { rank: 5, name: 'Rebecca Kim (2 weeks)', value: 950, trend: 0, tier: 0 },
    ],
  };

  const currentLeaderboard = leaderboards[activeTab];
  const isMonetary = activeTab === 'weekly_sales' || activeTab === 'monthly_sales' || activeTab === 'campus';

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 3:
        return 'text-amber-400 bg-amber-400/10';
      case 2:
        return 'text-blue-400 bg-blue-400/10';
      case 1:
        return 'text-green-400 bg-green-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Leaderboards</h1>
        <p className="text-gray-400">Compete with ambassadors and leaders across tiers</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 overflow-x-auto">
        {(
          [
            { key: 'weekly_sales', label: 'Weekly Sales' },
            { key: 'monthly_sales', label: 'Monthly Sales' },
            { key: 'recruits', label: 'Top Recruiters' },
            { key: 'campus', label: 'Campus Leaders' },
            { key: 'faststart', label: 'Fast-Start' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/30">
                <th className="px-4 py-3 text-left font-semibold text-gray-400">Rank</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-400">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-400">Tier</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-400">
                  {activeTab === 'recruits' ? 'Recruits' : activeTab === 'faststart' ? 'Sales' : 'Total'}
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-400">Trend</th>
              </tr>
            </thead>
            <tbody>
              {currentLeaderboard.map((entry, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-700/30 hover:bg-gray-800/20 transition-colors ${
                    idx === 0 ? 'bg-amber-900/20 border-amber-500/30' : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getRankMedal(entry.rank)}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-gray-100">{entry.name}</p>
                      {'badge' in entry && entry.badge && <p className="text-xs text-amber-300 mt-1">{entry.badge}</p>}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getTierColor(entry.tier)}`}>
                      L{entry.tier}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <p className="font-bold text-lg text-amber-400">
                      {isMonetary ? '$' : ''}
                      {isMonetary
                        ? (entry.value / 1000).toFixed(0) + 'K'
                        : entry.value}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className={`flex items-center justify-center gap-1 ${
                      entry.trend > 0
                        ? 'text-emerald-400'
                        : entry.trend < 0
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}>
                      {entry.trend > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : entry.trend < 0 ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <span>—</span>
                      )}
                      {entry.trend !== 0 && <span className="font-semibold">{Math.abs(entry.trend)}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
          <h4 className="font-semibold text-gray-100 mb-3">Tier System</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400">
                L3
              </span>
              <span className="text-gray-400">Senior Leader - 25% on direct + 5% on L2</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-400/10 text-blue-400">
                L2
              </span>
              <span className="text-gray-400">Leader - 25% on direct + 10% on L1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-green-400/10 text-green-400">
                L1
              </span>
              <span className="text-gray-400">Ambassador - 25% on direct sales</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-purple-500/30 bg-purple-900/10 p-4">
          <h4 className="font-semibold text-purple-300 mb-3">Your Standing</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Weekly Sales Rank</span>
              <span className="font-bold text-amber-300">#8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly Sales Rank</span>
              <span className="font-bold text-blue-300">#6</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Top Recruiters</span>
              <span className="font-bold text-emerald-300">#3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
