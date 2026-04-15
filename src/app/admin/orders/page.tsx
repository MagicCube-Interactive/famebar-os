'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import { createSafeClient } from '@/lib/supabase/safe-client';
import DataTable, { Column } from '@/components/admin/DataTable';

interface Order {
  id: string;
  buyer: string;
  ambassador_code: string;
  order_type: string;
  total: number;
  payment_status: string;
  settlement_status: string;
  created_at: string;
  _actions: string;
}

interface RefundTarget {
  order: Order;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Refund modal state
  const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');

  // Success/error banner
  const [successMessage, setSuccessMessage] = useState('');
  const [bannerError, setBannerError] = useState('');

  // Expanded row for order detail
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const safe = createSafeClient();
    const { data } = await safe
      .from('orders')
      .select('id, ambassador_code, order_type, total, payment_status, settlement_status, created_at, buyer_id, profiles!orders_buyer_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    setOrders(
      (data || []).map((o: any) => ({
        id: o.id,
        buyer: o.profiles?.full_name || o.buyer_id?.slice(0, 8) || '—',
        ambassador_code: o.ambassador_code,
        order_type: o.order_type || 'retail',
        total: Number(o.total),
        payment_status: o.payment_status,
        settlement_status: o.settlement_status,
        created_at: o.created_at?.split('T')[0] || '',
        _actions: '',
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-dismiss banners
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (bannerError) {
      const timer = setTimeout(() => setBannerError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [bannerError]);

  const canRefund = (o: Order) =>
    o.payment_status === 'paid' && o.settlement_status !== 'clawedback';

  const openRefundModal = (order: Order) => {
    setRefundTarget({ order });
    setRefundReason('');
    setRefundError('');
  };

  const closeRefundModal = () => {
    if (refundLoading) return;
    setRefundTarget(null);
    setRefundReason('');
    setRefundError('');
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefundLoading(true);
    setRefundError('');

    try {
      const res = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundTarget.order.id,
          ...(refundReason.trim() && { reason: refundReason.trim() }),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setRefundError(data.error || 'Refund failed');
        setRefundLoading(false);
        return;
      }

      const msg = `Refund processed for order ${refundTarget.order.id.slice(0, 8).toUpperCase()}. Commission clawed back: $${data.commissionClawedBack.toFixed(2)}, Tokens clawed back: ${data.tokensClawedBack}`;
      setRefundLoading(false);
      setRefundTarget(null);
      setRefundReason('');
      setRefundError('');
      setSuccessMessage(msg);
      await fetchOrders();
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : 'Network error');
      setRefundLoading(false);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.buyer.toLowerCase().includes(search.toLowerCase()) ||
      o.ambassador_code.toLowerCase().includes(search.toLowerCase()) ||
      o.id.includes(search);
    const matchStatus =
      statusFilter === 'all' || o.payment_status === statusFilter || o.settlement_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalGMV = orders.reduce((s, o) => s + o.total, 0);
  const paidCount = orders.filter(o => o.payment_status === 'paid').length;
  const refundedCount = orders.filter(o => o.payment_status === 'refunded').length;
  const pendingCount = orders.filter(o => o.payment_status === 'pending').length;

  const columns: Column<Order>[] = [
    {
      key: 'id',
      label: 'Order ID',
      render: (v) => {
        const isExpanded = expandedOrderId === String(v);
        return (
          <span className="flex items-center gap-1.5">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            )}
            <span className="font-mono text-xs text-gray-500">{String(v).slice(0, 13).toUpperCase()}</span>
          </span>
        );
      },
    },
    { key: 'buyer', label: 'Buyer', sortable: true },
    {
      key: 'order_type',
      label: 'Type',
      render: (v) => (
        <span className="capitalize text-on-surface-variant">
          {String(v).replace(/_/g, ' ')}
        </span>
      ),
    },
    { key: 'ambassador_code', label: 'Ambassador Code', render: (v) => <span className="font-mono text-primary-fixed-dim">{String(v)}</span> },
    { key: 'total', label: 'Total', sortable: true, render: (v) => <span className="text-secondary font-semibold">${Number(v).toFixed(2)}</span> },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (v) => {
        const colors: Record<string, string> = { paid: 'text-secondary', pending: 'text-primary', refunded: 'text-error', failed: 'text-error' };
        return <span className={`capitalize font-semibold ${colors[String(v)] || 'text-gray-500'}`}>{String(v)}</span>;
      },
    },
    {
      key: 'settlement_status',
      label: 'Settlement',
      render: (v) => {
        const colors: Record<string, string> = { settled: 'text-secondary', pending: 'text-primary', refunded: 'text-error', clawedback: 'text-error' };
        return <span className={`capitalize ${colors[String(v)] || 'text-gray-500'}`}>{String(v)}</span>;
      },
    },
    { key: 'created_at', label: 'Date', sortable: true },
    {
      key: '_actions',
      label: 'Actions',
      render: (_v, row) => {
        if (!canRefund(row)) return null;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openRefundModal(row);
            }}
            className="bg-error/10 text-error hover:bg-error/20 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
          >
            Refund
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Orders</h1>
        <p className="mt-1 text-gray-500">All platform orders</p>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="bg-secondary/10 text-secondary border border-secondary/30 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-2 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error banner */}
      {bannerError && (
        <div className="bg-error/10 text-error border border-error/30 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm">{bannerError}</span>
          <button onClick={() => setBannerError('')} className="ml-2 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Total GMV</p>
          <p className="text-2xl font-bold text-secondary mt-1">${totalGMV.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-tertiary mt-1">{paidCount}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-primary mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Refunded</p>
          <p className="text-2xl font-bold text-error mt-1">{refundedCount}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buyer, ambassador, order ID..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-on-surface-variant placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'pending', 'refunded'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                statusFilter === s ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-gray-300 hover:bg-surface-container'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <DataTable
            data={filtered}
            columns={columns}
            onRowClick={(row) => toggleExpand(row.id)}
          />

          {/* Expanded order detail */}
          {expandedOrderId && (
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5 -mt-2">
              {(() => {
                const order = orders.find((o) => o.id === expandedOrderId);
                if (!order) return <p className="text-sm text-gray-500">Order not found</p>;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-on-surface">
                        Order Details
                      </h3>
                      <button
                        onClick={() => setExpandedOrderId(null)}
                        className="text-gray-500 hover:text-on-surface-variant transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <DetailField label="Order ID" value={order.id} mono />
                      <DetailField label="Buyer" value={order.buyer} />
                      <DetailField label="Ambassador Code" value={order.ambassador_code} mono />
                      <DetailField label="Total" value={`$${order.total.toFixed(2)}`} />
                      <DetailField label="Payment Status" value={order.payment_status} />
                      <DetailField label="Settlement Status" value={order.settlement_status} />
                      <DetailField label="Date" value={order.created_at} />
                    </div>
                    {canRefund(order) && (
                      <div className="pt-2 border-t border-outline-variant/10">
                        <button
                          onClick={() => openRefundModal(order)}
                          className="bg-error/10 text-error hover:bg-error/20 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
                        >
                          Process Refund
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* Refund confirmation modal */}
      {refundTarget && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          onClick={closeRefundModal}
        >
          <div
            className="bg-surface-container-high rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Confirm Refund</h2>
              <button
                onClick={closeRefundModal}
                disabled={refundLoading}
                className="text-gray-500 hover:text-on-surface-variant transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-outline-variant/10 bg-surface-container p-3 space-y-1">
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="font-mono text-sm text-on-surface">
                  {refundTarget.order.id.toUpperCase()}
                </p>
                <p className="text-xs text-gray-500 mt-2">Amount</p>
                <p className="text-lg font-bold text-secondary">
                  ${refundTarget.order.total.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter refund reason..."
                  disabled={refundLoading}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2 text-on-surface text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>

              {refundError && (
                <div className="bg-error/10 text-error border border-error/30 rounded-lg p-3 text-sm">
                  {refundError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={closeRefundModal}
                  disabled={refundLoading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-on-surface-variant bg-surface-container hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refundLoading}
                  className="bg-error text-white font-bold rounded-lg px-4 py-2 text-sm hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {refundLoading && (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  {refundLoading ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm text-on-surface-variant mt-0.5 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
