'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import EarningsCard from '@/components/shared/EarningsCard';
import NBAWidget from '@/components/shared/NBAWidget';
import { HiOutlineShoppingCart, HiOutlineCheckCircle, HiOutlineQuestionMarkCircle } from 'react-icons/hi';

interface BuyerData {
  fame_balance: number;
  hold_to_save_tier: number;
  total_orders: number;
  referred_by: string | null;
}

interface RecentOrder {
  id: string;
  payment_status: string;
  settlement_status: string;
  total: number;
  created_at: string;
}

interface AmbassadorInfo {
  full_name: string | null;
  referral_code: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  type: string;
}

export default function BuyerHomePage() {
  const { user, role } = useAuthContext();
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ambassadorInfo, setAmbassadorInfo] = useState<AmbassadorInfo | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [showAmbassadorExplainer, setShowAmbassadorExplainer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== 'buyer') return;

    const fetchData = async () => {
      const supabase = createClient();

      const [buyerResult, ordersResult, eventsResult] = await Promise.all([
        supabase
          .from('buyer_profiles')
          .select('fame_balance, hold_to_save_tier, total_orders, referred_by')
          .eq('id', user.id)
          .single(),

        supabase
          .from('orders')
          .select('id, payment_status, settlement_status, total, created_at')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),

        supabase
          .from('events')
          .select('id, name, date, type')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(2),
      ]);

      const buyer = buyerResult.data;
      setBuyerData(buyer);
      setRecentOrders(ordersResult.data || []);
      setUpcomingEvents(eventsResult.data || []);

      // Fetch ambassador info if referred_by exists
      if (buyer?.referred_by) {
        const { data: ambProfile } = await supabase
          .from('ambassador_profiles')
          .select('id, referral_code')
          .eq('id', buyer.referred_by)
          .single();

        if (ambProfile) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', ambProfile.id)
            .single();

          setAmbassadorInfo({
            full_name: profile?.full_name || null,
            referral_code: ambProfile.referral_code,
          });
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user, role]);

  if (!user || role !== 'buyer') return null;

  const fameBalance = buyerData?.fame_balance || 0;
  const holdToSaveTier = buyerData?.hold_to_save_tier || 0;
  const totalOrders = buyerData?.total_orders || 0;

  const tierThresholds = [10000, 25000, 50000, 100000];
  const currentTierIndex = tierThresholds.findIndex(t => fameBalance < t);
  const nextThreshold = currentTierIndex >= 0 ? tierThresholds[currentTierIndex] : 100000;
  const prevThreshold = currentTierIndex > 0 ? tierThresholds[currentTierIndex - 1] : 0;
  const tokensToNextTier = nextThreshold - fameBalance;

  const lastOrder = recentOrders[0];
  const lastOrderStatus = lastOrder?.settlement_status || lastOrder?.payment_status || null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400">
          Manage your orders, earn rewards, and unlock exclusive discounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Earnings */}
        <div className="lg:col-span-1 space-y-6">
          <EarningsCard
            availableCash={0}
            pendingCash={0}
            availableTokens={fameBalance}
            pendingTokens={0}
            holdToSaveTier={holdToSaveTier as 0 | 5 | 10 | 15 | 20}
            fameBalance={fameBalance}
            isAmbassador={false}
            onWithdraw={() => {}}
            onViewDetails={() => {}}
          />
        </div>

        {/* Center — NBA */}
        <div className="lg:col-span-1 space-y-6">
          <NBAWidget maxActions={3} showTitle={true} />
        </div>

        {/* Right — Orders & Events */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Status */}
          <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineShoppingCart className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-gray-100">Your Orders</h3>
            </div>

            {loading ? (
              <div className="h-20 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              </div>
            ) : totalOrders > 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-700/20 p-3">
                  <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-amber-300">{totalOrders}</p>
                </div>

                {lastOrderStatus && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <HiOutlineCheckCircle className="h-4 w-4 text-emerald-400" />
                      <p className="text-xs text-gray-500">Last Order</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-300 capitalize">
                      {lastOrderStatus}
                    </p>
                  </div>
                )}

                <Link
                  href="/buyer/orders"
                  className="block text-center rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors py-2 text-sm font-semibold text-amber-300"
                >
                  View All Orders
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">No orders yet</p>
                <Link
                  href="/buyer/shop"
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Start Shopping →
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-100">
              <span className="text-lg">📅</span>
              Upcoming Events
            </h3>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-lg bg-gray-700/20 p-2.5">
                    <p className="text-xs font-medium text-amber-300">{event.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
                <Link
                  href="/buyer/events"
                  className="text-xs text-amber-300 hover:text-amber-400 font-semibold mt-2 block"
                >
                  See all events →
                </Link>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No upcoming events</p>
            )}
          </div>

          <Link
            href="/buyer/shop"
            className="block w-full rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 transition-all py-3 px-4 text-center font-semibold text-white"
          >
            Shop Products
          </Link>
        </div>
      </div>

      {/* Ambassador Explainer (only if referred) */}
      {ambassadorInfo && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/20 p-6">
          <div className="flex items-start gap-4">
            <HiOutlineQuestionMarkCircle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-300 mb-2">
                Why am I seeing {ambassadorInfo.full_name || 'your ambassador'}?
              </h3>
              <p className="text-sm text-amber-100/80 mb-4">
                You were referred by{' '}
                <span className="font-semibold">{ambassadorInfo.full_name || 'an ambassador'}</span> using
                code{' '}
                <span className="font-mono bg-amber-950/50 px-2 py-1 rounded text-amber-300">
                  {ambassadorInfo.referral_code}
                </span>
                . This means:
              </p>
              <ul className="space-y-2 text-sm text-amber-100/80">
                <li className="flex gap-2">
                  <span className="text-amber-400">✓</span>
                  <span>You get exclusive discounts through Hold-to-Save rewards</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">✓</span>
                  <span>You earn $FAME tokens on every purchase ($1 = 10 tokens)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">✓</span>
                  <span>Your purchase supports {ambassadorInfo.full_name || 'their'} business</span>
                </li>
              </ul>
              <button
                onClick={() => setShowAmbassadorExplainer(!showAmbassadorExplainer)}
                className="mt-3 text-sm font-semibold text-amber-300 hover:text-amber-200"
              >
                {showAmbassadorExplainer ? 'Hide' : 'Learn more'} →
              </button>
            </div>
          </div>

          {showAmbassadorExplainer && (
            <div className="mt-4 border-t border-amber-500/30 pt-4 space-y-3 text-sm text-amber-100/70">
              <p>
                FameBar uses a direct-selling model where ambassadors earn commissions by referring
                customers like you. By shopping through their referral code, you support their business
                while getting access to exclusive loyalty rewards.
              </p>
              <p className="text-xs text-amber-200">
                💡 <span className="font-semibold">Pro Tip:</span> Keep earning $FAME tokens — hit 10,000 to
                unlock your first 5% discount!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tier Progress */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <h3 className="mb-6 text-base font-semibold text-gray-100">What Unlocks When I Earn More?</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { threshold: 10000, pct: 5, color: 'emerald' },
            { threshold: 25000, pct: 10, color: 'amber' },
            { threshold: 50000, pct: 15, color: 'purple' },
            { threshold: 100000, pct: 20, color: 'yellow' },
          ].map(({ threshold, pct, color }) => {
            const unlocked = fameBalance >= threshold;
            const borderClass = unlocked ? `border-${color}-400/50 bg-${color}-500/10` : 'border-gray-600 bg-gray-700/20';
            const textClass = unlocked ? `text-${color}-400` : 'text-gray-400';

            return (
              <div key={threshold} className={`rounded-lg border p-4 transition-all ${borderClass}`}>
                <p className="text-xs font-semibold text-gray-400 mb-2">{threshold.toLocaleString()} tokens</p>
                <p className={`text-2xl font-bold mb-2 ${textClass}`}>{pct}%</p>
                <p className="text-xs text-gray-400">Discount</p>
                {unlocked ? (
                  <div className="mt-3 text-xs font-semibold text-emerald-300">✓ Unlocked</div>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">
                    {(threshold - fameBalance).toLocaleString()} more tokens
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {currentTierIndex >= 0 && currentTierIndex < 4 && (
          <div className="mt-6 p-4 rounded-lg bg-gray-700/20 border border-gray-600">
            <p className="text-xs font-semibold text-gray-400 mb-2">Your Progress to Next Tier</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((fameBalance - prevThreshold) / (nextThreshold - prevThreshold)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-amber-300 whitespace-nowrap">
                {tokensToNextTier.toLocaleString()} left
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
