'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import EarningsCard from '@/components/shared/EarningsCard';
import ProgressRing from '@/components/shared/ProgressRing';
import NBAWidget from '@/components/shared/NBAWidget';
import ShareCard from '@/components/ambassador/ShareCard';
import LevelBreakdown from '@/components/ambassador/LevelBreakdown';
import MissionChecklist from '@/components/ambassador/MissionChecklist';
import MonthlyForecast from '@/components/ambassador/MonthlyForecast';
import {
  Zap,
  TrendingUp,
  Users,
  Gift,
  Target,
  Calendar,
} from 'lucide-react';
import { PLATFORM_CONFIG } from '@/types';

interface AmbassadorData {
  referral_code: string;
  is_founder: boolean;
  founder_start_date: string | null;
  personal_sales_this_month: number;
  total_recruits: number;
  kyc_verified: boolean;
  tier: number;
  rank: string;
}

interface DashboardStats {
  availableCash: number;
  pendingCash: number;
  availableTokens: number;
  pendingTokens: number;
  directOrdersToday: number;
  newCustomersThisWeek: number;
  newRecruitsThisWeek: number;
}

export default function AmbassadorPage() {
  const { user, role } = useAuthContext();
  const [ambassadorData, setAmbassadorData] = useState<AmbassadorData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    availableCash: 0,
    pendingCash: 0,
    availableTokens: 0,
    pendingTokens: 0,
    directOrdersToday: 0,
    newCustomersThisWeek: 0,
    newRecruitsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== 'ambassador') return;

    const fetchData = async () => {
      const supabase = createClient();
      const userId = user.id;

      // Fetch all data in parallel
      const [
        ambassadorResult,
        availCommResult,
        pendingCommResult,
        availTokenResult,
        pendingTokenResult,
        todayOrdersResult,
        weekCustomersResult,
        weekRecruitsResult,
      ] = await Promise.all([
        // Ambassador profile
        supabase
          .from('ambassador_profiles')
          .select('referral_code, is_founder, founder_start_date, personal_sales_this_month, total_recruits, kyc_verified, tier, rank')
          .eq('id', userId)
          .single(),

        // Available commissions total
        supabase
          .from('commission_events')
          .select('amount')
          .eq('ambassador_id', userId)
          .eq('status', 'available'),

        // Pending commissions total
        supabase
          .from('commission_events')
          .select('amount')
          .eq('ambassador_id', userId)
          .eq('status', 'pending'),

        // Available tokens total
        supabase
          .from('token_events')
          .select('final_tokens')
          .eq('ambassador_id', userId)
          .eq('status', 'available'),

        // Pending tokens total
        supabase
          .from('token_events')
          .select('final_tokens')
          .eq('ambassador_id', userId)
          .eq('status', 'pending'),

        // Direct orders today
        supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('ambassador_id', userId)
          .gte('created_at', new Date().toISOString().split('T')[0]),

        // New unique customers this week
        supabase
          .from('orders')
          .select('buyer_id')
          .eq('ambassador_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

        // New recruits this week
        supabase
          .from('ambassador_profiles')
          .select('id', { count: 'exact' })
          .eq('sponsor_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      if (ambassadorResult.data) {
        setAmbassadorData(ambassadorResult.data);
      }

      const availCash = (availCommResult.data || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
      const pendCash = (pendingCommResult.data || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
      const availTokens = (availTokenResult.data || []).reduce((sum: number, r: any) => sum + Number(r.final_tokens), 0);
      const pendTokens = (pendingTokenResult.data || []).reduce((sum: number, r: any) => sum + Number(r.final_tokens), 0);

      // Deduplicate buyers for new customers count
      const uniqueBuyers = new Set((weekCustomersResult.data || []).map((r: any) => r.buyer_id));

      setStats({
        availableCash: availCash,
        pendingCash: pendCash,
        availableTokens: availTokens,
        pendingTokens: pendTokens,
        directOrdersToday: todayOrdersResult.count || 0,
        newCustomersThisWeek: uniqueBuyers.size,
        newRecruitsThisWeek: weekRecruitsResult.count || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, [user, role]);

  if (!user || role !== 'ambassador') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const ambassador = ambassadorData;
  const referralCode = ambassador?.referral_code || '';
  const isFounder = ambassador?.is_founder || false;
  const personalSales = ambassador?.personal_sales_this_month || 0;
  const totalRecruits = ambassador?.total_recruits || 0;
  const kycVerified = ambassador?.kyc_verified || false;

  const activeRequirementPercent = Math.min(100, (personalSales / PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT) * 100);
  const isActive = personalSales >= PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT;

  // Founder boost expiry
  let founderBoostEnds: string | null = null;
  if (isFounder && ambassador?.founder_start_date) {
    const endDate = new Date(ambassador.founder_start_date);
    endDate.setMonth(endDate.getMonth() + PLATFORM_CONFIG.FOUNDER_BOOST_DURATION_MONTHS);
    founderBoostEnds = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // Days elapsed in current month
  const now = new Date();
  const daysElapsed = now.getDate();

  // Current month earnings (available + pending)
  const currentMonthEarnings = stats.availableCash + stats.pendingCash;

  // Mission checklist based on real data
  const missions = [
    {
      id: 'kyc-verification',
      title: 'Pass KYC Verification',
      description: 'Verify your identity to unlock higher tier commissions',
      completed: kycVerified,
      order: 1,
    },
    {
      id: 'first-code',
      title: 'Generate Referral Code',
      description: 'Create your first referral code to start sharing',
      completed: !!referralCode,
      order: 2,
    },
    {
      id: 'first-order',
      title: 'Get First Order',
      description: 'Drive your first sale through your referral code',
      completed: stats.directOrdersToday > 0 || currentMonthEarnings > 0,
      order: 3,
    },
    {
      id: 'first-recruit',
      title: 'Invite First Ambassador',
      description: 'Recruit your first ambassador to your team',
      completed: totalRecruits > 0,
      order: 4,
    },
    {
      id: 'go-active',
      title: 'Hit Active Status',
      description: `Reach $${PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT} personal sales in a month to unlock Tiers 4-6`,
      completed: isActive,
      order: 5,
    },
  ];

  const salesAwayFromActive = Math.max(0, PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT - personalSales);
  const nextMilestoneLabel = isActive ? 'Monthly Active Status' : 'L4-L6 Commission Unlock';

  return (
    <div className="space-y-6">
      {/* Hero Card - Motivational CTA */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-yellow-950/20 p-8">
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl" />

        <div className="relative z-10">
          {isActive ? (
            <>
              <div className="mb-4 inline-block rounded-full bg-emerald-500/20 px-4 py-2">
                <p className="text-xs font-semibold text-emerald-300">ACTIVE THIS MONTH</p>
              </div>
              <h2 className="mb-3 text-3xl font-bold text-gray-100">
                You're <span className="text-emerald-300">Active</span> — all 7 tiers unlocked!
              </h2>
              <p className="mb-6 max-w-2xl text-gray-300">
                You've hit ${PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT} in personal sales. Tiers 4-6 are earning for you. Keep pushing!
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 inline-block rounded-full bg-amber-500/20 px-4 py-2">
                <p className="text-xs font-semibold text-amber-300">ALMOST THERE</p>
              </div>
              <h2 className="mb-3 text-3xl font-bold text-gray-100">
                You're{' '}
                <span className="text-amber-300">${salesAwayFromActive.toFixed(2)} away</span> from{' '}
                <span className="text-emerald-400">{nextMilestoneLabel}</span>
              </h2>
              <p className="mb-6 max-w-2xl text-gray-300">
                Hit ${PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT} in personal sales to unlock Tiers 4-6 commissions across your entire network.
              </p>
            </>
          )}

          <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 font-semibold text-gray-900 transition-all duration-200 hover:from-amber-600 hover:to-yellow-500 shadow-lg">
            <Zap className="h-5 w-5" />
            {isActive ? 'View Earnings' : 'Push for the Milestone'}
          </button>
        </div>
      </div>

      {/* Top Row: Earnings & Active Requirement */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EarningsCard
            availableCash={stats.availableCash}
            pendingCash={stats.pendingCash}
            availableTokens={stats.availableTokens}
            pendingTokens={stats.pendingTokens}
            holdToSaveTier={20}
            fameBalance={stats.availableTokens}
            isAmbassador={true}
            onWithdraw={() => console.log('Withdraw clicked')}
            onViewDetails={() => console.log('View details clicked')}
          />
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6 flex flex-col items-center justify-center">
          <p className="mb-4 text-xs font-medium text-gray-500 text-center">
            Monthly Active Requirement
          </p>
          <ProgressRing
            progress={activeRequirementPercent}
            size={140}
            color="emerald"
            label={isActive ? 'Active!' : 'Active'}
            sublabel="This Month"
            showPercentage={true}
          />
          <p className="mt-4 text-center text-xs text-gray-400">
            <span className="font-semibold text-emerald-400">
              ${personalSales.toFixed(2)}
            </span>
            {' '}of{' '}
            <span className="font-semibold">
              ${PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT.toFixed(2)}
            </span>
          </p>
          <p className="mt-2 text-xs text-gray-500 text-center">
            {isActive
              ? 'Tiers 4-6 unlocked!'
              : `$${(PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT - personalSales).toFixed(2)} to unlock L4-L6 commissions!`}
          </p>
        </div>
      </div>

      {/* Second Row: Share Card & Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ShareCard
          value={referralCode}
          type="code"
          label="Your Referral Code"
          usageCount={0}
          description="Share this code to earn commissions"
          onCopy={(code) => navigator.clipboard.writeText(code)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Direct Orders Today
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {stats.directOrdersToday}
            </p>
            <p className="mt-2 text-xs text-gray-500">orders placed</p>
          </div>

          <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500">
              <Users className="h-4 w-4 text-amber-400" />
              Total Recruits
            </p>
            <p className="text-2xl font-bold text-amber-400">
              {totalRecruits}
            </p>
            <p className="mt-2 text-xs text-gray-500">in your network</p>
          </div>

          <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500">
              <Gift className="h-4 w-4 text-yellow-400" />
              New Customers
            </p>
            <p className="text-2xl font-bold text-yellow-400">
              +{stats.newCustomersThisWeek}
            </p>
            <p className="mt-2 text-xs text-gray-500">this week</p>
          </div>

          <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500">
              <Target className="h-4 w-4 text-purple-400" />
              New Recruits
            </p>
            <p className="text-2xl font-bold text-purple-400">
              +{stats.newRecruitsThisWeek}
            </p>
            <p className="mt-2 text-xs text-gray-500">this week</p>
          </div>
        </div>
      </div>

      {/* NBA Widget */}
      <div>
        <NBAWidget maxActions={3} showTitle={true} />
      </div>

      {/* Forecast */}
      <MonthlyForecast
        currentMonthEarnings={currentMonthEarnings}
        daysElapsed={daysElapsed}
        daysInMonth={new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}
      />

      {/* Mission Checklist */}
      <MissionChecklist
        missions={missions}
        onAllComplete={() => console.log('All missions completed!')}
      />

      {/* Founder Badge */}
      {isFounder && (
        <div className="relative overflow-hidden rounded-lg border border-amber-500/50 bg-gradient-to-br from-amber-950/50 to-yellow-950/30 p-6">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent blur-3xl" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="text-3xl">👑</div>
            <div>
              <h3 className="font-bold text-amber-300">Founder Status Active</h3>
              <p className="mt-1 text-sm text-gray-300">
                You're earning <span className="font-semibold text-amber-300">{PLATFORM_CONFIG.FOUNDER_BOOST_MULTIPLIER}x tokens</span> on all
                direct sales! This is an exclusive benefit for our founding ambassadors.
              </p>
              {founderBoostEnds && (
                <p className="mt-3 text-xs text-amber-200/70">
                  Founder boost ends: <span className="font-semibold">{founderBoostEnds}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
