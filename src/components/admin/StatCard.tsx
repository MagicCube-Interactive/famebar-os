'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  color?: 'emerald' | 'blue' | 'purple' | 'orange' | 'fuchsia';
  trendNegative?: boolean;
}

/**
 * StatCard
 * Reusable stat card with icon, title, value, and trend indicator
 */
export default function StatCard({
  icon,
  title,
  value,
  trend,
  trendLabel,
  color = 'emerald',
  trendNegative = false,
}: StatCardProps) {
  const colorMap = {
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-900/10',
      icon: 'text-emerald-400',
      value: 'text-emerald-400',
    },
    blue: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-900/10',
      icon: 'text-blue-400',
      value: 'text-blue-400',
    },
    purple: {
      border: 'border-purple-500/30',
      bg: 'bg-purple-900/10',
      icon: 'text-purple-400',
      value: 'text-purple-400',
    },
    orange: {
      border: 'border-orange-500/30',
      bg: 'bg-orange-900/10',
      icon: 'text-orange-400',
      value: 'text-orange-400',
    },
    fuchsia: {
      border: 'border-fuchsia-500/30',
      bg: 'bg-fuchsia-900/10',
      icon: 'text-fuchsia-400',
      value: 'text-fuchsia-400',
    },
  };

  const config = colorMap[color];

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-6`}>
      {/* Icon */}
      <div className={`flex items-center justify-center h-12 w-12 rounded-lg bg-gray-800 ${config.icon} mb-4`}>
        {icon}
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-gray-400 mb-2">{title}</p>

      {/* Value */}
      <p className={`text-3xl font-bold ${config.value} mb-3`}>{value}</p>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trend >= 0 && !trendNegative ? (
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-xs font-semibold ${trend >= 0 && !trendNegative ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 && !trendNegative ? '+' : ''}{trend?.toFixed(1)}%
          </span>
          {trendLabel && <span className="text-xs text-gray-500">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
