'use client';

import React from 'react';
import { DollarSign, Zap, TrendingUp } from 'lucide-react';
import ProgressRing from './ProgressRing';

interface EarningsCardProps {
  /** Available cash ready for withdrawal ($) */
  availableCash: number;
  /** Pending cash in settlement window ($) */
  pendingCash: number;
  /** Available $FAME tokens balance */
  availableTokens: number;
  /** Pending $FAME tokens in settlement window */
  pendingTokens: number;
  /** Current Hold-to-Save discount tier (0, 5, 10, 15, 20) */
  holdToSaveTier: 0 | 5 | 10 | 15 | 20;
  /** $FAME balance for tier progress calculation */
  fameBalance: number;
  /** Is this for an ambassador (shows different data) */
  isAmbassador?: boolean;
  /** Callback for "Withdraw" button */
  onWithdraw?: () => void;
  /** Callback for "View Details" button */
  onViewDetails?: () => void;
}

/**
 * EarningsCard
 * Displays comprehensive earnings dashboard with cash, tokens, and tier progress
 * Used by both buyers (shows Hold-to-Save) and ambassadors (shows commissions)
 * Dark premium theme with green accents for earnings, gold for rewards
 */
export default function EarningsCard({
  availableCash,
  pendingCash,
  availableTokens,
  pendingTokens,
  holdToSaveTier,
  fameBalance,
  isAmbassador = false,
  onWithdraw,
  onViewDetails,
}: EarningsCardProps) {
  // Calculate next tier and progress
  const tierThresholds = [10000, 25000, 50000, 100000];
  const currentTierIndex = tierThresholds.findIndex(t => fameBalance < t);
  const nextThreshold = currentTierIndex >= 0 ? tierThresholds[currentTierIndex] : 100000;
  const prevThreshold = currentTierIndex > 0 ? tierThresholds[currentTierIndex - 1] : 0;

  const tierProgress = Math.min(
    100,
    ((fameBalance - prevThreshold) / (nextThreshold - prevThreshold)) * 100
  );

  const nextTierDiscount =
    currentTierIndex >= 0
      ? [5, 10, 15, 20][currentTierIndex]
      : 20; // Already at max

  const totalEarnings = availableCash + pendingCash;

  return (
    <div className="space-y-4">
      {/* Main Earnings Display */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            {isAmbassador ? 'Commission Earnings' : 'Your Earnings'}
          </h3>
          {totalEarnings > 0 && (
            <div className="rounded-full bg-emerald-500/10 px-2.5 py-0.5">
              <span className="text-xs font-semibold text-emerald-300">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Active
              </span>
            </div>
          )}
        </div>

        {/* Available Cash (Big Number) */}
        <div className="mb-6 space-y-1">
          <p className="text-xs font-medium text-gray-500">Available Cash</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-400">
              ${availableCash.toFixed(2)}
            </span>
            {pendingCash > 0 && (
              <div className="text-sm">
                <span className="text-gray-400">+</span>
                <span className="ml-1 font-medium text-amber-300">
                  ${pendingCash.toFixed(2)} pending
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px bg-gray-700/30" />

        {/* $FAME Tokens Display */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* Available Tokens */}
          <div className="rounded-lg bg-gray-700/20 p-3">
            <p className="mb-1 text-xs font-medium text-gray-500">Available $FAME</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-yellow-400">
                {availableTokens.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">tokens</span>
            </div>
          </div>

          {/* Pending Tokens */}
          <div className="rounded-lg bg-gray-700/20 p-3">
            <p className="mb-1 text-xs font-medium text-gray-500">Pending $FAME</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-300">
                {pendingTokens.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">tokens</span>
            </div>
          </div>
        </div>

        {/* Hold-to-Save Tier Progress */}
        {!isAmbassador && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">Hold-to-Save Tier</p>
              <p className="text-xs font-semibold text-amber-300">{holdToSaveTier}% Discount</p>
            </div>

            {/* Tier Badge */}
            <div className="rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-200">
                  {holdToSaveTier === 20
                    ? '🌟 Platinum Tier'
                    : holdToSaveTier === 15
                    ? '💎 Diamond Tier'
                    : holdToSaveTier === 10
                    ? '✨ Gold Tier'
                    : holdToSaveTier === 5
                    ? '⭐ Silver Tier'
                    : '🔷 Bronze Tier'}
                </span>
                {currentTierIndex < 4 && (
                  <span className="text-xs text-gray-400">
                    {nextThreshold - fameBalance} more tokens to next tier
                  </span>
                )}
              </div>

              {/* Progress Ring for Tier */}
              {currentTierIndex < 4 && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                    style={{ width: `${tierProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onWithdraw}
          className="rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 py-2.5 px-4 text-center text-sm font-semibold text-white transition-all duration-200 hover:from-emerald-700 hover:to-green-600 disabled:opacity-50"
          disabled={availableCash <= 0}
        >
          Withdraw
        </button>
        <button
          onClick={onViewDetails}
          className="rounded-lg border border-gray-600 bg-gray-700/30 py-2.5 px-4 text-center text-sm font-semibold text-gray-100 transition-all duration-200 hover:bg-gray-600/30"
        >
          View Details
        </button>
      </div>

      {/* Settlement Window Notice */}
      {pendingCash > 0 && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-3">
          <p className="text-xs text-blue-300">
            <span className="font-semibold">Settlement in progress:</span> Your pending earnings will be
            available in 7-14 days. Check back soon!
          </p>
        </div>
      )}

      {/* Empty State */}
      {availableCash === 0 && pendingCash === 0 && (
        <div className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-3 text-center">
          <p className="text-xs text-gray-400">
            {isAmbassador
              ? 'Start recruiting to earn commissions'
              : 'Complete orders to earn $FAME tokens'}
          </p>
        </div>
      )}
    </div>
  );
}
