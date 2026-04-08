'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DataTable, { Column } from '@/components/admin/DataTable';

interface Campaign {
  id: string;
  name: string;
  status: string;
  channel: string | null;
  sent: number;
  delivered: number;
  clicked: number;
  converted: number;
  start_date: string | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchCampaigns = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('campaigns')
        .select('id, name, status, channel, metrics, start_date, created_at')
        .order('created_at', { ascending: false });

      setCampaigns(
        (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          channel: c.channel || '—',
          sent: c.metrics?.sent || 0,
          delivered: c.metrics?.delivered || 0,
          clicked: c.metrics?.clicked || 0,
          converted: c.metrics?.converted || 0,
          start_date: c.start_date?.split('T')[0] || c.created_at?.split('T')[0] || '',
        }))
      );
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  const filtered = statusFilter === 'all' ? campaigns : campaigns.filter(c => c.status === statusFilter);

  const totalConverted = campaigns.reduce((s, c) => s + c.converted, 0);
  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
  const activeCount = campaigns.filter(c => c.status === 'active').length;

  const columns: Column<Campaign>[] = [
    { key: 'name', label: 'Campaign', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (v) => {
        const colors: Record<string, string> = {
          active: 'bg-secondary/20 text-secondary',
          draft: 'bg-gray-500/20 text-on-surface-variant',
          paused: 'bg-primary-fixed-dim/20 text-primary-fixed-dim',
          completed: 'bg-tertiary/20 text-tertiary',
          archived: 'bg-gray-600/20 text-gray-500',
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[String(v)] || 'bg-gray-500/20 text-on-surface-variant'}`}>{String(v)}</span>;
      },
    },
    { key: 'channel', label: 'Channel', render: (v) => <span className="capitalize">{String(v)}</span> },
    { key: 'sent', label: 'Sent', sortable: true, render: (v) => Number(v).toLocaleString() },
    {
      key: 'delivered',
      label: 'Delivery %',
      render: (v, row) => {
        const r = row as Campaign;
        return r.sent > 0 ? `${((r.delivered / r.sent) * 100).toFixed(0)}%` : '—';
      },
    },
    {
      key: 'clicked',
      label: 'CTR',
      render: (v, row) => {
        const r = row as Campaign;
        return r.delivered > 0 ? `${((r.clicked / r.delivered) * 100).toFixed(1)}%` : '—';
      },
    },
    { key: 'converted', label: 'Converted', sortable: true, render: (v) => <span className="text-secondary font-bold">{Number(v)}</span> },
    { key: 'start_date', label: 'Started', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Campaigns</h1>
          <p className="mt-1 text-gray-500">Marketing campaigns and performance</p>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-primary-container to-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90 transition-all">
          + New Campaign
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Active Campaigns</p>
          <p className="text-2xl font-bold text-secondary mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Total Sent</p>
          <p className="text-2xl font-bold text-primary-fixed-dim mt-1">{totalSent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Total Converted</p>
          <p className="text-2xl font-bold text-tertiary mt-1">{totalConverted}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'active', 'draft', 'paused', 'completed'].map((s) => (
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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-12 text-center">
          <p className="text-gray-500">No campaigns yet. Create your first one!</p>
        </div>
      ) : (
        <DataTable data={filtered} columns={columns} />
      )}
    </div>
  );
}
