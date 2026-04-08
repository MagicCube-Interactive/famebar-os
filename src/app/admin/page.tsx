'use client';

import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  ShoppingCart,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import NBAWidget from '@/components/shared/NBAWidget';
import StatCard from '@/components/admin/StatCard';
import ApprovalQueue from '@/components/admin/ApprovalQueue';

interface AdminMetrics {
  dailyGMV: number;
  monthlyGMV: number;
  totalPendingCommissions: number;
  totalAvailableCommissions: number;
  totalPaidCommissions: number;
  tokenLiabilities: number;
  totalAmbassadors: number;
  activeAmbassadors: number;
  totalOrders: number;
  ordersToday: number;
  refundCount: number;
  pendingSettlementCount: number;
}

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [
        dailyOrdersResult,
        monthlyOrdersResult,
        pendingCommResult,
        availCommResult,
        paidCommResult,
        tokenResult,
        totalAmbResult,
        activeAmbResult,
        totalOrdersResult,
        refundResult,
        pendingSettleResult,
        campaignsResult,
      ] = await Promise.all([
        // Daily GMV
        supabase
          .from('orders')
          .select('total')
          .gte('created_at', today)
          .eq('payment_status', 'paid'),

        // Monthly GMV
        supabase
          .from('orders')
          .select('total')
          .gte('created_at', monthStart)
          .eq('payment_status', 'paid'),

        // Pending commissions
        supabase
          .from('commission_events')
          .select('amount')
          .eq('status', 'pending'),

        // Available commissions
        supabase
          .from('commission_events')
          .select('amount')
          .eq('status', 'available'),

        // Paid commissions
        supabase
          .from('commission_events')
          .select('amount')
          .eq('status', 'paid'),

        // Token liabilities (pending + available)
        supabase
          .from('token_events')
          .select('final_tokens')
          .in('status', ['pending', 'available']),

        // Total ambassadors
        supabase
          .from('ambassador_profiles')
          .select('id', { count: 'exact' }),

        // Active ambassadors (hit $300 personal sales)
        supabase
          .from('ambassador_profiles')
          .select('id', { count: 'exact' })
          .eq('is_active', true),

        // Total orders
        supabase
          .from('orders')
          .select('id', { count: 'exact' }),

        // Refund requests
        supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('payment_status', 'refunded'),

        // Pending settlement orders
        supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('settlement_status', 'pending')
          .eq('payment_status', 'paid'),

        // Campaigns
        supabase
          .from('campaigns')
          .select('id, name, status, metrics')
          .eq('status', 'active')
          .limit(3),
      ]);

      const dailyGMV = (dailyOrdersResult.data || []).reduce((s: number, r: any) => s + Number(r.total), 0);
      const monthlyGMV = (monthlyOrdersResult.data || []).reduce((s: number, r: any) => s + Number(r.total), 0);
      const pendingComm = (pendingCommResult.data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      const availComm = (availCommResult.data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      const paidComm = (paidCommResult.data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      const tokenLiabilities = (tokenResult.data || []).reduce((s: number, r: any) => s + Number(r.final_tokens), 0);

      setMetrics({
        dailyGMV,
        monthlyGMV,
        totalPendingCommissions: pendingComm,
        totalAvailableCommissions: availComm,
        totalPaidCommissions: paidComm,
        tokenLiabilities,
        totalAmbassadors: totalAmbResult.count || 0,
        activeAmbassadors: activeAmbResult.count || 0,
        totalOrders: totalOrdersResult.count || 0,
        ordersToday: dailyOrdersResult.data?.length || 0,
        refundCount: refundResult.count || 0,
        pendingSettlementCount: pendingSettleResult.count || 0,
      });

      setCampaigns(campaignsResult.data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
        <p className="text-gray-400">Real-time platform operations, metrics, and alerts</p>
      </div>

      {/* Critical Alerts */}
      {(metrics.refundCount > 0 || metrics.pendingSettlementCount > 0) && (
        <div className="rounded-xl border border-red-500/30 bg-red-900/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-300">Active Alerts</h3>
              <p className="text-sm text-red-200 mt-1">
                {metrics.refundCount > 0 && `${metrics.refundCount} refund requests pending. `}
                {metrics.pendingSettlementCount > 0 && `${metrics.pendingSettlementCount} orders awaiting settlement.`}
              </p>
              <button className="mt-2 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors">
                Review Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          title="Daily GMV"
          value={`$${metrics.dailyGMV.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          trend={0}
          trendLabel={`${metrics.ordersToday} orders today`}
          color="emerald"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Monthly GMV"
          value={metrics.monthlyGMV >= 1000 ? `$${(metrics.monthlyGMV / 1000).toFixed(1)}K` : `$${metrics.monthlyGMV.toFixed(2)}`}
          trend={0}
          trendLabel="this month"
          color="blue"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          title="Ambassadors"
          value={metrics.totalAmbassadors.toLocaleString()}
          trend={0}
          trendLabel={`${metrics.activeAmbassadors} active`}
          color="purple"
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          title="Total Orders"
          value={metrics.totalOrders.toLocaleString()}
          trend={0}
          trendLabel="all time"
          color="orange"
        />
      </div>

      {/* Payouts & Token Liabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-gray-100">Commission Status</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-100">Pending (in 14-day window)</p>
                  <p className="text-xs text-gray-500">Awaiting settlement</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-400">
                ${metrics.totalPendingCommissions.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-100">Available</p>
                  <p className="text-xs text-gray-500">Ready for payout</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                ${metrics.totalAvailableCommissions.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-gray-700/30 pt-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-100">Paid Out (Lifetime)</p>
                  <p className="text-xs text-gray-500">Total distributed</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                ${metrics.totalPaidCommissions >= 1000000
                  ? `${(metrics.totalPaidCommissions / 1000000).toFixed(2)}M`
                  : metrics.totalPaidCommissions >= 1000
                  ? `${(metrics.totalPaidCommissions / 1000).toFixed(1)}K`
                  : metrics.totalPaidCommissions.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-yellow-900/20 p-6">
          <h3 className="mb-4 text-lg font-semibold text-amber-300">Token Liabilities</h3>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Outstanding $FAME Value</p>
              <p className="text-3xl font-bold text-amber-300 mt-1">
                ${(metrics.tokenLiabilities * 0.01).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20">
              <p className="text-xs text-amber-300">
                <span className="font-semibold">{metrics.tokenLiabilities.toLocaleString()}</span> tokens in circulation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ApprovalQueue count={metrics.pendingSettlementCount} />

          {/* Campaign Performance */}
          {campaigns.length > 0 && (
            <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-100">Active Campaigns</h3>
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const m = campaign.metrics || {};
                  const sent = m.sent || 0;
                  const delivered = m.delivered || 0;
                  const clicked = m.clicked || 0;
                  const converted = m.converted || 0;

                  return (
                    <div key={campaign.id} className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-100">{campaign.name}</h4>
                        <span className="text-xs rounded-full bg-green-500/20 px-2.5 py-1 text-green-300 font-medium">
                          Active
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Sent</p>
                          <p className="font-semibold text-gray-200 mt-1">{sent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Delivered</p>
                          <p className="font-semibold text-gray-200 mt-1">
                            {sent > 0 ? `${((delivered / sent) * 100).toFixed(0)}%` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Clicked</p>
                          <p className="font-semibold text-gray-200 mt-1">
                            {delivered > 0 ? `${((clicked / delivered) * 100).toFixed(0)}%` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Converted</p>
                          <p className="font-semibold text-emerald-400 mt-1">{converted}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <NBAWidget maxActions={2} title="Admin Actions" />

          <div className="space-y-3">
            <div className="rounded-xl border border-orange-500/30 bg-orange-900/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-orange-300">Refund Requests</h4>
                <span className="text-2xl font-bold text-orange-400">{metrics.refundCount}</span>
              </div>
              <button className="w-full rounded-lg bg-orange-500/20 py-2 text-xs font-medium text-orange-300 hover:bg-orange-500/30 transition-colors mt-2">
                Process Refunds
              </button>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-300">Pending Settlement</h4>
                <span className="text-2xl font-bold text-blue-400">{metrics.pendingSettlementCount}</span>
              </div>
              <button className="w-full rounded-lg bg-blue-500/20 py-2 text-xs font-medium text-blue-300 hover:bg-blue-500/30 transition-colors mt-2">
                Run Settlement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
