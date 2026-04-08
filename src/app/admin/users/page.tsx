'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DataTable, { Column } from '@/components/admin/DataTable';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, is_verified, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      setUsers(
        (data || []).map((u: any) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          is_verified: u.is_verified,
          created_at: u.created_at?.split('T')[0] || '',
        }))
      );
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch =
      !search ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const columns: Column<User>[] = [
    { key: 'full_name', label: 'Name', sortable: true, render: (v) => String(v || '—') },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      render: (v) => {
        const colors: Record<string, string> = {
          admin: 'bg-red-500/20 text-red-300',
          leader: 'bg-purple-500/20 text-purple-300',
          ambassador: 'bg-amber-500/20 text-amber-300',
          buyer: 'bg-blue-500/20 text-blue-300',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[String(v)] || 'bg-gray-500/20 text-gray-300'}`}>
            {String(v)}
          </span>
        );
      },
    },
    {
      key: 'is_verified',
      label: 'Verified',
      render: (v) => v ? <span className="text-emerald-400 text-xs font-semibold">✓ Yes</span> : <span className="text-gray-500 text-xs">No</span>,
    },
    { key: 'created_at', label: 'Joined', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Users</h1>
        <p className="mt-1 text-gray-400">All platform users — {users.length} total</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['buyer', 'ambassador', 'leader', 'admin'].map((role) => (
          <div key={role} className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
            <p className="text-xs text-gray-500 capitalize">{role}s</p>
            <p className="text-2xl font-bold text-amber-300 mt-1">{roleCounts[role] || 0}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email..."
          className="flex-1 min-w-48 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <div className="flex gap-2">
          {['all', 'buyer', 'ambassador', 'leader', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                roleFilter === r ? 'bg-amber-500 text-white' : 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
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
