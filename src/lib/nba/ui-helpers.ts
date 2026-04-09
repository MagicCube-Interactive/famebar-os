/**
 * UI Helper Functions for NBA Component Styling
 * Maps action types to icons, colors, and visual styles
 */

import {
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  Target,
  AlertCircle,
  Trophy,
  MessageSquare,
  Briefcase,
  Rocket,
  LucideIcon,
} from 'lucide-react';

/**
 * Gets the appropriate icon for an action type
 */
export function getActionIcon(actionType: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    // Ambassador actions
    complete_kyc: CheckCircle,
    add_telegram: MessageSquare,
    complete_onboarding: Rocket,
    share_code: Users,
    reach_active_requirement: Target,
    first_recruit: Users,
    tier_advancement: Trophy,

    // Admin actions
    review_orders: Briefcase,
    collect_payout_info: DollarSign,
    process_refunds: AlertCircle,
    schedule_event: MessageSquare,
    settlement_report: TrendingUp,
  };

  return iconMap[actionType] || Target;
}

/**
 * Gets background, border, and text colors for an action card
 */
export function getActionColor(
  actionType: string,
  priority: 1 | 2 | 3 | 4 | 5
): {
  bgColor: string;
  borderColor: string;
  textColor: string;
} {
  // Priority-based border coloring
  if (priority === 1) {
    return {
      bgColor: 'bg-gradient-to-br from-red-950/30 to-red-900/20',
      borderColor: 'border-red-500/30 hover:border-red-500/50',
      textColor: 'text-red-400',
    };
  }

  if (priority === 2) {
    return {
      bgColor: 'bg-gradient-to-br from-amber-950/30 to-yellow-900/20',
      borderColor: 'border-amber-500/30 hover:border-amber-500/50',
      textColor: 'text-amber-400',
    };
  }

  // Action type based coloring for normal priority
  const typeColorMap: Record<string, ReturnType<typeof getActionColor>> = {
    // Ambassador
    complete_kyc: {
      bgColor: 'bg-gradient-to-br from-purple-950/20 to-pink-900/10',
      borderColor: 'border-purple-500/20 hover:border-purple-500/40',
      textColor: 'text-purple-300',
    },
    share_code: {
      bgColor: 'bg-gradient-to-br from-cyan-950/20 to-blue-900/10',
      borderColor: 'border-cyan-500/20 hover:border-cyan-500/40',
      textColor: 'text-cyan-300',
    },
    tier_advancement: {
      bgColor: 'bg-gradient-to-br from-yellow-950/20 to-amber-900/10',
      borderColor: 'border-yellow-500/20 hover:border-yellow-500/40',
      textColor: 'text-yellow-300',
    },

    // Admin
    review_orders: {
      bgColor: 'bg-gradient-to-br from-indigo-950/20 to-blue-900/10',
      borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
      textColor: 'text-indigo-300',
    },
  };

  return typeColorMap[actionType] || {
    bgColor: 'bg-gradient-to-br from-gray-800/30 to-gray-700/20',
    borderColor: 'border-gray-600/20 hover:border-gray-500/40',
    textColor: 'text-gray-300',
  };
}

/**
 * Gets reward badge styling
 */
export function getRewardBadgeStyle(
  reward?: string
): {
  badgeBg: string;
  badgeText: string;
} {
  if (!reward) {
    return { badgeBg: '', badgeText: '' };
  }

  // If reward contains money/dollars
  if (reward.includes('$') || reward.includes('commission')) {
    return {
      badgeBg: 'bg-gradient-to-r from-emerald-900/40 to-green-900/30',
      badgeText: 'text-emerald-200',
    };
  }

  // If reward contains tokens
  if (reward.includes('FAME') || reward.includes('token')) {
    return {
      badgeBg: 'bg-gradient-to-r from-amber-900/40 to-yellow-900/30',
      badgeText: 'text-amber-200',
    };
  }

  // If reward contains unlock/access
  if (reward.includes('unlock') || reward.includes('access')) {
    return {
      badgeBg: 'bg-gradient-to-r from-purple-900/40 to-pink-900/30',
      badgeText: 'text-purple-200',
    };
  }

  // Default
  return {
    badgeBg: 'bg-gradient-to-r from-blue-900/40 to-cyan-900/30',
    badgeText: 'text-blue-200',
  };
}

/**
 * Gets priority label and color
 */
export function getPriorityLabel(priority: 1 | 2 | 3 | 4 | 5): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  const priorityMap: Record<number, ReturnType<typeof getPriorityLabel>> = {
    1: { label: 'Urgent', bgColor: 'bg-red-500/20', textColor: 'text-red-300' },
    2: { label: 'High', bgColor: 'bg-amber-500/20', textColor: 'text-amber-300' },
    3: { label: 'Medium', bgColor: 'bg-blue-500/20', textColor: 'text-blue-300' },
    4: { label: 'Low', bgColor: 'bg-gray-600/20', textColor: 'text-gray-300' },
    5: { label: 'Optional', bgColor: 'bg-gray-600/10', textColor: 'text-gray-400' },
  };

  return priorityMap[priority] || priorityMap[3];
}

