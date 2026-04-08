/**
 * Next Best Action Engine for FameBar OS
 * Generates prioritized, contextual recommendations that drive engagement and revenue
 * Every screen answers: What have I earned? What should I do next? What unlocks if I do it?
 */

import {
  NextBestAction,
  UserRole,
  AmbassadorProfile,
  BuyerProfile,
  User,
  HOLD_TO_SAVE_TIERS,
  PLATFORM_CONFIG,
} from '@/types';
import { getTeamStats, getInactiveAmbassadors, getNode } from '@/lib/referral/tree';
import crypto from 'crypto';

/**
 * Main entry point: Get prioritized NBA recommendations for any user
 * Returns sorted by priority, contextualized to role and profile data
 */
export function getNextBestActions(user: User, maxActions: number = 5): NextBestAction[] {
  const actions: NextBestAction[] = [];

  switch (user.role) {
    case 'buyer':
      actions.push(...generateBuyerActions(user as BuyerProfile));
      break;
    case 'ambassador':
      actions.push(...generateAmbassadorActions(user as AmbassadorProfile));
      break;
    case 'leader':
      actions.push(...generateLeaderActions(user as AmbassadorProfile));
      break;
    case 'admin':
      actions.push(...generateAdminActions(user));
      break;
  }

  // Sort by priority (1 = highest), then by recency
  return actions
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxActions)
    .map((action, index) => ({
      ...action,
      actionId: `${user.userId}-${Date.now()}-${index}`,
    }));
}

// ============================================================================
// BUYER ACTIONS
// ============================================================================

function generateBuyerActions(buyer: BuyerProfile): NextBestAction[] {
  const actions: NextBestAction[] = [];
  const now = new Date();

  // 1. Hold-to-Save Tier Progress
  const nextTierThreshold = getNextHoldToSaveTier(buyer.fameBalance);
  if (nextTierThreshold) {
    const tokensNeeded = nextTierThreshold - buyer.fameBalance;
    actions.push({
      actionId: '', // Set by parent
      userId: buyer.userId,
      role: 'buyer',
      actionType: 'hold_to_save_progress',
      title: `${tokensNeeded.toLocaleString()} $FAME away from ${getHoldToSaveDiscount(nextTierThreshold)}% discount`,
      description: `Hold ${nextTierThreshold.toLocaleString()} $FAME tokens to unlock ${getHoldToSaveDiscount(nextTierThreshold)}% off all future orders. Save your next purchase as a token holder!`,
      progressCurrent: buyer.fameBalance,
      progressTarget: nextTierThreshold,
      progressUnit: 'tokens',
      reward: `${getHoldToSaveDiscount(nextTierThreshold)}% personal order discount`,
      priority: 2,
      createdAt: now.toISOString(),
    });
  }

  // 2. Reorder Window Open
  // In production, check last order date from order history
  const daysSinceLastOrder = 30; // Placeholder
  if (daysSinceLastOrder > 14) {
    actions.push({
      actionId: '',
      userId: buyer.userId,
      role: 'buyer',
      actionType: 'reorder_ready',
      title: 'Your reorder window is open',
      description: `It's been ${daysSinceLastOrder} days since your last order. Reorder now to earn more $FAME and unlock discounts.`,
      progressCurrent: daysSinceLastOrder,
      progressTarget: 30,
      progressUnit: 'days',
      reward: '$FAME tokens (10 per $1 spent)',
      priority: 2,
      createdAt: now.toISOString(),
    });
  }

  // 3. Share & Earn (if satisfaction signals are high)
  if (buyer.totalOrders >= 2) {
    actions.push({
      actionId: '',
      userId: buyer.userId,
      role: 'buyer',
      actionType: 'refer_friend',
      title: 'Share your code & earn rewards',
      description: `Introduce friends to FameBar products and earn $FAME when they order using your referral link.`,
      progressCurrent: 0,
      progressTarget: 1,
      progressUnit: 'referrals',
      reward: 'Earning potential: $5-20 per referral',
      priority: 3,
      createdAt: now.toISOString(),
    });
  }

  // 4. Age Verification Reminder (if not verified)
  if (!buyer.ageVerified) {
    actions.push({
      actionId: '',
      userId: buyer.userId,
      role: 'buyer',
      actionType: 'complete_age_verification',
      title: 'Verify age to unlock full benefits',
      description: 'Complete quick age verification to access exclusive discounts and premium features.',
      progressCurrent: 0,
      progressTarget: 1,
      progressUnit: 'verification',
      reward: 'Access to all features + exclusive offers',
      priority: 4,
      createdAt: now.toISOString(),
    });
  }

  return actions;
}

// ============================================================================
// NEW AMBASSADOR ACTIONS (Tier 0-2, not yet profitable)
// ============================================================================

function generateAmbassadorActions(ambassador: AmbassadorProfile): NextBestAction[] {
  const actions: NextBestAction[] = [];
  const now = new Date();
  const teamStats = getTeamStats(ambassador.userId);

  // 1. KYC Verification (Gate to code activation)
  if (!ambassador.kycVerified) {
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'ambassador',
      actionType: 'complete_kyc',
      title: 'Complete KYC to activate your code',
      description: 'Verify your identity to unlock your primary referral code and start earning commissions.',
      progressCurrent: 0,
      progressTarget: 1,
      progressUnit: 'verification',
      reward: 'Unlock primary referral code + commission earnings',
      priority: 1, // HIGHEST for new ambassadors
      createdAt: now.toISOString(),
    });
    return actions; // Stop here until KYC is done
  }

  // 2. Telegram Handle (for communications)
  if (!ambassador.telegramHandle) {
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'ambassador',
      actionType: 'add_telegram',
      title: 'Upload your Telegram handle',
      description: 'Connect Telegram to receive exclusive team updates, event announcements, and commission alerts.',
      progressCurrent: 0,
      progressTarget: 1,
      progressUnit: 'connection',
      reward: 'Real-time notifications + exclusive Telegram promotions',
      priority: 1,
      createdAt: now.toISOString(),
    });
  }

  // 3. First Share / Onboarding Checklist
  const onboardingChecklist = getOnboardingProgress(ambassador.userId);
  if (onboardingChecklist.completed < onboardingChecklist.total) {
    const pendingItems = getPendingOnboardingItems(ambassador.userId);
    const nextItem = pendingItems[0];

    if (nextItem) {
      actions.push({
        actionId: '',
        userId: ambassador.userId,
        role: 'ambassador',
        actionType: 'complete_onboarding',
        title: `Complete onboarding: ${nextItem.title}`,
        description: nextItem.description,
        progressCurrent: onboardingChecklist.completed,
        progressTarget: onboardingChecklist.total,
        progressUnit: 'steps',
        reward: `${onboardingChecklist.total - onboardingChecklist.completed} more steps to full activation`,
        priority: 1,
        createdAt: now.toISOString(),
      });
    }
  }

  // 4. Share with Contacts (early engagement)
  if (ambassador.totalRecruits === 0) {
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'ambassador',
      actionType: 'share_code',
      title: 'Share with 5 contacts to get started',
      description: 'Your referral code is ready. Share it with 5 friends or colleagues to begin building your team.',
      progressCurrent: 0,
      progressTarget: 5,
      progressUnit: 'contacts',
      reward: 'First recruit unlocks team overview + team stats',
      priority: 2,
      createdAt: now.toISOString(),
    });
  }

  // 5. Active Requirement Progress (if tier requires it)
  if (ambassador.tier >= 4 && !ambassador.activeStatus) {
    const needed = PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT - ambassador.personalSalesThisMonth;
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'ambassador',
      actionType: 'reach_active_requirement',
      title: `$${needed.toFixed(2)} more to stay active this month`,
      description: `Your tier (${ambassador.tier}) requires $${PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT}/month in personal sales to maintain commission eligibility.`,
      progressCurrent: ambassador.personalSalesThisMonth,
      progressTarget: PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT,
      progressUnit: '$',
      reward: `Keep tier ${ambassador.tier} status + commission tier unlock`,
      priority: 1, // HIGH if at risk
      createdAt: now.toISOString(),
    });
  }

  // 6. First Direct Recruit (milestone)
  if (ambassador.totalRecruits === 0 && onboardingChecklist.completed >= onboardingChecklist.total) {
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'ambassador',
      actionType: 'first_recruit',
      title: 'Get your first recruit',
      description: 'You\'re all set! Now recruit one person to unlock team hierarchy view and begin building passive income.',
      progressCurrent: 0,
      progressTarget: 1,
      progressUnit: 'recruit',
      reward: 'Unlock team view + $25 commission on first sale',
      priority: 2,
      createdAt: now.toISOString(),
    });
  }

  // 7. Tier Advancement Readiness
  if (ambassador.tier < 6 && ambassador.totalRecruits >= [0, 3, 10, 30, 100, 300, 1000][ambassador.tier]) {
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'ambassador',
      actionType: 'tier_advancement',
      title: `You qualify for Tier ${ambassador.tier + 1}!`,
      description: `Your team meets the recruitment threshold. Advance to Tier ${ambassador.tier + 1} to unlock deeper commission earnings.`,
      progressCurrent: ambassador.totalRecruits,
      progressTarget: [0, 3, 10, 30, 100, 300, 1000][ambassador.tier + 1] || 1000,
      progressUnit: 'recruits',
      reward: `${ambassador.tier + 1} tiers of commission depth + higher rates`,
      priority: 2,
      createdAt: now.toISOString(),
    });
  }

  return actions.slice(0, 5); // Return top 5
}

// ============================================================================
// LEADER ACTIONS (Tier 4+, team builders)
// ============================================================================

function generateLeaderActions(ambassador: AmbassadorProfile): NextBestAction[] {
  const actions: NextBestAction[] = [];
  const now = new Date();
  const teamStats = getTeamStats(ambassador.userId);

  // 1. Inactive Team Members Alert
  const inactiveMembers = getInactiveAmbassadors(7);
  const directedInactive = inactiveMembers.filter(member => {
    const path = member.path || [];
    return path.includes(ambassador.userId);
  });

  if (directedInactive.length > 0) {
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'leader',
      actionType: 'reactivate_team',
      title: `${directedInactive.length} team members inactive for 7+ days`,
      description: `Reach out to inactive members to help them get back on track. Active teams earn higher commissions.`,
      progressCurrent: teamStats.activeCount,
      progressTarget: teamStats.totalTeamSize,
      progressUnit: 'active members',
      reward: `Reactivate ${directedInactive.length} → +$${(directedInactive.length * 50).toFixed(2)}/month commission potential`,
      priority: 1,
      createdAt: now.toISOString(),
    });
  }

  // 2. Team Members Pending Approval
  // In production, query pending ambassador approvals
  const pendingApprovals = 0;
  if (pendingApprovals > 0) {
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'leader',
      actionType: 'approve_recruits',
      title: `${pendingApprovals} recruit${pendingApprovals > 1 ? 's' : ''} awaiting approval`,
      description: `Review and approve pending new recruits to activate their codes and commissions.`,
      progressCurrent: 0,
      progressTarget: pendingApprovals,
      progressUnit: 'approvals',
      reward: `Activate commissions + build team momentum`,
      priority: 1,
      createdAt: now.toISOString(),
    });
  }

  // 3. Monthly Milestone Tracking
  const monthlyTarget = 5000; // Example: $5k/month goal
  const monthlyProgress = teamStats.totalTeamSalesThisMonth;
  const remainingToMilestone = Math.max(0, monthlyTarget - monthlyProgress);

  if (remainingToMilestone > 0) {
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'leader',
      actionType: 'monthly_milestone',
      title: `$${remainingToMilestone.toFixed(2)} away from monthly milestone`,
      description: `Your team is at $${monthlyProgress.toFixed(2)}. Hit $${monthlyTarget.toFixed(2)} this month to unlock bonus commission.`,
      progressCurrent: monthlyProgress,
      progressTarget: monthlyTarget,
      progressUnit: '$',
      reward: `$${(remainingToMilestone * 0.15).toFixed(2)} bonus + milestone badge`,
      priority: 2,
      createdAt: now.toISOString(),
    });
  }

  // 4. Team Members Close to Rank Milestone
  const downlinePromoReadiness = getTeamMembersCloseToPomotion(ambassador.userId);
  if (downlinePromoReadiness.length > 0) {
    const summary = downlinePromoReadiness[0];
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'leader',
      actionType: 'mentor_for_rank',
      title: `${downlinePromoReadiness.length} team members close to ranking up`,
      description: `${summary.ambassadorName} needs ${summary.recruitsNeeded} more recruits for Tier ${summary.nextTier}. Help them cross the finish line!`,
      progressCurrent: 0,
      progressTarget: downlinePromoReadiness.length,
      progressUnit: 'members',
      reward: `When they rank up: +deeper commission tiers for you`,
      priority: 2,
      createdAt: now.toISOString(),
    });
  }

  // 5. Unclaimed Commission from Tiers 4-6
  // This is a powerful motivator: show missed money
  const unclaimedFromDepthTiers = calculateUnclaimedFromDepthTiers(ambassador.userId);
  if (unclaimedFromDepthTiers > 0) {
    actions.push({
      actionId: '',
      userId: ambassador.userId,
      role: 'leader',
      actionType: 'unlock_depth_commission',
      title: `You left $${unclaimedFromDepthTiers.toFixed(2)} on the table this month`,
      description: `Your L4-L6 members would have earned you money, but they weren't active. Activate them to unlock deeper commission.`,
      progressCurrent: 0,
      progressTarget: 1,
      progressUnit: 'action',
      reward: `Activate L4-6 members → +$${unclaimedFromDepthTiers.toFixed(2)}/month recurring`,
      priority: 3,
      createdAt: now.toISOString(),
    });
  }

  // 6. Recruitment Challenge (gamification)
  const recruitsThisMonth = 0; // In production, count recruits by createdAt
  actions.push({
    actionId: '',
    userId: ambassador.userId,
    role: 'leader',
    actionType: 'recruitment_challenge',
    title: `This month's recruitment challenge: 5 new recruits`,
    description: `Recruit 5 new members this month to unlock exclusive team bonuses and event invitations.`,
    progressCurrent: recruitsThisMonth,
    progressTarget: 5,
    progressUnit: 'recruits',
    reward: `$500 bonus + VIP event access`,
    priority: 3,
    createdAt: now.toISOString(),
  });

  return actions.slice(0, 5);
}

// ============================================================================
// ADMIN ACTIONS
// ============================================================================

function generateAdminActions(user: User): NextBestAction[] {
  const actions: NextBestAction[] = [];
  const now = new Date();

  // These are placeholder counts; in production, query actual data
  const ordersNeedingReview = 2;
  const ambassadorsMissingPayout = 15;
  const refundBatchReady = 5;

  // 1. Orders Pending Manual Review
  if (ordersNeedingReview > 0) {
    actions.push({
      actionId: '',
      userId: user.userId,
      role: 'admin',
      actionType: 'review_orders',
      title: `${ordersNeedingReview} orders need manual review`,
      description: `High-value or flagged orders are waiting for compliance review.`,
      progressCurrent: 0,
      progressTarget: ordersNeedingReview,
      progressUnit: 'orders',
      reward: `Process orders → settle commissions`,
      priority: 1,
      createdAt: now.toISOString(),
    });
  }

  // 2. Ambassadors Missing Payout Info
  if (ambassadorsMissingPayout > 0) {
    actions.push({
      actionId: '',
      userId: user.userId,
      role: 'admin',
      actionType: 'collect_payout_info',
      title: `${ambassadorsMissingPayout} ambassadors missing payout information`,
      description: `Ambassadors with pending commissions need to complete their banking details for settlement.`,
      progressCurrent: 0,
      progressTarget: ambassadorsMissingPayout,
      progressUnit: 'ambassadors',
      reward: `Enable ${ambassadorsMissingPayout} payouts`,
      priority: 1,
      createdAt: now.toISOString(),
    });
  }

  // 3. Refund Reversal Batch
  if (refundBatchReady > 0) {
    actions.push({
      actionId: '',
      userId: user.userId,
      role: 'admin',
      actionType: 'process_refunds',
      title: `${refundBatchReady} refund reversals ready to process`,
      description: `Clawback commissions and tokens from cancelled orders. Run batch to settle accounts.`,
      progressCurrent: 0,
      progressTarget: refundBatchReady,
      progressUnit: 'refunds',
      reward: `Process refunds → accurate commission books`,
      priority: 2,
      createdAt: now.toISOString(),
    });
  }

  // 4. Upcoming Telegram Event
  actions.push({
    actionId: '',
    userId: user.userId,
    role: 'admin',
    actionType: 'schedule_event',
    title: 'Telegram event reminder: Send weekly digest',
    description: 'Your weekly digest broadcast is scheduled for this evening at 6 PM. Review and confirm sending.',
    progressCurrent: 0,
    progressTarget: 1,
    progressUnit: 'broadcast',
    reward: `Engage community → boost activity metrics`,
    priority: 3,
    createdAt: now.toISOString(),
  });

  // 5. Settlement Window Report
  actions.push({
    actionId: '',
    userId: user.userId,
    role: 'admin',
    actionType: 'settlement_report',
    title: 'Settlement window closes in 2 days',
    description: 'Review pending commissions and execute final settlement for this period.',
    progressCurrent: 2,
    progressTarget: 14,
    progressUnit: 'days',
    reward: `Complete settlement cycle`,
    priority: 3,
    createdAt: now.toISOString(),
  });

  return actions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getNextHoldToSaveTier(currentBalance: number): number | null {
  const tiers = [10000, 25000, 50000, 100000];
  for (const tier of tiers) {
    if (currentBalance < tier) {
      return tier;
    }
  }
  return null; // Already at max tier
}

function getHoldToSaveDiscount(tokenThreshold: number): number {
  const discounts: Record<number, number> = {
    10000: 5,
    25000: 10,
    50000: 15,
    100000: 20,
  };
  return discounts[tokenThreshold] || 0;
}

function getOnboardingProgress(ambassadorId: string): { completed: number; total: number } {
  // In production, query onboarding state from DB
  // Typical flow: profile setup, KYC, Telegram, share code, first order, first recruit
  return { completed: 2, total: 6 };
}

function getPendingOnboardingItems(ambassadorId: string): Array<{ title: string; description: string }> {
  // In production, determine which items remain
  return [
    {
      title: 'Complete Your Profile',
      description: 'Add a profile photo and bio to build credibility with recruits.',
    },
    {
      title: 'Verify KYC',
      description: 'Upload ID to unlock your referral code and start earning.',
    },
    {
      title: 'Add Telegram',
      description: 'Connect Telegram for real-time commission alerts and team updates.',
    },
  ];
}

function getTeamMembersCloseToPomotion(
  ambassadorId: string
): Array<{ ambassadorName: string; recruitsNeeded: number; nextTier: number }> {
  // In production, check team members within 2-3 recruits of next tier
  return [];
}

function calculateUnclaimedFromDepthTiers(ambassadorId: string): number {
  // In production, calculate commission that would have been earned if L4-6 were active
  // This is: sum of (L4-6 member sales × tier rate) for members who currently don't meet active requirement
  return 0;
}

/**
 * Priority scoring function (used for initial prioritization before slice)
 */
export function scoreActionByPriority(
  action: NextBestAction,
  userRole: UserRole
): number {
  let score = action.priority * 100; // Base score

  // Boost revenue-driving actions
  if (
    action.actionType.includes('recruit') ||
    action.actionType.includes('milestone') ||
    action.actionType.includes('active')
  ) {
    score -= 50; // Higher priority
  }

  // Boost verification actions for new users
  if (action.actionType.includes('verify') || action.actionType.includes('kyc')) {
    score -= 30;
  }

  // Decay old actions
  const createdAt = new Date(action.createdAt);
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
  score += daysSinceCreation * 2; // Slightly lower priority for older actions

  return score;
}
