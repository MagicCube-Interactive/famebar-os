'use client';

import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface MonthlyForecastProps {
  /** Current month's earnings so far */
  currentMonthEarnings: number;
  /** Days elapsed in the month */
  daysElapsed: number;
  /** Total days in month */
  daysInMonth?: number;
  /** Conservative projection multiplier (e.g., 0.8 = 80% of current pace) */
  conservativeMultiplier?: number;
  /** Optimistic projection multiplier (e.g., 1.2 = 120% of current pace) */
  optimisticMultiplier?: number;
}

/**
 * MonthlyForecast
 * Projects monthly earnings based on current daily run rate
 * Shows conservative/likely/optimistic scenarios
 */
export default function MonthlyForecast({
  currentMonthEarnings,
  daysElapsed,
  daysInMonth = 30,
  conservativeMultiplier = 0.85,
  optimisticMultiplier = 1.15,
}: MonthlyForecastProps) {
  // Calculate daily average
  const dailyAverage = daysElapsed > 0 ? currentMonthEarnings / daysElapsed : 0;
  const remainingDays = Math.max(0, daysInMonth - daysElapsed);

  // Calculate projections
  const likelyProjection = currentMonthEarnings + dailyAverage * remainingDays;
  const conservativeProjection = currentMonthEarnings + dailyAverage * remainingDays * conservativeMultiplier;
  const optimisticProjection = currentMonthEarnings + dailyAverage * remainingDays * optimisticMultiplier;

  // Calculate progress percentage
  const progressPercent = (daysElapsed / daysInMonth) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-100">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          Monthly Earnings Forecast
        </h3>

        {/* Progress Through Month */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">Month Progress</p>
            <p className="text-xs font-semibold text-amber-300">
              {daysElapsed} of {daysInMonth} days
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700/50">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Daily Average */}
        <div className="mb-6 rounded-lg bg-gray-800/50 p-4">
          <p className="text-xs text-gray-500">Daily Average Earnings</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            ${dailyAverage.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Based on {daysElapsed} days of sales
          </p>
        </div>
      </div>

      {/* Projections */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Conservative */}
        <div className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-orange-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">
            Conservative
          </p>
          <p className="mt-3 text-2xl font-bold text-orange-300">
            ${conservativeProjection.toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {Math.round(conservativeMultiplier * 100 - 100)}% slower pace
          </p>
        </div>

        {/* Likely (Most Probable) */}
        <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Likely Forecast
          </p>
          <p className="mt-3 text-2xl font-bold text-emerald-300">
            ${likelyProjection.toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Based on current pace
          </p>
        </div>

        {/* Optimistic */}
        <div className="rounded-lg border border-green-500/30 bg-gradient-to-br from-green-900/20 to-green-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-400">
            Optimistic
          </p>
          <p className="mt-3 text-2xl font-bold text-green-300">
            ${optimisticProjection.toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {Math.round(optimisticMultiplier * 100 - 100)}% faster pace
          </p>
        </div>
      </div>

      {/* Insight */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-blue-400 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-300">Pro Tip</p>
            <p className="mt-1 text-xs text-blue-200">
              {remainingDays > 0
                ? `You have ${remainingDays} days left this month. Accelerate your sales by ${Math.round((optimisticProjection - likelyProjection) / remainingDays)}/day to reach your optimistic target!`
                : 'Month is complete. Check your final earnings in the history tab.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
