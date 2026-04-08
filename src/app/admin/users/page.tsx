'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

const ROLES = ['all', 'buyer', 'ambassador', 'leader', 'admin'] as const;
const ROLE_LABELS: Record<string, string> = {
  all: 'All',
  buyer: 'Buyers',
  ambassador: 'Ambassadors',
  leader: 'Leaders',
  admin: 'Admins',
};

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border border-primary/20',
  leader: 'bg-tertiary-container/20 text-tertiary border border-tertiary/20',
  ambassador: 'bg-primary-fixed/20 text-primary-fixed-dim border border-primary-fixed/20',
  buyer: 'bg-on-tertiary-fixed-variant/20 text-on-surface-variant border border-on-surface-variant/20',
};

const PER_PAGE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const activeCount = users.filter((u) => u.is_verified).length;

  function formatDate(dateStr: string) {
    return dateStr.replace(/-/g, '.');
  }

  function getInitials(name: string | null, email: string) {
    if (name) {
      return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  }

  function getPaginationRange(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-on-surface">User Directory</h3>
        <p className="text-on-surface-variant text-sm">
          Manage system permissions and monitoring for all enterprise actors.
        </p>
      </div>

      {/* Controls Panel */}
      <div className="bg-surface-container-low rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                roleFilter === r
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-highest text-on-surface font-medium hover:bg-surface-variant'
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search system actors..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border-none rounded-lg text-sm text-on-surface focus:ring-1 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-lg font-bold text-sm shadow-lg shadow-primary/10">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invite User
          </button>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-surface-container rounded-xl overflow-hidden shadow-2xl shadow-black/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high">
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-wider">
                  User Identity
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-wider">
                  System Role
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-wider">
                  Access Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-wider">
                  Join Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginated.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-surface-container-highest/50 transition-colors cursor-pointer group"
                  >
                    {/* User Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-xs font-bold shrink-0">
                          {getInitials(user.full_name, user.email)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            {user.full_name || '—'}
                          </p>
                          <p className="text-[11px] font-mono text-on-surface-variant/70">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* System Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ROLE_BADGE_STYLES[user.role] ||
                          'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>

                    {/* Access Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.is_verified ? (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary-fixed shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
                            <span className="text-xs font-medium text-secondary">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.6)]" />
                            <span className="text-xs font-medium text-error">Suspended</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Join Date */}
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-on-surface-variant">
                        {formatDate(user.created_at)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="bg-surface-container-high px-6 py-4 flex items-center justify-between border-t border-outline-variant/10">
            <p className="text-[10px] font-mono text-on-surface-variant uppercase">
              Displaying {paginated.length} of {filtered.length.toLocaleString()} Actors
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-1">
                {getPaginationRange().map((page, i) =>
                  page === '...' ? (
                    <span key={`dots-${i}`} className="text-on-surface-variant/50 text-xs px-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-on-primary font-bold'
                          : 'text-on-surface-variant hover:bg-surface-variant cursor-pointer'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Metrics (Small Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Growth Index */}
        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-primary-fixed-dim uppercase tracking-tighter mb-1">
              Growth Index
            </p>
            <h4 className="text-3xl font-bold text-on-surface">
              {users.length > 0
                ? `${((users.filter((u) => {
                    const d = new Date(u.created_at);
                    const now = new Date();
                    return (
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear()
                    );
                  }).length /
                    Math.max(users.length, 1)) *
                    100
                  ).toFixed(1)}%`
                : '—'}
            </h4>
            <div className="mt-4 flex items-center gap-2 text-secondary text-xs font-bold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{users.length} users total</span>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-primary-fixed-dim uppercase tracking-tighter mb-1">
              Active Now
            </p>
            <h4 className="text-3xl font-bold text-on-surface">{activeCount}</h4>
            <div className="mt-4 flex items-center gap-2 text-on-surface-variant text-xs font-medium">
              <div className="flex -space-x-2">
                <div className="w-5 h-5 rounded-full border-2 border-surface-container-low bg-surface-container-highest" />
                <div className="w-5 h-5 rounded-full border-2 border-surface-container-low bg-surface-container-highest" />
                <div className="w-5 h-5 rounded-full border-2 border-surface-container-low bg-surface-container-highest" />
              </div>
              <span>Direct system connection</span>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-primary-fixed-dim uppercase tracking-tighter mb-1">
              Security Audit
            </p>
            <h4 className="text-3xl font-bold text-on-surface">Secure</h4>
            <div className="mt-4 flex items-center gap-2 text-on-surface-variant text-xs font-medium">
              <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>All actors verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
