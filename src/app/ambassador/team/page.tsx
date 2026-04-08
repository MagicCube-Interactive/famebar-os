'use client';

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { isAmbassador } from '@/types';
import { Users, TrendingUp, UserPlus, Zap } from 'lucide-react';

export default function TeamPage() {
  const { userProfile } = useAuthContext();

  if (!userProfile || !isAmbassador(userProfile)) {
    return null;
  }

  const ambassador = userProfile;

  // Mock team data
  const directRecruits = [
    { id: 1, name: 'Alex Thompson', tier: 2, active: true, sales: 850, recruits: 5 },
    { id: 2, name: 'Jordan Lee', tier: 1, active: true, sales: 450, recruits: 2 },
    { id: 3, name: 'Casey Brown', tier: 1, active: false, sales: 0, recruits: 0 },
    { id: 4, name: 'Morgan White', tier: 2, active: true, sales: 620, recruits: 3 },
    { id: 5, name: 'Riley Davis', tier: 1, active: true, sales: 380, recruits: 1 },
    { id: 6, name: 'Taylor Martin', tier: 1, active: false, sales: 0, recruits: 0 },
  ];

  const teamStats = {
    totalTeamSize: 156,
    directRecruits: 12,
    activeMembers: 84,
    stalledMembers: 42,
    newRecruitsThisWeek: 3,
    teamSalesThisMonth: 18500,
  };

  const levelBreakdown = [
    { level: 1, count: 12, active: 10, sales: 3200 },
    { level: 2, count: 28, active: 21, sales: 1800 },
    { level: 3, count: 45, active: 32, sales: 892 },
    { level: 4, count: 62, active: 38, sales: 650 },
    { level: 5, count: 84, active: 42, sales: 420 },
    { level: 6, count: 120, active: 48, sales: 180 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Your Team</h1>
        <p className="mt-2 text-gray-400">Manage and grow your network</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-4">
          <p className="text-xs text-gray-500">Total Network Size</p>
          <p className="mt-2 text-3xl font-bold text-blue-400">{teamStats.totalTeamSize}</p>
          <p className="mt-1 text-xs text-blue-300">across all 6 tiers</p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="text-xs text-gray-500">Active Members</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{teamStats.activeMembers}</p>
          <p className="mt-1 text-xs text-emerald-300">
            {Math.round((teamStats.activeMembers / teamStats.totalTeamSize) * 100)}% active rate
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-xs text-gray-500">New This Week</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">+{teamStats.newRecruitsThisWeek}</p>
          <p className="mt-1 text-xs text-amber-300">recruits joined</p>
        </div>
        <div className="rounded-lg border border-orange-500/30 bg-orange-950/20 p-4">
          <p className="text-xs text-gray-500">Stalled Members</p>
          <p className="mt-2 text-3xl font-bold text-orange-400">{teamStats.stalledMembers}</p>
          <p className="mt-1 text-xs text-orange-300">no sales in 30 days</p>
        </div>
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-4">
          <p className="text-xs text-gray-500">Direct Recruits</p>
          <p className="mt-2 text-3xl font-bold text-yellow-400">{teamStats.directRecruits}</p>
          <p className="mt-1 text-xs text-yellow-300">L1 ambassadors</p>
        </div>
        <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-4">
          <p className="text-xs text-gray-500">Network Sales (MTD)</p>
          <p className="mt-2 text-3xl font-bold text-purple-400">
            ${teamStats.teamSalesThisMonth.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-purple-300">from your team</p>
        </div>
      </div>

      {/* Invite CTA */}
      <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-yellow-950/20 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <UserPlus className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-300">Grow Your Team</h3>
              <p className="mt-1 text-sm text-gray-300">
                Every recruit you add becomes another revenue stream. Your top 3 teammates generate 40%+ of network income.
              </p>
            </div>
          </div>
          <button className="whitespace-nowrap rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-2.5 font-semibold text-gray-900 transition-all duration-200 hover:from-amber-600 hover:to-yellow-500">
            Invite New Ambassador
          </button>
        </div>
      </div>

      {/* Direct Recruits */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 overflow-hidden">
        <div className="border-b border-gray-700/30 bg-gray-900/50 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <Users className="h-5 w-5 text-amber-400" />
            Your Direct Recruits (L1)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700/30">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Name</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400">Tier Reached</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Sales (MTD)</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Their Recruits</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {directRecruits.map((recruit) => (
                <tr key={recruit.id} className="border-b border-gray-700/20 hover:bg-gray-800/50 transition-all">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-200">{recruit.name}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                      L{recruit.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-gray-200">
                      ${recruit.sales > 0 ? recruit.sales.toLocaleString() : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-gray-200">{recruit.recruits}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        recruit.active
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-orange-500/20 text-orange-300'
                      }`}
                    >
                      {recruit.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Composition by Level */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-100">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          Network Composition by Level
        </h2>

        <div className="space-y-4">
          {levelBreakdown.map((level) => (
            <div key={level.level}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 font-bold text-amber-300 text-xs">
                    L{level.level}
                  </span>
                  <span className="text-sm font-medium text-gray-200">{level.count} ambassadors</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-emerald-400">
                    {level.active}/{level.count} active
                  </p>
                  <p className="text-xs text-gray-500">
                    ${level.sales.toLocaleString()} earnings
                  </p>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-700/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                  style={{ width: `${(level.active / level.count) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activation Opportunity */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-6">
        <div className="flex items-start gap-4">
          <Zap className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-300">Reactivate Stalled Team Members</h3>
            <p className="mt-2 text-sm text-blue-200">
              You have {teamStats.stalledMembers} team members who haven't made sales in 30 days. Reach out with
              personalized support - reactivating just 50% could add $2,500+ to your monthly earnings!
            </p>
            <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-600">
              View Stalled Members
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
