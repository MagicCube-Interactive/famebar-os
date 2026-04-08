'use client';

import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DataTable, { Column } from '@/components/admin/DataTable';

interface Order {
  id: string;
  buyer: string;
  ambassador_code: string;
  total: number;
  payment_status: string;
  settlement_status: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('orders')
        .select('id, ambassador_code, total, payment_status, settlement_status, created_at, buyer_id, profiles!orders_buyer_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);

      setOrders(
        (data || []).map((o: any) => ({
          id: o.id,
          buyer: o.profiles?.full_name || o.buyer_id?.slice(0, 8) || '—',
          ambassador_code: o.ambassador_code,
          total: Number(o.total),
          payment_status: o.payment_status,
          settlement_status: o.settlement_status,
          created_at: o.created_at?.split('T')[0] || '',
        }))
      );
      setLoading(false);
    };
    fetchOrders();
  }, []);

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
    { key: 'id', label: 'Order ID', render: (v) => <span className="font-mono text-xs text-gray-500">{String(v).slice(0, 13).toUpperCase()}</span> },
    { key: 'buyer', label: 'Buyer', sortable: true },
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Orders</h1>
        <p className="mt-1 text-gray-500">All platform orders</p>
      </div>

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
        <DataTable data={filtered} columns={columns} />
      )}
    </div>
  );
}
