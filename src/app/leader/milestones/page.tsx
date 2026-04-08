'use client';

import React from 'react';
import { Award, Trophy, TrendingUp } from 'lucide-react';
import MilestoneLadder from '@/components/leader/MilestoneLadder';

/**
 * Milestones Page
 * Rank progression and achievement tracking
 */
export default function MilestonesPage() {
  const currentRank = 3;

  const achievements = [
    { title: 'First Sale', description: 'Completed first order', icon: '🎯', unlocked: true, date: '2024-01-15' },
    { title: 'Team Builder', description: 'Recruited 5 ambassadors', icon: '👥', unlocked: true, date: '2024-02-20' },
    { title: 'Sales Champion', description: 'Generated $5,000 in sales', icon: '💰', unlocked: true, date: '2024-03-10' },
    { title: 'Rising Star', description: 'Reached L2 tier', icon: '⭐', unlocked: true, date: '2024-03-25' },
    { title: 'Leader Status', description: 'Achieved L3 tier', icon: '🏆', unlocked: true, date: '2024-04-05' },
    { title: 'Executive Bound', description: 'Path to L4 tier', icon: '🚀', unlocked: false },
  ];

  const upcomingIncentives = [
    {
      title: 'L4 Resort Getaway',
      requirement: 'Reach Executive tier',
      value: '$2,500 resort package',
      progress: 60,
    },
    {
      title: 'Annual Diamond Trip',
      requirement: 'Achieve L5 tier + $50K sales',
      value: 'All-expenses paid luxury trip',
      progress: 35,
    },
    {
      title: 'Elite Leadership Circle',
      requirement: 'Reach L6 + $100K+ team sales',
      value: 'VIP access + revenue sharing',
      progress: 25,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Rank & Milestones</h1>
        <p className="text-gray-400">Track your progression through the leadership tiers and unlock rewards</p>
      </div>

      {/* Main Ladder */}
      <MilestoneLadder currentRank={currentRank} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Achievements Unlocked
          </h3>

          <div className="space-y-3">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-4 ${
                  achievement.unlocked
                    ? 'border-emerald-500/30 bg-emerald-900/10'
                    : 'border-gray-700/30 bg-gray-800/10 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-100">{achievement.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
                    {achievement.unlocked && achievement.date && (
                      <p className="text-xs text-emerald-300 mt-2">Unlocked: {achievement.date}</p>
                    )}
                  </div>
                  {achievement.unlocked && (
                    <div className="text-2xl">✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Incentives */}
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            Upcoming Incentives & Trips
          </h3>

          <div className="space-y-4">
            {upcomingIncentives.map((incentive, idx) => (
              <div key={idx} className="rounded-lg border border-amber-500/30 bg-amber-900/10 p-4">
                <div className="mb-3">
                  <h4 className="font-semibold text-amber-300">{incentive.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{incentive.requirement}</p>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Progress</span>
                    <span className="text-xs font-semibold text-amber-300">{incentive.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                      style={{ width: `${incentive.progress}%` }}
                    />
                  </div>
                </div>

                <p className="text-sm font-semibold text-amber-300">{incentive.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Milestones Info */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 p-6">
        <h3 className="mb-4 text-lg font-semibold text-blue-300">Important Tier Requirements</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div>
              <p className="font-semibold text-gray-100">Tier 4 & Above Requirements</p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1">
                <li>• Maintain $300/month in personal sales</li>
                <li>• Keep active status every billing period</li>
                <li>• Suspension without sales triggers refunds</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <p className="font-semibold text-gray-100">Commission Maximization</p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1">
                <li>• Deeper tiers = more passive income</li>
                <li>• Each recruit unlocks 25% of their sales</li>
                <li>• Lock tiers if they become inactive</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Section */}
      <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🚀</div>
          <div>
            <h3 className="text-lg font-bold text-purple-300 mb-2">You're on track to L4!</h3>
            <p className="text-sm text-gray-300 mb-3">
              You're 60% of the way to Executive tier. Focus on recruiting one more active L1 ambassador
              and you'll unlock L4 benefits including VIP events and incentive trips.
            </p>
            <button className="rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/30 transition-colors">
              See L4 Benefits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
