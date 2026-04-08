/**
 * Quick Start Examples: Referral & NBA System
 * Copy-paste ready code for common use cases
 */

import React from 'react';
import { User, AmbassadorProfile, BuyerProfile } from '@/types';
import { getNextBestActions } from '@/lib/nba/engine';
import { generateReferralCode, validateCodeUsage, recordCodeUsage } from '@/lib/referral/engine';
import { addToTree, getTeamStats, getUpline } from '@/lib/referral/tree';
import NBAWidget from '@/components/shared/NBAWidget';
import EarningsCard from '@/components/shared/EarningsCard';
import NextBestActionCard from '@/components/shared/NextBestActionCard';
import ProgressRing from '@/components/shared/ProgressRing';

// ============================================================================
// EXAMPLE 1: New Ambassador Signup Flow
// ============================================================================

export async function ExampleAmbassadorSignup(ambassadorId: string, sponsorId?: string) {
  console.log('=== Example 1: Ambassador Signup ===');

  // Step 1: Generate primary referral code
  const primaryCode = generateReferralCode(ambassadorId, 'primary');
  console.log(`✅ Generated primary code: ${primaryCode.code}`);
  console.log(`   Type: ${primaryCode.type}`);
  console.log(`   Expires: ${primaryCode.expiresAt || 'Never'}`);

  // Step 2: Add to team tree (if recruited by someone)
  if (sponsorId) {
    const treeNode = addToTree(ambassadorId, sponsorId);
    console.log(`✅ Added to tree under sponsor: ${sponsorId}`);
    console.log(`   Path: ${treeNode.path.join(' <- ')}`);
    console.log(`   Level: ${treeNode.level}`);
  }

  // Step 3: Get NBA actions for new ambassador
  const user: AmbassadorProfile = {
    userId: ambassadorId,
    email: 'amb@example.com',
    role: 'ambassador',
    firstName: 'John',
    lastName: 'Doe',
    isVerified: false,
    kycVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referralCode: primaryCode.code,
    tier: 0,
    isFounder: false,
    activeStatus: false,
    personalSalesThisMonth: 0,
    totalSales: 0,
    totalRecruits: 0,
    campaignTags: [],
    eventTags: [],
    preferredMessageCategories: [],
  };

  const actions = getNextBestActions(user);
  console.log(`✅ Generated ${actions.length} NBA actions:`);
  actions.forEach((action, i) => {
    console.log(`   ${i + 1}. [P${action.priority}] ${action.title}`);
  });
}

// ============================================================================
// EXAMPLE 2: Buyer Purchase with Referral Code
// ============================================================================

export async function ExampleBuyerCheckout(
  buyerId: string,
  buyerSessionId: string,
  referralCode: string,
  ipAddress: string,
  paymentMethod: string
) {
  console.log('=== Example 2: Buyer Checkout ===');

  // Step 1: Resolve code and get ambassador
  const resolved = require('@/lib/referral/engine').resolveReferralCode(referralCode);

  if (!resolved.isValid) {
    console.log(`❌ Invalid code: ${resolved.isExpired ? 'Expired' : 'Not found'}`);
    return;
  }

  console.log(`✅ Code resolved to ambassador: ${resolved.ambassadorId}`);

  // Step 2: Validate for fraud
  const validation = validateCodeUsage(referralCode, buyerId, resolved.ambassadorId, ipAddress, paymentMethod);

  if (!validation.valid) {
    console.log(`❌ Validation failed: ${validation.reason}`);
    return;
  }

  console.log('✅ Code validation passed - no fraud detected');

  // Step 3: Lock session (prevent code changes mid-checkout)
  const { lockReferralSession } = require('@/lib/referral/engine');
  lockReferralSession(buyerSessionId, referralCode);
  console.log('✅ Session locked with code');

  // Step 4: Process payment (would happen in payment processor)
  const orderTotal = 75.50;
  console.log(`✅ Payment processed: $${orderTotal.toFixed(2)}`);

  // Step 5: Record code usage after successful payment
  recordCodeUsage(referralCode);
  console.log('✅ Code usage recorded');

  // Step 6: Get NBA actions for this buyer
  const buyer: BuyerProfile = {
    userId: buyerId,
    email: 'buyer@example.com',
    role: 'buyer',
    firstName: 'Jane',
    lastName: 'Smith',
    isVerified: true,
    kycVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referredBy: resolved.ambassadorId,
    fameBalance: 750,
    holdToSaveTier: 0,
    totalOrders: 1,
    ageVerified: true,
    totalSpending: orderTotal,
  };

  const actions = getNextBestActions(buyer);
  console.log(`✅ Generated ${actions.length} NBA actions for buyer:`);
  actions.forEach((action, i) => {
    console.log(`   ${i + 1}. ${action.title}`);
  });
}

// ============================================================================
// EXAMPLE 3: Ambassador Dashboard - Team View
// ============================================================================

export function ExampleAmbassadorDashboard(ambassadorId: string) {
  console.log('=== Example 3: Ambassador Dashboard ===');

  // Get team statistics
  const stats = getTeamStats(ambassadorId);
  console.log('📊 Team Statistics:');
  console.log(`   Total team size: ${stats.totalTeamSize}`);
  console.log(`   Active members: ${stats.activeCount}`);
  console.log(`   Stalled members: ${stats.stalledCount}`);
  console.log(`   New this month: ${stats.newThisMonth}`);
  console.log(`   Team sales this month: $${stats.totalTeamSalesThisMonth.toFixed(2)}`);
  console.log(`   Sales by level:`, stats.salesByLevel);
  console.log(`   Team by level:`, stats.teamByLevel);

  // Get upline (sponsor chain)
  const upline = getUpline(ambassadorId);
  if (upline.length > 0) {
    console.log('👥 Your Upline:');
    upline.forEach((node, i) => {
      console.log(`   ${i + 1}. ${node.ambassadorId} (Level ${node.level})`);
    });
  }

  // Return data for dashboard render
  return { stats, upline };
}

// ============================================================================
// EXAMPLE 4: React Component - Full Dashboard
// ============================================================================

interface DashboardExampleProps {
  user: User;
}

export function DashboardExample({ user }: DashboardExampleProps) {
  return (
    <div className="space-y-6 p-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">
          {user.role === 'buyer' ? 'Your Account' : `${user.firstName}'s Dashboard`}
        </h1>
        <p className="text-gray-400 mt-1">Role: {user.role}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Earnings (wide) */}
        <div className="lg:col-span-2">
          <EarningsCard
            availableCash={1250.50}
            pendingCash={340.75}
            availableTokens={45000}
            pendingTokens={12500}
            holdToSaveTier={10}
            fameBalance={45000}
            isAmbassador={user.role === 'ambassador'}
            onWithdraw={() => console.log('Withdraw clicked')}
            onViewDetails={() => console.log('View details clicked')}
          />
        </div>

        {/* Right column: Progress Ring */}
        {user.role === 'ambassador' && (
          <div className="flex items-center justify-center">
            <ProgressRing
              progress={65}
              size={140}
              color="emerald"
              label="Active Req"
              sublabel="$300/month"
              showPercentage={true}
              animated={true}
            />
          </div>
        )}
      </div>

      {/* NBA Widget - Full Width */}
      <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/30">
        <NBAWidget
          maxActions={3}
          onActionClick={(action) => {
            console.log(`Action clicked: ${action.actionType}`);
            // Handle navigation based on action type
          }}
          showTitle={true}
        />
      </div>

      {/* Team Stats (Ambassador only) */}
      {user.role === 'ambassador' && (
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/30">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Team Overview</h2>
          <TeamStatsDisplay ambassadorId={user.userId} />
        </div>
      )}
    </div>
  );
}

function TeamStatsDisplay({ ambassadorId }: { ambassadorId: string }) {
  const stats = getTeamStats(ambassadorId);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Team Size" value={stats.totalTeamSize} />
      <StatCard label="Active" value={stats.activeCount} />
      <StatCard label="Stalled" value={stats.stalledCount} />
      <StatCard label="New This Month" value={stats.newThisMonth} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-700/30 border border-gray-600 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Campaign Code Generation
// ============================================================================

export function ExampleCampaignCode(ambassadorId: string) {
  console.log('=== Example 5: Campaign Code ===');

  const campaignName = 'BlackFriday2024';
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { createCampaignCode } = require('@/lib/referral/engine');
  const code = createCampaignCode(ambassadorId, campaignName, expiresAt);

  console.log(`✅ Campaign code created: ${code.code}`);
  console.log(`   Campaign: ${code.campaignName}`);
  console.log(`   Expires: ${code.expiresAt}`);
  console.log(`   Days remaining: ${Math.ceil((new Date(code.expiresAt!).getTime() - Date.now()) / (24 * 60 * 60 * 1000))}`);

  return code;
}

// ============================================================================
// EXAMPLE 6: Custom Action Display
// ============================================================================

interface ActionCardExampleProps {
  ambassadorId: string;
}

export function ActionCardExample({ ambassadorId }: ActionCardExampleProps) {
  const [actions, setActions] = React.useState<any[]>([]);
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null);

  React.useEffect(() => {
    // In real app, fetch actual user data
    const mockUser: AmbassadorProfile = {
      userId: ambassadorId,
      email: 'test@example.com',
      role: 'ambassador',
      firstName: 'Test',
      lastName: 'User',
      isVerified: false,
      kycVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      referralCode: 'TESTCODE',
      tier: 1,
      isFounder: false,
      activeStatus: false,
      personalSalesThisMonth: 150,
      totalSales: 500,
      totalRecruits: 2,
      campaignTags: [],
      eventTags: [],
      preferredMessageCategories: [],
    };

    const nbaActions = getNextBestActions(mockUser, 5);
    setActions(nbaActions);
  }, [ambassadorId]);

  return (
    <div className="space-y-4 p-6 bg-gray-900 rounded-lg max-w-2xl">
      <h2 className="text-xl font-bold text-gray-100">Next Best Actions</h2>

      <div className="space-y-3">
        {actions.map((action) => (
          <NextBestActionCard
            key={action.actionId}
            action={action}
            onCTA={(actionId) => {
              setSelectedAction(actionId);
              console.log(`Action CTA clicked: ${actionId}`);
              // Handle navigation
            }}
            isLoading={selectedAction === action.actionId}
          />
        ))}
      </div>

      {actions.length === 0 && (
        <p className="text-center text-gray-400">No actions available</p>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Using ProgressRing for Metrics
// ============================================================================

interface ProgressRingExampleProps {
  ambassadorId: string;
}

export function ProgressRingExample({ ambassadorId }: ProgressRingExampleProps) {
  const stats = getTeamStats(ambassadorId);

  // Calculate active requirement progress (assuming $300 target)
  const ACTIVE_TARGET = 300;
  const activeProgress = (stats.totalTeamSalesThisMonth / ACTIVE_TARGET) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-gray-900 rounded-lg">
      {/* Active Requirement Progress */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Monthly Active Requirement</h3>
        <ProgressRing
          progress={Math.min(100, activeProgress)}
          size={140}
          color="emerald"
          label={`$${stats.totalTeamSalesThisMonth.toFixed(0)}`}
          sublabel={`of $${ACTIVE_TARGET} target`}
          showPercentage={true}
        />
      </div>

      {/* Team Health Progress */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Team Health</h3>
        <ProgressRing
          progress={(stats.activeCount / stats.totalTeamSize) * 100}
          size={140}
          color="blue"
          label={`${stats.activeCount}`}
          sublabel={`of ${stats.totalTeamSize} active`}
          showPercentage={true}
        />
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: API Integration Pattern
// ============================================================================

/**
 * How to integrate with your Next.js API routes
 */

// pages/api/referral/generate-code.ts
export async function apiGenerateCode(ambassadorId: string, type: 'primary' | 'campaign') {
  try {
    const code = generateReferralCode(ambassadorId, type);
    // TODO: Save to Firestore
    return { success: true, code: code.code };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// pages/api/referral/validate.ts
export async function apiValidateCode(
  code: string,
  buyerId: string,
  ambassadorId: string,
  ipAddress: string
) {
  try {
    const validation = validateCodeUsage(code, buyerId, ambassadorId, ipAddress);

    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// pages/api/nba/actions.ts
export async function apiGetNBAActions(userId: string) {
  try {
    // TODO: Fetch user from DB
    const user: User = {}; // Mock user

    const actions = getNextBestActions(user, 5);
    return { success: true, actions };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// pages/api/team/stats.ts
export async function apiGetTeamStats(ambassadorId: string) {
  try {
    const stats = getTeamStats(ambassadorId);
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
