'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Sparkles, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { createSafeClient } from '@/lib/supabase/safe-client';
import { signOut } from '@/lib/supabase/auth';

interface BuyerStats {
  totalOrders: number;
  totalSpend: number;
  requestedAmbassadorAt: string | null;
}

interface SponsorInfo {
  id: string;
  referral_code: string;
  profiles?: {
    full_name?: string | null;
  };
}

interface BuyerOrder {
  id: string;
  created_at: string;
  total: number;
  units: number;
  payment_status: string;
  settlement_status: string;
  order_type: string;
}

export default function BuyerPage() {
  const router = useRouter();
  const { user, userProfile, role, isAuthenticated, refreshProfile } = useAuthContext();
  const [stats, setStats] = useState<BuyerStats>({
    totalOrders: 0,
    totalSpend: 0,
    requestedAmbassadorAt: null,
  });
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [sponsor, setSponsor] = useState<SponsorInfo | null>(null);
  const [units, setUnits] = useState(1);
  const [ageVerified, setAgeVerified] = useState(!!userProfile?.age_verified);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [requestingReview, setRequestingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const load = async () => {
      setLoading(true);
      const safe = createSafeClient();

      const [buyerResult, orderResult] = await Promise.all([
        safe
          .from('buyer_profiles')
          .select('total_orders, requested_ambassador_at, referred_by')
          .eq('id', user.id)
          .single(),
        safe
          .from('orders')
          .select('id, created_at, total, units, payment_status, settlement_status, order_type')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const buyerData = buyerResult.data as any;
      const orderData = (orderResult.data || []) as any[];

      setStats({
        totalOrders: Number(buyerData?.total_orders || 0),
        totalSpend: orderData.reduce((sum, order) => sum + Number(order.total || 0), 0),
        requestedAmbassadorAt: buyerData?.requested_ambassador_at || null,
      });
      setOrders(orderData);

      if (buyerData?.referred_by) {
        const sponsorResult = await safe
          .from('ambassador_profiles')
          .select('id, referral_code, profiles!ambassador_profiles_id_fkey(full_name)')
          .eq('id', buyerData.referred_by)
          .single();
        setSponsor((sponsorResult.data as any) || null);
      } else {
        setSponsor(null);
      }

      setLoading(false);
    };

    load();
  }, [user, isAuthenticated]);

  const unlockStatus = useMemo(() => {
    if (role === 'ambassador' || role === 'admin') {
      return 'Promoted';
    }
    return stats.requestedAmbassadorAt ? 'Pending Review' : 'Buyer Stage';
  }, [role, stats.requestedAmbassadorAt]);

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/orders/retail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          units,
          ageVerified,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      setMessage(
        `Retail order recorded for ${units} unit${units === 1 ? '' : 's'} and linked to your sponsor.`
      );
      await refreshProfile();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleRequestReview = async () => {
    setRequestingReview(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/buyer/request-ambassador', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to request review');
      }
      if (data.alreadyPromoted) {
        setMessage('Your ambassador approval is already complete. Refreshing your profile now.');
      } else if (data.alreadyRequested) {
        setMessage('Your 50-pack review is already in the admin queue.');
      } else {
        setMessage('Your request for 50-pack review has been sent to the admin team.');
      }
      await refreshProfile();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request review');
    } finally {
      setRequestingReview(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary-container">Buyer Portal</p>
            <h1 className="mt-2 text-3xl font-black">Invite Accepted. Buyer Stage Active.</h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              Place retail orders, keep your history visible, and move into ambassador status once
              a 50-pack is approved.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {(role === 'ambassador' || role === 'admin') && (
              <Link
                href="/ambassador"
                className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary"
              >
                Go to Ambassador Portal
              </Link>
            )}
            {role === 'admin' && (
              <Link
                href="/admin/record-sale"
                className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface"
              >
                Open Commerce Hub
              </Link>
            )}
            <button
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
              className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface"
            >
              Sign Out
            </button>
          </div>
        </header>

        {message && (
          <div className="rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant">Sponsor</p>
            <h2 className="mt-2 text-2xl font-bold">{sponsor?.profiles?.full_name || 'Invite Sponsor'}</h2>
            <p className="mt-2 font-mono text-primary-container">{sponsor?.referral_code || 'Pending'}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant">Retail Orders</p>
            <h2 className="mt-2 text-3xl font-black">{stats.totalOrders}</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Total spend: ${stats.totalSpend.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant">Ambassador Unlock</p>
            <h2 className="mt-2 text-2xl font-bold">{unlockStatus}</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Admin approval of a 50-pack issues your ambassador access and personal referral code.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-primary-container" />
              <h2 className="text-xl font-bold">Place Retail Order</h2>
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              Retail orders stay attached to your buyer history and still credit the sponsor who invited you.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-on-surface">Units</span>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={units}
                  onChange={(e) => setUnits(Math.max(1, Math.min(25, Number(e.target.value) || 1)))}
                  className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface"
                />
              </label>
              <div className="rounded-xl bg-surface-container-high p-4">
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">Order Total</p>
                <p className="mt-2 text-2xl font-black text-primary-container">
                  ${(units * 25).toFixed(2)}
                </p>
              </div>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-on-surface-variant">
              <input
                type="checkbox"
                checked={ageVerified}
                onChange={(e) => setAgeVerified(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant/20"
              />
              I confirm this order is age-verified for 21+ checkout compliance.
            </label>
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-container to-primary px-5 py-3 text-sm font-semibold text-on-primary disabled:opacity-50"
            >
              {placingOrder && <Loader2 className="h-4 w-4 animate-spin" />}
              {placingOrder ? 'Recording Order...' : 'Place Retail Order'}
            </button>
          </div>

          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-secondary" />
              <h2 className="text-xl font-bold">50-Pack Path</h2>
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              Buyers stay in this portal until the admin team approves a 50-pack. That event promotes you, creates your ambassador profile, and issues your code.
            </p>

            <div className="mt-5 space-y-3 rounded-xl bg-surface-container-high p-4 text-sm text-on-surface-variant">
              <div className="flex items-center justify-between">
                <span>Launch gate</span>
                <span className="font-semibold text-on-surface">Admin-approved 50-pack</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Code timing</span>
                <span className="font-semibold text-on-surface">Issued at approval</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Order history</span>
                <span className="font-semibold text-on-surface">Preserved after promotion</span>
              </div>
            </div>

            {role === 'buyer' && (
              <button
                onClick={handleRequestReview}
                disabled={requestingReview || !!stats.requestedAmbassadorAt}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {requestingReview && <Loader2 className="h-4 w-4 animate-spin" />}
                {stats.requestedAmbassadorAt ? 'Review Requested' : 'Request 50-Pack Review'}
              </button>
            )}

            <div className="mt-6 rounded-xl border border-outline-variant/10 bg-background/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <ShieldCheck className="h-4 w-4 text-primary-container" />
                Admin trigger lives in the Commerce Hub
              </div>
              <p className="mt-2 text-sm text-on-surface-variant">
                Approvals, pack sales, remittances, and wholesale purchases are all recorded from the admin side so the transition stays auditable.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Buyer Order History</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                This history remains visible after you are promoted to ambassador.
              </p>
            </div>
            {(role === 'ambassador' || role === 'admin') && (
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-container/15 px-3 py-1 text-xs font-semibold text-primary-container">
                History Preserved
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            )}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-on-surface-variant">
                <tr>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Units</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-on-surface-variant">
                      No retail orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="py-3 capitalize">{order.order_type.replace('_', ' ')}</td>
                      <td className="py-3">{order.units || 1}</td>
                      <td className="py-3 font-semibold">${Number(order.total).toFixed(2)}</td>
                      <td className="py-3 capitalize">
                        {order.payment_status} / {order.settlement_status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
