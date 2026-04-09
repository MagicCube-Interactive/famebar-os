'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  Copy,
  Check,
  Star,
  UserPlus,
  Megaphone,
  CalendarDays,
  Zap,
  Lock,
  Activity,
  ShoppingBag,
} from 'lucide-react';
import { PLATFORM_CONFIG } from '@/types';
import RevenueWaterfall from '@/components/shared/RevenueWaterfall';
import TeamHeatmap from '@/components/shared/TeamHeatmap';

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

interface RecentOrder {
  id: string;
  created_at: string;
  units: number;
  total: number;
  payment_method: string;
  payment_status: string;
}

interface TeamMemberHeatmap {
  id: string;
  name: string;
  status: 'active' | 'stalled' | 'new' | 'at-risk';
  salesThisMonth: number;
  recruits: number;
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
  const [copied, setCopied] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberHeatmap[]>([]);
  const [revenueByLevel, setRevenueByLevel] = useState<Record<number, number>>({});

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

      // Fetch tier-gated leader data for tier 4+ ambassadors
      const ambTier = ambassadorResult.data?.tier ?? 0;
      const ambRefCode = ambassadorResult.data?.referral_code ?? '';

      if (ambTier >= 4) {
        const [ordersResult, teamResult, revenueLevelsResult] = await Promise.all([
          // Recent orders recorded by admin for this ambassador
          supabase
            .from('orders')
            .select('id, created_at, units, total, payment_method, payment_status')
            .eq('ambassador_code', ambRefCode)
            .order('created_at', { ascending: false })
            .limit(10),

          // Team members for heatmap (direct recruits)
          supabase
            .from('ambassador_profiles')
            .select('id, personal_sales_this_month, total_recruits, is_active, created_at, profiles!ambassador_profiles_id_fkey(full_name)')
            .eq('sponsor_id', userId),

          // Revenue by level from commission events
          // TODO: Replace with actual L1-L6 aggregation query from Supabase
          supabase
            .from('commission_events')
            .select('tier_level, amount')
            .eq('ambassador_id', userId)
            .eq('status', 'available'),
        ]);

        if (ordersResult.data) {
          setRecentOrders(
            ordersResult.data.map((o: any) => ({
              id: o.id,
              created_at: o.created_at,
              units: o.units ?? 1,
              total: Number(o.total) || 0,
              payment_method: o.payment_method || 'N/A',
              payment_status: o.payment_status || 'pending',
            }))
          );
        }

        if (teamResult.data) {
          setTeamMembers(
            teamResult.data.map((m: any) => {
              const createdAt = new Date(m.created_at);
              const daysSinceJoin = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
              let status: 'active' | 'stalled' | 'new' | 'at-risk' = 'active';
              if (daysSinceJoin <= 30) status = 'new';
              else if ((m.personal_sales_this_month ?? 0) === 0) status = 'at-risk';
              else if (!m.is_active) status = 'stalled';

              return {
                id: m.id,
                name: m.profiles?.full_name || 'Unknown',
                status,
                salesThisMonth: m.personal_sales_this_month ?? 0,
                recruits: m.total_recruits ?? 0,
              };
            })
          );
        }

        // Aggregate revenue by tier level
        if (revenueLevelsResult.data) {
          const byLevel: Record<number, number> = {};
          revenueLevelsResult.data.forEach((r: any) => {
            const lvl = r.tier_level ?? 0;
            byLevel[lvl] = (byLevel[lvl] || 0) + Number(r.amount);
          });
          // Include personal sales as level 0
          byLevel[0] = ambassadorResult.data?.personal_sales_this_month || 0;
          setRevenueByLevel(byLevel);
        } else {
          // Fallback: at minimum show personal sales
          setRevenueByLevel({ 0: ambassadorResult.data?.personal_sales_this_month || 0 });
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user, role]);

  if (!user || role !== 'ambassador') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
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
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

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

  const completedMissions = missions.filter((m) => m.completed).length;
  const salesAwayFromActive = Math.max(0, PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT - personalSales);

  // Progress ring SVG math
  const ringRadius = 70;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (activeRequirementPercent / 100) * ringCircumference;

  // Monthly forecast calculations
  const dailyRate = daysElapsed > 0 ? currentMonthEarnings / daysElapsed : 0;
  const conservativeEstimate = dailyRate * daysInMonth * 0.7;
  const likelyEstimate = dailyRate * daysInMonth;
  const optimisticEstimate = dailyRate * daysInMonth * 1.4;
  const maxEstimate = Math.max(optimisticEstimate, 1);

  // Compensation roadmap mock data (levels L1-L4)
  const compLevels = [
    { level: 'Level 1', team: totalRecruits, active: Math.floor(totalRecruits * 0.67), earnings: stats.availableCash * 0.5, rate: '15.0%', unlocked: true },
    { level: 'Level 2', team: totalRecruits * 3, active: Math.floor(totalRecruits * 3 * 0.57), earnings: stats.availableCash * 0.3, rate: '7.5%', unlocked: true },
    { level: 'Level 3', team: totalRecruits * 8, active: Math.floor(totalRecruits * 8 * 0.41), earnings: stats.availableCash * 0.15, rate: '3.0%', unlocked: true },
    { level: 'Level 4', team: '--', active: '--', earnings: 0, rate: '1.5%', unlocked: isActive },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12">
      {/* ── Row 1: Hero Card ── */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 border border-outline-variant/10">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            {isFounder && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/20 text-primary-fixed rounded-full mb-6">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-xs font-bold tracking-widest uppercase">
                  FOUNDER {PLATFORM_CONFIG.FOUNDER_BOOST_MULTIPLIER}x
                </span>
              </div>
            )}
            <h2 className="text-[28px] font-bold text-on-surface leading-tight mb-4">
              {isActive
                ? "You've hit Active status -- all tiers unlocked!"
                : `You are $${salesAwayFromActive.toFixed(0)} away from your next milestone!`}
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              {isActive
                ? `You've reached $${PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT} in personal sales. Tiers 4-6 are earning for you.`
                : `Hit $${PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT} personal sales to unlock L4-L6 commissions!`}
            </p>
            {isFounder && founderBoostEnds && (
              <p className="mt-3 text-xs text-on-surface-variant">
                Founder boost ends: <span className="font-semibold text-primary">{founderBoostEnds}</span>
              </p>
            )}
          </div>
          {/* Progress Ring */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                className="text-surface-container-highest"
                cx="80"
                cy="80"
                r={ringRadius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
              />
              <circle
                className="text-primary"
                cx="80"
                cy="80"
                r={ringRadius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.3))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-primary">
                ${personalSales.toFixed(0)}
              </span>
              <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant font-mono">
                of ${PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Row 2: Earnings Grid ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container p-6 rounded-xl transition-all hover:translate-y-[-2px]">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Available Cash</p>
          <span className="text-3xl font-bold text-secondary">
            ${stats.availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-surface-container p-6 rounded-xl transition-all hover:translate-y-[-2px]">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Pending Cash</p>
          <span className="text-3xl font-bold text-primary-fixed-dim">
            ${stats.pendingCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-surface-container p-6 rounded-xl transition-all hover:translate-y-[-2px]">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Available $FAME</p>
          <span className="text-3xl font-bold text-primary">
            {stats.availableTokens.toLocaleString()}
          </span>
        </div>
        <div className="bg-surface-container p-6 rounded-xl transition-all hover:translate-y-[-2px]">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Pending $FAME</p>
          <span className="text-3xl font-bold text-primary-fixed-dim">
            {stats.pendingTokens.toLocaleString()}
          </span>
        </div>
      </section>

      {/* ── Row 3: Two-column layout ── */}
      <section className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left Column (60%) */}
        <div className="lg:col-span-6 space-y-8">
          {/* Referral Code Card */}
          <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-4 text-center md:text-left">
                <h3 className="text-lg font-semibold text-on-surface">Your Ambassador Portal</h3>
                <div className="flex items-center gap-2 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                  <span className="font-mono text-xl tracking-widest text-primary px-4">
                    {referralCode || '------'}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-surface-container rounded transition-colors text-on-surface-variant"
                  >
                    {copied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Share your code to earn 15% commissions on all direct sales.
                </p>
              </div>
              {/* QR Placeholder */}
              <div className="p-3 bg-white rounded-lg shadow-xl shadow-black/40">
                <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                  QR Code
                </div>
              </div>
            </div>
          </div>

          {/* Compensation Roadmap Table */}
          <div className="bg-surface-container rounded-xl overflow-hidden shadow-lg shadow-black/20">
            <div className="px-6 py-4 bg-surface-container-high flex justify-between items-center">
              <h3 className="font-semibold text-on-surface">Compensation Roadmap</h3>
              <span className="text-xs font-mono text-primary uppercase">Direct &amp; Team</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    <th className="px-6 py-4 font-bold">Level</th>
                    <th className="px-6 py-4 font-bold">Team</th>
                    <th className="px-6 py-4 font-bold">Active</th>
                    <th className="px-6 py-4 font-bold">Earnings</th>
                    <th className="px-6 py-4 font-bold text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-outline-variant/5">
                  {compLevels.map((row) => (
                    <tr
                      key={row.level}
                      className={`hover:bg-surface-container-high/50 transition-colors ${
                        !row.unlocked ? 'opacity-50 bg-surface-container-lowest/30' : ''
                      }`}
                    >
                      <td className={`px-6 py-4 font-bold ${row.unlocked ? 'text-secondary' : ''}`}>
                        {row.level}
                      </td>
                      <td className="px-6 py-4">{row.team}</td>
                      <td className="px-6 py-4">{row.active}</td>
                      <td className="px-6 py-4">
                        ${typeof row.earnings === 'number' ? row.earnings.toFixed(2) : '0.00'}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono ${row.unlocked ? 'text-primary' : ''}`}>
                        {row.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Forecast Bar Chart */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-on-surface mb-6">Monthly Forecast</h3>
            <div className="flex items-end gap-4 h-48 px-4">
              {/* Conservative */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-surface-container-high rounded-t-lg transition-all hover:bg-surface-variant"
                  style={{ height: `${Math.max(10, (conservativeEstimate / maxEstimate) * 100)}%` }}
                />
                <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant text-center">
                  Conservative
                </span>
                <span className="text-xs font-mono text-on-surface-variant">
                  ${conservativeEstimate.toFixed(0)}
                </span>
              </div>
              {/* Likely */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary/40 rounded-t-lg transition-all hover:bg-primary/60"
                  style={{ height: `${Math.max(10, (likelyEstimate / maxEstimate) * 100)}%` }}
                />
                <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant text-center">
                  Likely
                </span>
                <span className="text-xs font-mono text-on-surface-variant">
                  ${likelyEstimate.toFixed(0)}
                </span>
              </div>
              {/* Optimistic */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary rounded-t-lg transition-all hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  style={{ height: `${Math.max(10, (optimisticEstimate / maxEstimate) * 100)}%` }}
                />
                <span className="text-[10px] uppercase tracking-tighter text-primary font-bold text-center">
                  Optimistic
                </span>
                <span className="text-xs font-mono text-primary">
                  ${optimisticEstimate.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (40%) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Momentum Tracker (NBA Cards) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Momentum Tracker
            </h3>
            {/* NBA 1 - Priority */}
            <div className="bg-surface-container-high p-4 rounded-lg border-l-4 border-primary shadow-lg shadow-black/20 flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">Onboard 3 Directs</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  {isFounder
                    ? `Unlock Founder bonus +$250 this month.`
                    : `Build your team to unlock deeper commissions.`}
                </p>
              </div>
            </div>
            {/* NBA 2 */}
            <div className="bg-surface-container p-4 rounded-lg flex items-start gap-4 hover:bg-surface-container-high transition-colors cursor-pointer">
              <div className="bg-secondary/10 p-2 rounded text-secondary">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">Post Content Blast</h4>
                <p className="text-xs text-on-surface-variant mt-1">Brand assets updated for TikTok/IG.</p>
              </div>
            </div>
            {/* NBA 3 */}
            <div className="bg-surface-container p-4 rounded-lg flex items-start gap-4 hover:bg-surface-container-high transition-colors cursor-pointer">
              <div className="bg-on-tertiary-container/10 p-2 rounded text-tertiary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">Strategy Call</h4>
                <p className="text-xs text-on-surface-variant mt-1">RSVP for Tuesday&apos;s Leadership Summit.</p>
              </div>
            </div>
          </div>

          {/* Mission Progress Checklist */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-on-surface">Mission Progress</h3>
              <span className="text-xs font-mono bg-surface-container px-2 py-1 rounded">
                {completedMissions} / {missions.length} Complete
              </span>
            </div>
            <div className="space-y-4">
              {missions.map((mission) => (
                <div key={mission.id} className="flex items-center gap-3">
                  {mission.completed ? (
                    <div className="w-5 h-5 rounded-full bg-secondary text-surface flex items-center justify-center">
                      <Check className="h-3 w-3 font-bold" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-outline-variant flex items-center justify-center" />
                  )}
                  <span className={`text-sm ${mission.completed ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {mission.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Stats Mini-Cards (2x2 grid) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container p-4 rounded-lg text-center">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Direct Sales</p>
              <p className="text-xl font-black text-on-surface">
                ${personalSales.toFixed(0)}
              </p>
            </div>
            <div className="bg-surface-container p-4 rounded-lg text-center">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Orders Today</p>
              <p className="text-xl font-black text-on-surface">
                {stats.directOrdersToday}
              </p>
            </div>
            <div className="bg-surface-container p-4 rounded-lg text-center">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">New Customers</p>
              <p className="text-xl font-black text-on-surface">
                +{stats.newCustomersThisWeek}
              </p>
            </div>
            <div className="bg-surface-container p-4 rounded-lg text-center">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Recruits</p>
              <p className="text-xl font-black text-on-surface">
                {totalRecruits}
              </p>
            </div>
          </div>

          {/* What Unlocks - Horizon Card */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-surface-container bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-surface-container-highest to-surface-container group">
            <div className="absolute inset-0 bg-surface-tint/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <Lock className="h-5 w-5 text-primary-fixed-dim" />
              <div>
                <h4 className="text-sm font-bold text-on-surface">What Unlocks</h4>
                <p className="text-xs text-on-surface-variant">
                  {isActive
                    ? 'Private Equity Pool at L6'
                    : `L4-L6 Commissions at $${PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT} personal sales`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── My Sales - Recent Orders ── */}
      {recentOrders.length > 0 && (
        <section className="mt-12 space-y-6">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-secondary" />
            <h2 className="text-xl font-bold text-on-surface">My Sales</h2>
          </div>
          <div className="bg-surface-container rounded-xl overflow-hidden shadow-lg shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Units</th>
                    <th className="px-6 py-4 font-bold">Total</th>
                    <th className="px-6 py-4 font-bold">Payment Method</th>
                    <th className="px-6 py-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-outline-variant/5">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="px-6 py-4 text-on-surface-variant">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-on-surface">{order.units}</td>
                      <td className="px-6 py-4 font-bold text-secondary">
                        ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant capitalize">{order.payment_method}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : order.payment_status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Tier 4+ Team Leadership Section ── */}
      {ambassadorData && ambassadorData.tier >= 4 && (
        <section className="mt-12 space-y-8">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-primary-container">Team Leadership</h2>
          </div>

          {/* Revenue Waterfall - L1-L6 sales breakdown */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Revenue Waterfall</h3>
            <p className="text-xs text-on-surface-variant mb-4">Sales breakdown by network level (Personal + L1-L6)</p>
            <RevenueWaterfall data={revenueByLevel} />
          </div>

          {/* Team Activity Heatmap */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Team Activity Heatmap</h3>
            <p className="text-xs text-on-surface-variant mb-4">Direct recruits colored by activity status</p>
            <TeamHeatmap data={teamMembers} />
          </div>

          {/* Network Health Stats */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <h3 className="text-lg font-semibold text-on-surface mb-6">Network Health</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400">
                  {teamMembers.filter((m) => m.status === 'active').length}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-wider">Active</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-blue-400">
                  {teamMembers.filter((m) => m.status === 'new').length}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-wider">New</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-amber-400">
                  {teamMembers.filter((m) => m.status === 'stalled').length}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-wider">Stalled</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-400">
                  {teamMembers.filter((m) => m.status === 'at-risk').length}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-wider">At-Risk</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
