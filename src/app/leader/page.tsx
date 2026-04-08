'use client';

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';

/**
 * Leader Home Dashboard — Aureum Obsidian Design
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
  const teamActivityData = Array(48).fill(null).map((_, i) => ({
    id: `member-${i}`,
    name: `Ambassador ${i + 1}`,
    status: ['active', 'stalled', 'new', 'at-risk'][Math.floor(Math.random() * 4)] as 'active' | 'stalled' | 'new' | 'at-risk',
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
      icon: 'trending_up',
      action: 'Coach them now',
      iconBg: 'bg-secondary-container/20',
      iconColor: 'text-secondary',
      actionColor: 'text-secondary-fixed-dim',
    },
    {
      id: '2',
      title: '3 pending ambassadors need approval',
      icon: 'person_add',
      action: 'Review queue',
      iconBg: 'bg-primary-container/20',
      iconColor: 'text-primary',
      actionColor: 'text-primary-fixed-dim',
    },
  ];

  // Top performers
  const topPerformers = [
    { name: 'Alex Rivera', level: 'L1', units: 42, earnings: 4230, growth: '+12%' },
    { name: 'Sarah Chen', level: 'L1', units: 38, earnings: 3890, growth: '+8%' },
  ];

  // Waterfall bar data (L1-L6)
  const waterfallLevels = [
    { label: 'L1', value: teamSalesByLevel[1], opacity: '' },
    { label: 'L2', value: teamSalesByLevel[2], opacity: '/80' },
    { label: 'L3', value: teamSalesByLevel[3], opacity: '/60' },
    { label: 'L4', value: teamSalesByLevel[4], opacity: '/40' },
    { label: 'L5', value: teamSalesByLevel[5], opacity: '/20' },
    { label: 'L6', value: teamSalesByLevel[6], opacity: '/10' },
  ];
  const maxLevelValue = Math.max(...waterfallLevels.map(l => l.value));

  // Heatmap color mapping
  const heatmapColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-secondary';
      case 'stalled': return 'bg-primary';
      case 'new': return 'bg-tertiary';
      case 'at-risk': return 'bg-error';
      default: return 'bg-surface-container-highest';
    }
  };

  // Network health score
  const networkHealthIndex = 92;
  const retentionRate = 94;
  const growthRate = 14.2;
  const circumference = 2 * Math.PI * 60; // r=60
  const healthOffset = circumference - (networkHealthIndex / 100) * circumference;

  // Horizon progress
  const horizonProgress = 75;

  return (
    <div className="space-y-8">
      {/* ── Hero Section: The Harvest ── */}
      <section className="pt-4">
        <p className="text-sm font-medium text-primary-fixed-dim uppercase tracking-[0.2em] mb-2">
          The Harvest
        </p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-5xl md:text-6xl font-bold text-on-surface tracking-tight">
              ${totalTeamSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-secondary font-medium flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Team Revenue Growth +14.2% this month
            </p>
          </div>

          {/* Critical Leak Card */}
          <div className="p-4 bg-surface-container border border-error/20 rounded-xl max-w-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-error" />
            <p className="text-error text-xs font-black uppercase tracking-widest mb-1">Critical Leak</p>
            <p className="text-on-surface font-semibold">
              You left <span className="text-error">${totalUnclaimedValue.toLocaleString()}</span> unclaimed this month
            </p>
            <button className="mt-3 text-xs font-bold text-primary flex items-center gap-1 group">
              Activate L4-L6 to unlock
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Waterfall Revenue Chart (lg:col-span-8) ── */}
        <div className="lg:col-span-8 bg-surface-container-low rounded-xl p-6 flex flex-col justify-between min-h-[400px]">
          <div>
            <h3 className="text-lg font-semibold text-on-surface mb-1">Waterfall Revenue Contribution</h3>
            <p className="text-sm text-on-surface-variant mb-8">
              Performance breakdown by recruitment depth (L1 - L6)
            </p>
          </div>
          <div className="flex items-end justify-between h-48 gap-3">
            {waterfallLevels.map((level) => {
              const heightPct = Math.round((level.value / maxLevelValue) * 100);
              return (
                <div key={level.label} className="flex-1 flex flex-col items-center gap-3">
                  <span className="font-mono text-[10px] text-primary">
                    ${(level.value / 1000).toFixed(1)}k
                  </span>
                  <div
                    className={`w-full bg-primary-container${level.opacity} rounded-t-lg`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-xs font-bold text-on-surface">{level.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── The Pulse (lg:col-span-4) ── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">bolt</span>
            </div>
            <h3 className="text-lg font-semibold text-on-surface mb-4">The Pulse</h3>
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-3 bg-surface-container-high rounded-lg flex items-start gap-3"
                >
                  <div className={`w-8 h-8 rounded-full ${opp.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined ${opp.iconColor} text-sm`}>
                      {opp.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-on-surface">{opp.title}</p>
                    <button className={`mt-2 text-[10px] font-bold ${opp.actionColor} uppercase tracking-wider`}>
                      {opp.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── The Horizon Card ── */}
          <div
            className="p-6 rounded-xl relative overflow-hidden group transition-all cursor-pointer"
            style={{ background: 'radial-gradient(circle at top left, #2f3542 0%, #1a202c 100%)' }}
          >
            <div className="absolute inset-0 bg-surface-tint/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">
                The Horizon
              </p>
              <h4 className="text-lg font-bold text-on-surface mb-1">Platinum Executive</h4>
              <p className="text-sm text-on-surface-variant mb-4">
                Unlock $5,000 monthly bonus and private concierge.
              </p>
              <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${horizonProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-on-surface-variant mt-2 text-right">
                {horizonProgress}% Complete
              </p>
            </div>
          </div>
        </div>

        {/* ── Team Activity Heatmap (lg:col-span-12) ── */}
        <div className="lg:col-span-12 bg-surface-container-low rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Team Activity Network</h3>
              <p className="text-sm text-on-surface-variant">
                Real-time engagement density across your network
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider uppercase">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-secondary" /> Active
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-primary" /> Stalled
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-tertiary" /> New
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-error" /> At-Risk
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 md:grid-cols-24 gap-2">
            {teamActivityData.map((member) => (
              <div
                key={member.id}
                title={`${member.name} — ${member.status}`}
                className={`w-full aspect-square rounded-sm ${heatmapColor(member.status)}`}
              />
            ))}
          </div>
        </div>

        {/* ── Top Performers (lg:col-span-7) ── */}
        <div className="lg:col-span-7 bg-surface-container-low rounded-xl p-6">
          <h3 className="text-lg font-semibold text-on-surface mb-6">Top Performers (L1)</h3>
          <div className="space-y-4">
            {topPerformers.map((performer) => (
              <div
                key={performer.name}
                className="flex items-center justify-between p-4 bg-surface-container rounded-lg group hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <span className="text-sm font-bold text-on-surface">
                      {performer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{performer.name}</p>
                    <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">
                      {performer.level} &bull; {performer.units} Units
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-secondary font-bold">
                    ${performer.earnings.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">{performer.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Network Health (lg:col-span-5) ── */}
        <div className="lg:col-span-5 glass-panel rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-on-surface mb-2">Network Health</h3>
            <p className="text-sm text-on-surface-variant">
              System-wide performance index for your organization.
            </p>
          </div>
          <div className="py-6 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-surface-container-low"
                  cx="64" cy="64" r="60"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary"
                  cx="64" cy="64" r="60"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={healthOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-on-surface">{networkHealthIndex}</span>
                <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">
                  Index
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-surface-container rounded-lg">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Retention
              </p>
              <p className="font-mono text-lg font-bold text-on-surface">{retentionRate}%</p>
            </div>
            <div className="p-3 bg-surface-container rounded-lg">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Growth
              </p>
              <p className="font-mono text-lg font-bold text-on-surface">{growthRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
