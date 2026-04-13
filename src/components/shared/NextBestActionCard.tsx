'use client';

import React from 'react';
import { NextBestAction } from '@/types';
import { getActionIcon, getActionColor, getRewardBadgeStyle } from '@/lib/nba/ui-helpers';
import ProgressRing from './ProgressRing';

interface NextBestActionCardProps {
  action: NextBestAction;
  onCTA?: (actionId: string) => void;
  isLoading?: boolean;
}

/**
 * NextBestActionCard
 * Renders a single NBA recommendation with progress, reward, and CTA
 * Dark premium theme with gold accents for rewards
 */
export default function NextBestActionCard({
  action,
  onCTA,
  isLoading = false,
}: NextBestActionCardProps) {
  const progressPercent =
    action.progressTarget > 0
      ? Math.min(100, (action.progressCurrent / action.progressTarget) * 100)
      : 0;

  const Icon = getActionIcon(action.actionType);
  const { bgColor, borderColor, textColor } = getActionColor(action.actionType, action.priority);
  const { badgeBg, badgeText } = getRewardBadgeStyle(action.reward);

  const handleCTA = () => {
    if (onCTA && !isLoading) {
      onCTA(action.actionId);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg ${bgColor} ${borderColor}`}
    >
      {/* Gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-400 via-purple-300 to-transparent" />

      <div className="p-5">
        {/* Header: Icon + Priority Badge */}
        <div className="mb-3 flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${textColor}`} />
          </div>

          {/* Priority badge (1-3 = high/medium, 4-5 = low) */}
          {action.priority <= 2 && (
            <div className="inline-block rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-300">
              {action.priority === 1 ? 'Urgent' : 'High'}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-sm font-semibold text-gray-100">{action.title}</h3>

        {/* Description */}
        <p className="mb-4 text-xs text-gray-400 leading-relaxed">{action.description}</p>

        {/* Progress bar (if applicable) */}
        {action.progressTarget > 0 && (
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-gray-400">Progress</span>
              <span className="font-mono text-gray-300">
                {action.progressCurrent.toLocaleString()} / {action.progressTarget.toLocaleString()}{' '}
                {action.progressUnit}
              </span>
            </div>

            {/* Animated progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-gray-700/50">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Reward badge (if applicable) */}
        {action.reward && (
          <div className={`mb-4 inline-block rounded-lg px-3 py-1.5 ${badgeBg}`}>
            <p className={`text-xs font-semibold ${badgeText}`}>
              🏆 {action.reward}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="mb-4 h-px bg-gray-700/50" />

        {/* CTA Button */}
        <button
          onClick={handleCTA}
          disabled={isLoading}
          className={`w-full rounded-lg py-2.5 px-3 font-medium text-sm transition-all duration-200 ${
            action.priority <= 2
              ? 'bg-gradient-to-r from-fuchsia-500 to-purple-400 text-gray-900 hover:from-fuchsia-600 hover:to-purple-500 disabled:opacity-50'
              : 'bg-gray-700 text-gray-100 hover:bg-gray-600 disabled:opacity-50'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading...
            </span>
          ) : (
            `${action.priority <= 2 ? '→ ' : ''}${getCtaText(action.actionType)}`
          )}
        </button>
      </div>

      {/* Corner accent for high-priority actions */}
      {action.priority === 1 && (
        <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-xl" />
      )}
    </div>
  );
}

/**
 * Gets CTA button text based on action type
 */
function getCtaText(actionType: string): string {
  const ctaMap: Record<string, string> = {
    // Ambassador actions
    complete_kyc: 'Verify Now',
    add_telegram: 'Connect Telegram',
    complete_onboarding: 'Next Step',
    share_code: 'Share Now',
    reach_active_requirement: 'View Sales',
    first_recruit: 'Start Recruiting',
    tier_advancement: 'Advance Tier',

    // Admin actions
    review_orders: 'Review Orders',
    collect_payout_info: 'Collect Info',
    process_refunds: 'Process Batch',
    schedule_event: 'Confirm Send',
    settlement_report: 'View Report',
  };

  return ctaMap[actionType] || 'Get Started';
}
