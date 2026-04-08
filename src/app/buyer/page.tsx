'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

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

  const tierDiscounts = [5, 10, 15, 20];
  const nextDiscount = currentTierIndex >= 0 ? tierDiscounts[currentTierIndex] : 20;

  const lastOrder = recentOrders[0];
  const lastOrderStatus = lastOrder?.settlement_status || lastOrder?.payment_status || null;

  // Compute segmented progress bar widths
  const segmentProgress = tierThresholds.map((threshold, i) => {
    const segStart = i === 0 ? 0 : tierThresholds[i - 1];
    const segEnd = threshold;
    if (fameBalance >= segEnd) return 100;
    if (fameBalance <= segStart) return 0;
    return ((fameBalance - segStart) / (segEnd - segStart)) * 100;
  });

  const statusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'settled':
      case 'delivered':
        return 'bg-secondary-container/20 text-secondary';
      case 'in_transit':
      case 'shipped':
        return 'bg-secondary-container/20 text-secondary';
      case 'pending':
        return 'bg-primary-container/20 text-primary';
      case 'failed':
      case 'cancelled':
        return 'bg-error-container/20 text-error';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ── Hero: Portfolio Value + Ambassador Card ── */}
      <section className="pt-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          {/* Left: FAME balance */}
          <div className="flex-1">
            <p className="text-primary font-mono text-xs tracking-widest uppercase mb-2">
              Portfolio Value
            </p>
            <h2 className="text-[2.75rem] font-bold leading-tight text-on-surface flex items-baseline gap-3">
              <span className="text-primary-container">$FAME</span>{' '}
              {fameBalance.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-secondary/10 text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider amber-glow-box">
                +{holdToSaveTier > 0 ? holdToSaveTier : 0}% this month
              </span>
            </div>
          </div>

          {/* Right: Ambassador card */}
          {ambassadorInfo && (
            <div className="w-full md:w-80 bg-surface-container-low rounded-lg p-4 flex items-center gap-4 border border-outline-variant/5">
              {/* Avatar placeholder */}
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-lg font-bold shrink-0">
                {ambassadorInfo.full_name
                  ? ambassadorInfo.full_name.charAt(0).toUpperCase()
                  : 'A'}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                  Your Ambassador
                </p>
                <p className="text-sm font-bold text-on-surface">
                  {ambassadorInfo.full_name || 'Your Ambassador'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-primary font-mono text-xs bg-surface-container px-2 py-0.5 rounded">
                    {ambassadorInfo.referral_code}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Hold-to-Save Tier Progress ── */}
        <div className="mt-12 bg-surface-container rounded-xl p-8 border border-outline-variant/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-on-surface">Tier Progress</h3>
            {currentTierIndex >= 0 && currentTierIndex < 4 && (
              <span className="text-primary-fixed-dim font-mono text-sm">
                {tokensToNextTier.toLocaleString()} more to unlock {nextDiscount}% off
              </span>
            )}
          </div>

          {/* Segmented progress bar */}
          <div className="relative h-4 bg-surface-container-lowest rounded-full overflow-hidden flex gap-1 p-0.5">
            {segmentProgress.map((pct, i) => {
              const isFirst = i === 0;
              const isLast = i === segmentProgress.length - 1;
              return pct > 0 ? (
                <div
                  key={i}
                  className="h-full flex-1 rounded-sm overflow-hidden bg-surface-container-highest"
                >
                  <div
                    className={`h-full bg-gradient-to-r from-primary-container to-primary ${isFirst ? 'rounded-l-full' : ''} ${isLast && pct === 100 ? 'rounded-r-full' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ) : (
                <div
                  key={i}
                  className={`h-full bg-surface-container-highest flex-1 ${isLast ? 'rounded-r-full' : ''}`}
                />
              );
            })}
          </div>

          <div className="flex justify-between mt-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <span className="text-primary font-bold">
              Current ({fameBalance >= 1000 ? `${(fameBalance / 1000).toFixed(1)}K` : fameBalance})
            </span>
            <span>10K Tier</span>
            <span>25K Tier</span>
            <span>50K Tier</span>
            <span>100K Elite</span>
          </div>
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Active Order Status */}
        <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] text-gray-400 font-mono mb-1 uppercase tracking-tighter">
                  Active Order
                </p>
                {lastOrder ? (
                  <h4 className="font-mono text-on-surface font-medium">
                    #{lastOrder.id.slice(0, 8).toUpperCase()}
                  </h4>
                ) : (
                  <h4 className="font-mono text-on-surface-variant font-medium">No orders yet</h4>
                )}
              </div>
              {lastOrderStatus && (
                <span
                  className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${statusBadgeClass(lastOrderStatus)}`}
                >
                  {formatStatus(lastOrderStatus)}
                </span>
              )}
            </div>

            {lastOrder ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center text-on-surface-variant text-xs font-mono">
                    PKG
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">
                      Order Total: ${lastOrder.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(lastOrder.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Place your first order to start earning $FAME tokens.
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-between items-center">
            {lastOrder && (
              <p className="text-xs text-primary font-bold">
                {formatStatus(lastOrderStatus || 'Processing')}
              </p>
            )}
            <Link
              href="/buyer/orders"
              className="text-on-surface text-sm font-medium flex items-center gap-2 group-hover:translate-x-1 transition-transform ml-auto"
            >
              {lastOrder ? 'Track Details' : 'Browse Shop'}{' '}
              <span className="text-sm">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Card 2: The Next Unlock (Horizon Card) */}
        <div className="shimmer-future rounded-xl p-6 border border-primary/10 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background icon */}
          <div className="absolute -right-4 -top-4 opacity-10 text-[120px] leading-none select-none pointer-events-none">
            &#x1F513;
          </div>

          <div>
            <h4 className="text-base font-semibold text-on-surface mb-2">The Next Unlock</h4>
            {currentTierIndex >= 0 && currentTierIndex < 4 ? (
              <p className="text-sm text-on-surface-variant max-w-[280px]">
                Hold {tokensToNextTier.toLocaleString()} more $FAME to unlock a permanent{' '}
                {nextDiscount}% discount on all store items.
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant max-w-[280px]">
                You have reached Elite status! Enjoy 20% off on all store items.
              </p>
            )}
          </div>

          <div className="mt-8">
            {currentTierIndex >= 0 && currentTierIndex < 4 && (
              <div className="w-full bg-surface-container-lowest h-1.5 rounded-full mb-6">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${Math.min(100, ((fameBalance - prevThreshold) / (nextThreshold - prevThreshold)) * 100)}%`,
                    boxShadow: '0 0 12px rgba(255,193,116,0.5)',
                  }}
                />
              </div>
            )}
            <Link
              href="/buyer/shop"
              className="block w-full bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold py-3 rounded-lg text-sm text-center transition-transform active:scale-95"
            >
              Shop Now to Earn
            </Link>
          </div>
        </div>

        {/* Card 3: Frequently Reordered */}
        <div className="bg-surface-container-low rounded-xl p-6">
          <h4 className="text-base font-semibold text-on-surface mb-6">Frequently Reordered</h4>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {totalOrders > 0 ? (
              <>
                {/* Placeholder product cards — real product data would come from an order-items query */}
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="min-w-[140px] bg-surface-container p-3 rounded-lg border border-outline-variant/5"
                  >
                    <div className="w-full h-24 bg-surface-container-high rounded mb-3 flex items-center justify-center text-on-surface-variant text-xs">
                      Product
                    </div>
                    <p className="text-xs font-bold truncate text-on-surface">Item {i}</p>
                    <p className="text-[10px] text-gray-500 mb-3">From past orders</p>
                    <Link
                      href="/buyer/shop"
                      className="block w-full border border-outline-variant/20 py-1.5 rounded text-[10px] font-bold text-center hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      REORDER
                    </Link>
                  </div>
                ))}
              </>
            ) : null}

            {/* Explore more card */}
            <div className="min-w-[140px] bg-surface-container p-3 rounded-lg border border-outline-variant/5 opacity-50">
              <div className="w-full h-24 bg-surface-container-highest rounded flex items-center justify-center mb-3">
                <span className="text-gray-600 text-2xl">+</span>
              </div>
              <p className="text-xs font-bold truncate text-on-surface">Explore More</p>
            </div>
          </div>
        </div>

        {/* Card 4: Field Events */}
        <div className="bg-surface-container-low rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-base font-semibold text-on-surface">Field Events</h4>
            {upcomingEvents.length > 0 && (
              <span className="text-[10px] font-mono text-primary font-bold">
                {upcomingEvents.length} UPCOMING
              </span>
            )}
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.date);
                const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
                const day = eventDate.getDate();
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex flex-col items-center justify-center border border-outline-variant/10 group-hover:bg-primary transition-colors">
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-on-primary uppercase">
                        {month}
                      </span>
                      <span className="text-lg font-black group-hover:text-on-primary leading-none">
                        {day}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">{event.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{event.type}</p>
                    </div>
                  </div>
                );
              })}

              <Link
                href="/buyer/events"
                className="block w-full mt-6 text-xs font-mono text-gray-400 uppercase tracking-widest hover:text-primary transition-colors text-center"
              >
                View All Events
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No upcoming events</p>
          )}
        </div>
      </div>
    </div>
  );
}
