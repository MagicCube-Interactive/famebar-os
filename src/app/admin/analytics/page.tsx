'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const metrics = [
    { title: 'GMV Growth', value: '+12.5%', trend: 'vs last month', color: 'emerald' },
    { title: 'Active Users', value: '+8.3%', trend: 'vs last month', color: 'blue' },
    { title: 'Conversion Rate', value: '68.5%', trend: '-2.1% vs last month', color: 'orange' },
    { title: 'Token Circulation', value: '3.24M', trend: 'outstanding', color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Analytics</h1>
        <p className="text-gray-400">Platform-wide analytics and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-5"
          >
            <p className="text-xs font-medium text-gray-400 mb-2">{metric.title}</p>
            <p className="text-2xl font-bold text-gray-100">{metric.value}</p>
            <p className="text-xs text-gray-500 mt-2">{metric.trend}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Detailed charts coming soon</p>
        </div>
      </div>
    </div>
  );
}
