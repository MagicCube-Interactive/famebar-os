'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DataTable, { Column } from '@/components/admin/DataTable';

interface Ambassador {
  id: string;
  name: string;
  email: string;
  tier: number;
  is_active: boolean;
  total_recruits: number;
  total_sales: number;
  kyc_verified: boolean;
  is_founder: boolean;
  created_at: string;
}

export default function AmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAmbassadors = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('ambassador_profiles')
        .select('id, tier, is_active, total_recruits, total_sales, kyc_verified, is_founder, created_at, profiles!ambassador_profiles_id_fkey(full_name, email)')
        .order('total_sales', { ascending: false })
        .limit(200);

      setAmbassadors(
        (data || []).map((a: any) => ({
          id: a.id,
          name: a.profiles?.full_name || '—',
          email: a.profiles?.email || '—',
          tier: a.tier,
          is_active: a.is_active,
          total_recruits: a.total_recruits,
          total_sales: Number(a.total_sales),
          kyc_verified: a.kyc_verified,
          is_founder: a.is_founder,
          created_at: a.created_at?.split('T')[0] || '',
        }))
      );
      setLoading(false);
    };
    fetchAmbassadors();
  }, []);

  const filtered = ambassadors.filter((a) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && a.is_active) ||
      (filter === 'inactive' && !a.is_active) ||
      (filter === 'founder' && a.is_founder) ||
      (filter === 'kyc' && !a.kyc_verified);
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const activeCount = ambassadors.filter(a => a.is_active).length;
  const founderCount = ambassadors.filter(a => a.is_founder).length;
  const kycPending = ambassadors.filter(a => !a.kyc_verified).length;
  const totalSales = ambassadors.reduce((s, a) => s + a.total_sales, 0);

  const columns: Column<Ambassador>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'tier', label: 'Tier', sortable: true, render: (v) => <span className="font-bold text-primary-fixed-dim">T{String(v)}</span> },
    {
      key: 'is_active',
      label: 'Status',
      render: (v) => v
        ? <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs font-semibold">Active</span>
        : <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-500 text-xs font-semibold">Inactive</span>,
    },
    { key: 'total_recruits', label: 'Recruits', sortable: true },
    { key: 'total_sales', label: 'Total Sales', sortable: true, render: (v) => <span className="text-secondary">${Number(v).toLocaleString()}</span> },
    {
      key: 'kyc_verified',
      label: 'KYC',
      render: (v) => v ? <span className="text-secondary text-xs">✓ Verified</span> : <span className="text-error text-xs">Pending</span>,
    },
    {
      key: 'is_founder',
      label: 'Founder',
      render: (v) => v ? <span className="text-primary text-xs">👑 Yes</span> : <span className="text-gray-500 text-xs">—</span>,
    },
    { key: 'created_at', label: 'Joined', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Ambassadors</h1>
        <p className="mt-1 text-gray-500">{ambassadors.length} ambassadors on the platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-primary-fixed-dim mt-1">{ambassadors.length}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-secondary mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Founders</p>
          <p className="text-2xl font-bold text-primary mt-1">{founderCount}</p>
        </div>
        <div className="rounded-xl border border-error/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">KYC Pending</p>
          <p className="text-2xl font-bold text-error mt-1">{kycPending}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email..."
          className="flex-1 min-w-48 px-4 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-on-surface-variant placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'inactive', label: 'Inactive' },
            { key: 'founder', label: 'Founders' },
            { key: 'kyc', label: 'KYC Pending' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filter === key ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-gray-300 hover:bg-surface-container'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
        <p className="text-sm text-gray-500">
          Total Sales Volume: <span className="text-secondary font-bold">${totalSales.toLocaleString()}</span>
        </p>
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
