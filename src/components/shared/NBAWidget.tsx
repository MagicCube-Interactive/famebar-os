'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { User, NextBestAction } from '@/types';
import { getNextBestActions } from '@/lib/nba/engine';
import NextBestActionCard from './NextBestActionCard';
import { Sparkles } from 'lucide-react';

interface NBAWidgetProps {
  /** Maximum number of actions to display (default: 3) */
  maxActions?: number;
  /** Optional custom title override */
  title?: string;
  /** Callback when action CTA is clicked */
  onActionClick?: (action: NextBestAction) => void;
  /** Show or hide the widget title */
  showTitle?: boolean;
}

/**
 * NBAWidget
 * Displays top 3 personalized Next Best Actions for the current user
 * Updates based on role and real-time profile data
 * Dark premium theme with gold accents
 */
export default function NBAWidget({
  maxActions = 3,
  title,
  onActionClick,
  showTitle = true,
}: NBAWidgetProps) {
  const { user } = useAuthContext();
  const [actions, setActions] = useState<NextBestAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get personalized actions for this user
      const userActions = getNextBestActions(user as any, maxActions);
      setActions(userActions);
    } catch (err) {
      console.error('Error fetching NBA actions:', err);
      setError('Unable to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [user, maxActions]);

  if (!user) {
    return null; // Don't render if no user
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: maxActions }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg border border-gray-700/50 bg-gray-800/30"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/20 p-8 text-center">
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-gray-600" />
        <p className="text-sm text-gray-400">
          You're all caught up! Check back soon for new opportunities.
        </p>
      </div>
    );
  }

  const displayTitle = title || getDefaultTitle((user as any).role ?? 'ambassador');

  return (
    <div className="space-y-4">
      {/* Widget Header */}
      {showTitle && (
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-fuchsia-400" />
          <h2 className="text-base font-semibold text-gray-100">{displayTitle}</h2>
        </div>
      )}

      {/* Action Cards Grid */}
      <div className="space-y-3">
        {actions.map((action, index) => (
          <NextBestActionCard
            key={action.actionId}
            action={action}
            onCTA={() => {
              if (onActionClick) {
                onActionClick(action);
              }
              handleActionNavigation(action);
            }}
          />
        ))}
      </div>

      {/* Insight Footer */}
      {actions.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-700/30 bg-gradient-to-r from-fuchsia-900/20 to-purple-900/20 p-3">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-fuchsia-300">Tip:</span> Completing high-priority actions
            unlocks rewards and moves you closer to your goals.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Gets default widget title based on user role
 */
function getDefaultTitle(role: string): string {
  const titles: Record<string, string> = {
    ambassador: 'Build Your Business',
    admin: 'Platform Updates',
  };
  return titles[role] || 'What\'s Next?';
}

/**
 * Handles navigation for action CTAs
 */
function handleActionNavigation(action: NextBestAction): void {
  const navigationMap: Record<string, string> = {
    // Ambassador
    complete_kyc: '/ambassador/profile',
    add_telegram: '/ambassador/profile',
    complete_onboarding: '/ambassador/training',
    share_code: '/ambassador/share',
    reach_active_requirement: '/ambassador/earnings',
    first_recruit: '/ambassador/team',
    tier_advancement: '/ambassador/tokens',

    // Admin
    review_orders: '/admin/orders',
    collect_payout_info: '/admin/cash-ledger',
    process_refunds: '/admin/orders',
    schedule_event: '/admin/events',
    settlement_report: '/admin/cash-ledger',
  };

  const path = navigationMap[action.actionType];
  if (path) {
    window.location.assign(path);
  }
}
