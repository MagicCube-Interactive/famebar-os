'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const metrics = [
    {
      title: 'Team Growth',
      value: '12',
      trend: '+2',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Avg Sales/Member',
      value: '$1,842',
      trend: '+8%',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: 'Commission Earned',
      value: '$12,450',
      trend: '+15%',
      icon: Zap,
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Analytics</h1>
        <p className="text-gray-400">Deep dive into your team's performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className={`rounded-lg border border-gray-700/50 bg-gray-800/30 p-6`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-400">{metric.title}</h3>
                <Icon className="h-5 w-5 text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-gray-100">{metric.value}</p>
              <p className="text-xs text-emerald-400 mt-2">{metric.trend} this month</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Charts coming soon</p>
        </div>
      </div>
    </div>
  );
}
