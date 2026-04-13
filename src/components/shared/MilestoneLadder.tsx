'use client';

import React from 'react';
import { Lock, Unlock, CheckCircle, Zap } from 'lucide-react';

interface MilestoneLadderProps {
  currentRank: number;
}

interface Milestone {
  rank: number;
  label: string;
  requirements: string[];
  rewards: string[];
  unlocked: boolean;
  current: boolean;
  nextMilestone?: boolean;
}

/**
 * MilestoneLadder
 * Visual progression ladder showing ranks and unlock requirements
 */
export default function MilestoneLadder({ currentRank }: MilestoneLadderProps) {
  const milestones: Milestone[] = [
    {
      rank: 0,
      label: 'Ambassador',
      requirements: ['Sign up', 'Email verified'],
      rewards: ['25% on direct sales', 'Access to coaching'],
      unlocked: true,
      current: currentRank === 0,
    },
    {
      rank: 1,
      label: 'Tier 1',
      requirements: ['Recruit 1 person', '$500 personal sales'],
      rewards: ['10% on L1 recruits', 'Team dashboard', 'Access to events'],
      unlocked: currentRank >= 1,
      current: currentRank === 1,
      nextMilestone: currentRank === 0,
    },
    {
      rank: 2,
      label: 'Tier 2',
      requirements: ['Recruit 2 people', '$1,500 team sales'],
      rewards: ['5% on L2 recruits', 'Analytics dashboard', 'Co-host events'],
      unlocked: currentRank >= 2,
      current: currentRank === 2,
      nextMilestone: currentRank === 1,
    },
    {
      rank: 3,
      label: 'Tier 3',
      requirements: ['Recruit 3 people', '$3,000 team sales', '2 active L1s'],
      rewards: ['4% on L3 recruits', 'Training access', 'Speaking slots'],
      unlocked: currentRank >= 3,
      current: currentRank === 3,
      nextMilestone: currentRank === 2,
    },
    {
      rank: 4,
      label: 'Tier 4',
      requirements: ['$300/month personal sales', '4 active recruits', '$10,000 team sales'],
      rewards: ['3% on L4 recruits', 'VIP events', 'Incentive trips'],
      unlocked: currentRank >= 4,
      current: currentRank === 4,
      nextMilestone: currentRank === 3,
    },
    {
      rank: 5,
      label: 'Tier 5',
      requirements: ['$300/month personal sales', '5 active recruits', '$25,000 team sales'],
      rewards: ['2% on L5 recruits', 'Luxury trips', 'Board access'],
      unlocked: currentRank >= 5,
      current: currentRank === 5,
      nextMilestone: currentRank === 4,
    },
    {
      rank: 6,
      label: 'Tier 6 (Elite)',
      requirements: ['$300/month personal sales', '6+ active recruits', '$50,000 team sales'],
      rewards: ['1% on L6 recruits', 'Elite circle', 'Revenue sharing'],
      unlocked: currentRank >= 6,
      current: currentRank === 6,
      nextMilestone: currentRank === 5,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="rounded-lg border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-900/20 to-purple-900/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current Rank</p>
            <p className="text-xl font-bold text-fuchsia-300 mt-1">
              {milestones[currentRank]?.label || 'Unknown'}
            </p>
          </div>
          {currentRank < 6 && (
            <div className="text-right">
              <p className="text-sm text-gray-400">To Next Rank</p>
              <p className="text-sm font-semibold text-fuchsia-300 mt-1">
                {milestones[currentRank + 1]?.label}
              </p>
            </div>
          )}
          {currentRank === 6 && (
            <div className="text-right">
              <p className="text-lg font-bold text-fuchsia-300">Elite Tier Achieved!</p>
            </div>
          )}
        </div>
      </div>

      {/* Ladder */}
      <div className="space-y-3">
        {milestones.map((milestone, idx) => (
          <div key={milestone.rank} className="relative">
            {/* Connector Line */}
            {idx < milestones.length - 1 && (
              <div className="absolute left-8 top-16 w-0.5 h-8 bg-gradient-to-b from-gray-700 to-transparent" />
            )}

            {/* Milestone Card */}
            <div
              className={`rounded-lg border p-4 transition-all ${
                milestone.current
                  ? 'border-fuchsia-500/50 bg-gradient-to-r from-fuchsia-900/40 to-purple-900/30 shadow-lg shadow-fuchsia-500/20'
                  : milestone.unlocked
                  ? 'border-emerald-500/30 bg-emerald-900/10'
                  : 'border-gray-700/30 bg-gray-800/10 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Rank Circle */}
                <div
                  className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    milestone.current
                      ? 'bg-gradient-to-br from-fuchsia-400 to-purple-400 text-gray-900'
                      : milestone.unlocked
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {milestone.unlocked || milestone.current ? (
                    milestone.current ? (
                      '★'
                    ) : (
                      '✓'
                    )
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-bold text-gray-100">{milestone.label}</h4>
                    {milestone.current && (
                      <span className="inline-block rounded-full bg-fuchsia-500 px-2 py-0.5 text-xs font-bold text-gray-900">
                        CURRENT
                      </span>
                    )}
                    {milestone.nextMilestone && (
                      <span className="inline-block rounded-full border border-fuchsia-500/50 bg-fuchsia-500/10 px-2 py-0.5 text-xs font-bold text-fuchsia-300">
                        NEXT
                      </span>
                    )}
                  </div>

                  {/* Requirements */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 mb-1">Requirements:</p>
                    <ul className="space-y-1">
                      {milestone.requirements.map((req, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-center gap-1.5">
                          {milestone.unlocked ? (
                            <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Lock className="h-3 w-3 text-gray-600 flex-shrink-0" />
                          )}
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rewards */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">Rewards:</p>
                    <ul className="space-y-1">
                      {milestone.rewards.map((reward, i) => (
                        <li key={i} className="text-xs text-fuchsia-300 flex items-center gap-1.5">
                          <Zap className="h-3 w-3 flex-shrink-0" />
                          {reward}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Summary */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-lg border border-gray-700/30 bg-gray-800/20">
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">{currentRank}</p>
          <p className="text-xs text-gray-400 mt-1">Tiers Unlocked</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-cyan-400">{currentRank === 6 ? '∞' : 7 - currentRank}</p>
          <p className="text-xs text-gray-400 mt-1">Tiers Remaining</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-fuchsia-400">{currentRank * 14 + 25}%</p>
          <p className="text-xs text-gray-400 mt-1">Max Commission</p>
        </div>
      </div>
    </div>
  );
}
