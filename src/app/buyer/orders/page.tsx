'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import OrderCard from '@/components/buyer/OrderCard';
import { HiOutlineAdjustments } from 'react-icons/hi';
import { PLATFORM_CONFIG } from '@/types';

interface DBOrder {
  id: string;
  ambassador_code: string;
  items: any[];
  total: number;
  payment_status: string;
  settlement_status: string;
  created_at: string;
}

type DisplayStatus = 'pending' | 'settled' | 'shipped' | 'delivered' | 'refunded';

function mapStatus(order: DBOrder): DisplayStatus {
  if (order.payment_status === 'refunded' || order.settlement_status === 'refunded') return 'refunded';
  if (order.settlement_status === 'settled') return 'delivered';
  if (order.payment_status === 'paid') return 'settled';
  return 'pending';
}

export default function OrdersPage() {
  const { user, role } = useAuthContext();
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered' | 'refunded'>('all');

  useEffect(() => {
    if (!user || role !== 'buyer') return;

    const fetchOrders = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('orders')
        .select('id, ambassador_code, items, total, payment_status, settlement_status, created_at')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      setOrders(data || []);
      setLoading(false);
    };

    fetchOrders();
  }, [user, role]);

  if (!user || role !== 'buyer') return null;

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => {
        const status = mapStatus(o);
        if (statusFilter === 'delivered') return status === 'delivered' || status === 'settled';
        return status === statusFilter;
      });

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalTokens = Math.floor(totalSpent * PLATFORM_CONFIG.TOKENS_PER_DOLLAR);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-on-surface mb-2">Order History</h1>
        <p className="text-on-surface-variant">View and manage all your past purchases</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
          <p className="text-xs font-semibold text-gray-500 mb-2">Total Orders</p>
          <p className="text-3xl font-bold text-primary">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
          <p className="text-xs font-semibold text-gray-500 mb-2">Total Spent</p>
          <p className="text-3xl font-bold text-secondary">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
          <p className="text-xs font-semibold text-gray-500 mb-2">Tokens Earned</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-primary">{totalTokens.toLocaleString()}</p>
            <p className="text-xs text-gray-500">$FAME</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <HiOutlineAdjustments className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-semibold text-on-surface-variant">Filter:</span>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'delivered', 'refunded'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container-highest text-gray-300 hover:bg-surface-container-highest/80'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-primary-container border-t-transparent animate-spin" />
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const items: Array<{ name: string; quantity: number; price: number }> =
              Array.isArray(order.items) ? order.items : [];
            return (
              <OrderCard
                key={order.id}
                orderId={order.id.slice(0, 13).toUpperCase()}
                date={order.created_at.split('T')[0]}
                status={mapStatus(order)}
                itemCount={items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) || 1}
                total={Number(order.total)}
                ambassadorCode={order.ambassador_code}
                ambassadorName=""
                items={items.length > 0 ? items : [{ name: 'FameBar Product', quantity: 1, price: Number(order.total) }]}
                onReorder={() => {}}
              />
            );
          })
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-12 text-center">
            <p className="text-on-surface-variant mb-4">You haven't placed any orders yet</p>
            <a href="/buyer/shop" className="text-primary hover:text-primary-fixed-dim font-semibold">
              Start Shopping →
            </a>
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-12 text-center">
            <p className="text-on-surface-variant mb-4">No orders with this status</p>
            <button
              onClick={() => setStatusFilter('all')}
              className="text-primary hover:text-primary-fixed-dim font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Status Guide */}
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h3 className="font-semibold text-on-surface mb-3">Understanding Order Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-primary mb-1">⏳ Pending</p>
            <p className="text-on-surface-variant">Order received, processing payment</p>
          </div>
          <div>
            <p className="font-semibold text-tertiary mb-1">✓ Settled</p>
            <p className="text-on-surface-variant">Payment confirmed — within 14-day window</p>
          </div>
          <div>
            <p className="font-semibold text-secondary mb-1">✓✓ Delivered</p>
            <p className="text-on-surface-variant">Commissions released, tokens available</p>
          </div>
          <div>
            <p className="font-semibold text-error mb-1">↩ Refunded</p>
            <p className="text-on-surface-variant">Order refunded, commissions clawed back</p>
          </div>
        </div>
      </div>
    </div>
  );
}
