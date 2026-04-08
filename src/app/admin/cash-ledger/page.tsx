'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DataTable, { Column } from '@/components/admin/DataTable';

interface CommissionEntry {
  id: string;
  ambassador_name: string;
  order_id: string;
  amount: number;
  tier: number;
  status: string;
  created_at: string;
}

export default function CashLedgerPage() {
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchEntries = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('commission_events')
        .select('id, order_id, amount, tier, status, created_at, ambassador_id, ambassador_profiles!commission_events_ambassador_id_fkey(id, profiles!ambassador_profiles_id_fkey(full_name))')
        .order('created_at', { ascending: false })
        .limit(200);

      setEntries(
        (data || []).map((e: any) => ({
          id: e.id,
          ambassador_name: e.ambassador_profiles?.profiles?.full_name || e.ambassador_id?.slice(0, 8) || '—',
          order_id: e.order_id,
          amount: Number(e.amount),
          tier: e.tier,
          status: e.status,
          created_at: e.created_at?.split('T')[0] || '',
        }))
      );
      setLoading(false);
    };
    fetchEntries();
  }, []);

  const filtered = statusFilter === 'all' ? entries : entries.filter(e => e.status === statusFilter);

  const pendingTotal = entries.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const availableTotal = entries.filter(e => e.status === 'available').reduce((s, e) => s + e.amount, 0);
  const paidTotal = entries.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
  const clawedbackTotal = entries.filter(e => e.status === 'clawedback').reduce((s, e) => s + e.amount, 0);

  const columns: Column<CommissionEntry>[] = [
    { key: 'ambassador_name', label: 'Ambassador', sortable: true },
    { key: 'order_id', label: 'Order', render: (v) => <span className="font-mono text-xs text-gray-400">{String(v).slice(0, 13).toUpperCase()}</span> },
    { key: 'tier', label: 'Tier', render: (v) => <span className="text-amber-300 font-semibold">T{String(v)}</span> },
    { key: 'amount', label: 'Amount', sortable: true, render: (v) => <span className="text-emerald-400 font-semibold">${Number(v).toFixed(2)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (v) => {
        const colors: Record<string, string> = {
          pending: 'bg-amber-500/20 text-amber-300',
          available: 'bg-blue-500/20 text-blue-300',
          paid: 'bg-emerald-500/20 text-emerald-300',
          clawedback: 'bg-red-500/20 text-red-300',
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[String(v)] || 'bg-gray-500/20 text-gray-300'}`}>{String(v)}</span>;
      },
    },
    { key: 'created_at', label: 'Date', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-emerald-400" />
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Cash Ledger</h1>
          <p className="text-gray-400">Commission events across all ambassadors</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">${pendingTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 p-4">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">${availableTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/10 p-4">
          <p className="text-xs text-gray-500">Paid Out</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">${paidTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-900/10 p-4">
          <p className="text-xs text-gray-500">Clawed Back</p>
          <p className="text-2xl font-bold text-red-400 mt-1">${clawedbackTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'available', 'paid', 'clawedback'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              statusFilter === s ? 'bg-amber-500 text-white' : 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <DataTable data={filtered} columns={columns} />
      )}
    </div>
  );
}
