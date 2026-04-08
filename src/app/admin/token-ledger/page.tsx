'use client';

import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DataTable, { Column } from '@/components/admin/DataTable';

interface TokenEvent {
  id: string;
  ambassador_name: string;
  order_id: string | null;
  tokens_earned: number;
  founder_multiplier: number;
  final_tokens: number;
  status: string;
  created_at: string;
}

export default function TokenLedgerPage() {
  const [events, setEvents] = useState<TokenEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('token_events')
        .select('id, order_id, tokens_earned, founder_multiplier, final_tokens, status, created_at, ambassador_id, ambassador_profiles!token_events_ambassador_id_fkey(id, profiles!ambassador_profiles_id_fkey(full_name))')
        .order('created_at', { ascending: false })
        .limit(200);

      setEvents(
        (data || []).map((e: any) => ({
          id: e.id,
          ambassador_name: e.ambassador_profiles?.profiles?.full_name || e.ambassador_id?.slice(0, 8) || '—',
          order_id: e.order_id,
          tokens_earned: Number(e.tokens_earned),
          founder_multiplier: Number(e.founder_multiplier),
          final_tokens: Number(e.final_tokens),
          status: e.status,
          created_at: e.created_at?.split('T')[0] || '',
        }))
      );
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filtered = statusFilter === 'all' ? events : events.filter(e => e.status === statusFilter);

  const pendingTokens = events.filter(e => e.status === 'pending').reduce((s, e) => s + e.final_tokens, 0);
  const availableTokens = events.filter(e => e.status === 'available').reduce((s, e) => s + e.final_tokens, 0);
  const spentTokens = events.filter(e => e.status === 'spent').reduce((s, e) => s + e.final_tokens, 0);
  const totalLiability = (pendingTokens + availableTokens) * 0.01;

  const columns: Column<TokenEvent>[] = [
    { key: 'ambassador_name', label: 'Ambassador', sortable: true },
    { key: 'order_id', label: 'Order', render: (v) => v ? <span className="font-mono text-xs text-gray-500">{String(v).slice(0, 13).toUpperCase()}</span> : <span className="text-gray-500">—</span> },
    { key: 'tokens_earned', label: 'Base Tokens', sortable: true, render: (v) => Number(v).toLocaleString() },
    {
      key: 'founder_multiplier',
      label: 'Multiplier',
      render: (v) => Number(v) > 1
        ? <span className="text-primary font-semibold">{Number(v)}x 👑</span>
        : <span className="text-gray-500">{Number(v)}x</span>,
    },
    { key: 'final_tokens', label: 'Final Tokens', sortable: true, render: (v) => <span className="text-primary font-bold">{Number(v).toLocaleString()}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (v) => {
        const colors: Record<string, string> = {
          pending: 'bg-primary-fixed-dim/20 text-primary-fixed-dim',
          available: 'bg-tertiary/20 text-tertiary',
          spent: 'bg-gray-500/20 text-on-surface-variant',
          clawedback: 'bg-error/20 text-error',
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[String(v)] || 'bg-gray-500/20 text-on-surface-variant'}`}>{String(v)}</span>;
      },
    },
    { key: 'created_at', label: 'Date', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Token Ledger</h1>
          <p className="text-gray-500">$FAME token events and liability tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-primary/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Pending Tokens</p>
          <p className="text-2xl font-bold text-primary mt-1">{pendingTokens.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-tertiary/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Available Tokens</p>
          <p className="text-2xl font-bold text-tertiary mt-1">{availableTokens.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Spent Tokens</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{spentTokens.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Liability ($)</p>
          <p className="text-2xl font-bold text-primary mt-1">${totalLiability.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'available', 'spent', 'clawedback'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              statusFilter === s ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-gray-300 hover:bg-surface-container'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
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
