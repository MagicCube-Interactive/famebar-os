'use client';

import React from 'react';
import { TrendingUp, Users } from 'lucide-react';

interface LevelBreakdownRow {
  level: number;
  label: string;
  teamCount: number;
  activeCount: number;
  earningsThisMonth: number;
}

interface LevelBreakdownProps {
  /** Data for each tier (L1-L6) */
  data: LevelBreakdownRow[];
  /** Total earnings from network */
  totalNetworkEarnings?: number;
}

/**
 * LevelBreakdown
 * Displays commission structure with team counts and earnings per tier
 * Shows L1-L6 breakdown with visual indicators
 */
export default function LevelBreakdown({
  data,
  totalNetworkEarnings,
}: LevelBreakdownProps) {
  const getTierColor = (level: number): string => {
    const colors = [
      'from-red-500/20 to-red-600/10 border-red-500/30 text-red-300',      // L1
      'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-300',  // L2
      'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-300',  // L3
      'from-green-500/20 to-green-600/10 border-green-500/30 text-green-300',    // L4
      'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-300',     // L5
      'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-300',  // L6
    ];
    return colors[level - 1] || colors[0];
  };

  const getCommissionRate = (level: number): string => {
    const rates = ['25%', '10%', '5%', '4%', '3%', '2%', '1%'];
    return rates[level - 1] || '0%';
  };

  return (
    <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-700/30 bg-gray-900/50 px-6 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          Network Breakdown by Level
        </h3>
        {totalNetworkEarnings && (
          <p className="mt-2 text-xs text-gray-400">
            Total network earnings: <span className="font-bold text-emerald-400">
              ${totalNetworkEarnings.toFixed(2)}
            </span>
          </p>
        )}
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr className="border-b border-gray-700/30">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Level</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Rate</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Team Size</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Active</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Earnings</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.level}
                className="border-b border-gray-700/20 transition-all duration-200 hover:bg-gray-800/30"
              >
                {/* Level */}
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-2 rounded-lg border bg-gradient-to-r px-3 py-1.5 text-sm font-semibold ${getTierColor(row.level)}`}>
                    <span>L{row.level}</span>
                    <span className="text-xs font-normal opacity-75">{row.label}</span>
                  </div>
                </td>

                {/* Commission Rate */}
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-amber-300">
                    {getCommissionRate(row.level)}
                  </span>
                </td>

                {/* Team Size */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-200">
                      {row.teamCount}
                    </span>
                  </div>
                </td>

                {/* Active Count */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-sm font-semibold text-gray-200">
                      {row.activeCount}/{row.teamCount}
                    </span>
                  </div>
                </td>

                {/* Earnings */}
                <td className="px-6 py-4 text-right">
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      ${row.earningsThisMonth.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {row.teamCount > 0
                        ? `$${(row.earningsThisMonth / row.teamCount).toFixed(2)}/person`
                        : 'No earnings'}
                    </p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="border-t border-gray-700/30 bg-gray-900/50 px-6 py-3">
        <p className="text-xs text-gray-400">
          <span className="font-semibold text-gray-300">Total Recruits:</span>
          {' '}
          {data.reduce((sum, row) => sum + row.teamCount, 0)}
          {' '}
          |
          {' '}
          <span className="font-semibold text-gray-300">Active Rate:</span>
          {' '}
          {data.length > 0
            ? `${Math.round((data.reduce((sum, row) => sum + row.activeCount, 0) / data.reduce((sum, row) => sum + row.teamCount, 0)) * 100)}%`
            : 'N/A'}
        </p>
      </div>
    </div>
  );
}
