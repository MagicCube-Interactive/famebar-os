'use client';

import React from 'react';

interface Tier {
  level: number;
  tokens: number;
  discount: number;
  name: string;
  icon: string;
}

interface HoldToSaveLadderProps {
  /** Current user's $FAME balance */
  currentBalance: number;
  /** Callback when tier is clicked */
  onTierClick?: (tier: Tier) => void;
}

/**
 * HoldToSaveLadder
 * Visual representation of the 4-tier Hold-to-Save reward system
 * Shows current position, progress to next tier, and unlocked benefits
 */
export default function HoldToSaveLadder({
  currentBalance,
  onTierClick,
}: HoldToSaveLadderProps) {
  const tiers: Tier[] = [
    {
      level: 1,
      tokens: 10000,
      discount: 5,
      name: 'Silver Tier',
      icon: '⭐',
    },
    {
      level: 2,
      tokens: 25000,
      discount: 10,
      name: 'Gold Tier',
      icon: '✨',
    },
    {
      level: 3,
      tokens: 50000,
      discount: 15,
      name: 'Diamond Tier',
      icon: '💎',
    },
    {
      level: 4,
      tokens: 100000,
      discount: 20,
      name: 'Platinum Tier',
      icon: '🌟',
    },
  ];

  // Determine current and next tier
  const currentTierIndex = tiers.findIndex((tier) => currentBalance >= tier.tokens);
  const isAtMaxTier = currentTierIndex === tiers.length - 1 || currentBalance >= tiers[tiers.length - 1].tokens;

  const getProgressToNextTier = () => {
    if (isAtMaxTier) return 100;
    const nextTierIndex = currentTierIndex + 1;
    const nextTier = tiers[nextTierIndex];
    const prevTier = currentTierIndex >= 0 ? tiers[currentTierIndex] : null;
    const prevTokens = prevTier ? prevTier.tokens : 0;

    const progress = ((currentBalance - prevTokens) / (nextTier.tokens - prevTokens)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="space-y-6">
      {/* Ladder Visualization */}
      <div className="space-y-3">
        {tiers.map((tier, index) => {
          const isUnlocked = currentBalance >= tier.tokens;
          const isCurrentTier =
            currentBalance >= tier.tokens &&
            (index === tiers.length - 1 || currentBalance < tiers[index + 1].tokens);

          return (
            <button
              key={tier.tokens}
              onClick={() => onTierClick?.(tier)}
              className={`w-full rounded-lg border transition-all p-4 text-left ${
                isUnlocked || isCurrentTier
                  ? 'border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20'
                  : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Left: Tier Info */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-100">{tier.name}</h4>
                    <p className={`text-sm ${isUnlocked ? 'text-amber-300' : 'text-gray-500'}`}>
                      {tier.tokens.toLocaleString()} tokens
                    </p>
                  </div>
                </div>

                {/* Right: Discount */}
                <div className="text-right">
                  <p className={`text-2xl font-bold ${isUnlocked ? 'text-amber-400' : 'text-gray-500'}`}>
                    {tier.discount}%
                  </p>
                  <p className="text-xs text-gray-500">Discount</p>
                </div>
              </div>

              {/* Progress Bar (if current tier and not max) */}
              {isCurrentTier && !isAtMaxTier && (
                <div className="mt-3 h-1.5 rounded-full bg-gray-700/30 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                    style={{ width: `${getProgressToNextTier()}%` }}
                  />
                </div>
              )}

              {/* Unlocked Badge */}
              {isUnlocked && (
                <div className="mt-2 text-xs font-semibold text-emerald-300">✓ Unlocked</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Progress */}
      {!isAtMaxTier && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-900/20 p-4">
          <p className="text-sm font-semibold text-amber-300 mb-2">Progress to Next Tier</p>
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                style={{ width: `${getProgressToNextTier()}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">
                {currentBalance.toLocaleString()} of{' '}
                {tiers[Math.min(currentTierIndex + 1, tiers.length - 1)].tokens.toLocaleString()} tokens
              </span>
              <span className="text-amber-300 font-semibold">
                {Math.max(
                  0,
                  tiers[Math.min(currentTierIndex + 1, tiers.length - 1)].tokens - currentBalance
                ).toLocaleString()}{' '}
                to go
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Max Tier Achieved */}
      {isAtMaxTier && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-900/20 p-4 text-center">
          <p className="text-sm font-bold text-emerald-300">🌟 You've reached Platinum Tier!</p>
          <p className="text-xs text-emerald-200/70 mt-1">
            Enjoy the maximum 20% discount on all your purchases
          </p>
        </div>
      )}

      {/* Benefits Info */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4 space-y-3">
        <h4 className="font-semibold text-gray-100">Tier Benefits</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2">
            <span className="text-amber-300">✓</span>
            <span>Personal order discounts (5-20% off)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-300">✓</span>
            <span>Applied automatically at checkout</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-300">✓</span>
            <span>Earn more by buying more</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-300">✓</span>
            <span>Never expires while you hold tokens</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
