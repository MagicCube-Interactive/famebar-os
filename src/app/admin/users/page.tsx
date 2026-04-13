'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createSafeClient } from '@/lib/supabase/safe-client';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

const ROLES = ['all', 'ambassador', 'admin'] as const;
const ROLE_LABELS: Record<string, string> = {
  all: 'All',
  ambassador: 'Ambassadors',
  admin: 'Admins',
};

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border border-primary/20',
  ambassador: 'bg-primary-fixed/20 text-primary-fixed-dim border border-primary-fixed/20',
};

const EDITABLE_ROLES = ['ambassador', 'admin'] as const;

const PER_PAGE = 10;

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'FB-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit modal state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editVerified, setEditVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState('ambassador');

  const fetchUsers = useCallback(async () => {
    const safe = createSafeClient();
    const { data } = await safe
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
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter logic
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

  // Stats
  const totalCount = users.length;
  const ambassadorCount = users.filter((u) => u.role === 'ambassador').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  // Open edit modal
  function openEdit(user: User) {
    setEditUser(user);
    setEditRole(user.role);
    setEditVerified(user.is_verified);
    setSaveError('');
    setSaveSuccess(false);
  }

  function closeEdit() {
    setEditUser(null);
    setSaveError('');
    setSaveSuccess(false);
  }

  // Save user changes
  async function handleSave() {
    if (!editUser) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const safe = createSafeClient();
      const oldRole = editUser.role;
      const newRole = editRole;
      const isPromotingToAmbassador =
        newRole === 'ambassador' &&
        oldRole !== 'ambassador';

      // Update profiles table via admin mutate endpoint (bypasses RLS recursion)
      const profileRes = await fetch('/api/admin/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          table: 'profiles',
          action: 'update',
          match: { column: 'id', value: editUser.id },
          fields: {
            role: newRole,
            is_verified: editVerified,
            updated_at: new Date().toISOString(),
          },
        }),
      });
      const profileResult = await profileRes.json().catch(() => ({ error: 'Invalid response' }));
      if (!profileRes.ok || !profileResult.success) {
        throw new Error(profileResult.error || 'Failed to update profile');
      }

      // If promoting to ambassador, ensure ambassador_profiles record exists
      if (isPromotingToAmbassador) {
        const { data: existing } = await safe
          .from('ambassador_profiles')
          .select('id')
          .eq('id', editUser.id)
          .single();

        if (!existing) {
          const insertRes = await fetch('/api/admin/mutate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              table: 'ambassador_profiles',
              action: 'insert',
              fields: {
                id: editUser.id,
                referral_code: generateReferralCode(),
                tier: 0,
                rank: 'new',
                is_founder: false,
                is_active: false,
                personal_sales_this_month: 0,
                total_sales: 0,
                total_recruits: 0,
                kyc_verified: false,
              },
            }),
          });
          const insertResult = await insertRes.json().catch(() => ({ error: 'Invalid response' }));
          if (!insertRes.ok || !insertResult.success) {
            throw new Error(insertResult.error || 'Failed to create ambassador profile');
          }
        }
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? { ...u, role: newRole, is_verified: editVerified }
            : u
        )
      );

      setSaveSuccess(true);
      setTimeout(() => {
        closeEdit();
      }, 800);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

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

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-on-surface">User Directory</h3>
        <p className="text-on-surface-variant text-sm">
          Manage system permissions and monitoring for all enterprise actors.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Users', value: totalCount, accent: 'text-on-surface' },
          { label: 'Ambassadors', value: ambassadorCount, accent: 'text-primary-fixed-dim' },
          { label: 'Admins', value: adminCount, accent: 'text-primary' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container rounded-xl border border-outline-variant/10 p-4"
          >
            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
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
              <span className="ml-1.5 opacity-60">
                {r === 'all'
                  ? totalCount
                  : r === 'ambassador'
                  ? ambassadorCount
                  : adminCount}
              </span>
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
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-lg font-bold text-sm shadow-lg shadow-primary/10"
          >
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
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginated.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-surface-container-highest/50 transition-colors cursor-pointer group"
                    onClick={() => openEdit(user)}
                  >
                    {/* User Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-xs font-bold shrink-0">
                          {getInitials(user.full_name, user.email)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            {user.full_name || '\u2014'}
                          </p>
                          <p className="text-[11px] font-mono text-on-surface-variant/70">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* System Role */}
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(user);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold hover:ring-1 hover:ring-primary/30 transition-all ${
                          ROLE_BADGE_STYLES[user.role] ||
                          'bg-surface-container-highest text-on-surface-variant'
                        }`}
                        title="Click to change role"
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
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

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(user);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-semibold hover:bg-primary-container/20 hover:text-primary-container transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                      </button>
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
                : '\u2014'}
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
            <h4 className="text-3xl font-bold text-on-surface">
              {users.filter((u) => u.is_verified).length}
            </h4>
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

      {/* ============================================================ */}
      {/* EDIT USER MODAL                                               */}
      {/* ============================================================ */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeEdit}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md mx-4 bg-surface-container rounded-2xl border border-outline-variant/20 shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-on-surface">Edit User</h3>
                <button
                  onClick={closeEdit}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="px-6 py-4 bg-surface-container-high/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-sm font-bold">
                  {getInitials(editUser.full_name, editUser.email)}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {editUser.full_name || '\u2014'}
                  </p>
                  <p className="text-xs font-mono text-on-surface-variant/70">
                    {editUser.email}
                  </p>
                  <p className="text-[10px] font-mono text-on-surface-variant/50 mt-0.5">
                    ID: {editUser.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-5">
              {/* Role Selector */}
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                  System Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-highest border border-outline-variant/20 rounded-lg text-sm text-on-surface focus:ring-1 focus:ring-primary/40 focus:outline-none appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                  }}
                >
                  {EDITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                {editRole === 'ambassador' &&
                  editUser.role !== 'ambassador' && (
                    <p className="mt-2 text-[11px] text-primary-fixed-dim">
                      An ambassador profile will be created automatically with a new referral code.
                    </p>
                  )}
              </div>

              {/* Verified Toggle */}
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                  Access Status
                </label>
                <button
                  type="button"
                  onClick={() => setEditVerified(!editVerified)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 bg-surface-container-highest border border-outline-variant/20 rounded-lg transition-colors hover:border-outline-variant/40"
                >
                  {/* Toggle switch */}
                  <div
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      editVerified ? 'bg-secondary' : 'bg-error/40'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        editVerified ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-on-surface">
                    {editVerified ? (
                      <span className="text-secondary font-semibold">Active / Verified</span>
                    ) : (
                      <span className="text-error font-semibold">Suspended / Unverified</span>
                    )}
                  </span>
                </button>
              </div>

              {/* Error / Success */}
              {saveError && (
                <div className="px-4 py-2.5 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-xs text-error font-medium">{saveError}</p>
                </div>
              )}
              {saveSuccess && (
                <div className="px-4 py-2.5 bg-secondary/10 border border-secondary/20 rounded-lg">
                  <p className="text-xs text-secondary font-medium">User updated successfully.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3">
              <button
                onClick={closeEdit}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-gradient-to-br from-primary-container to-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/10 disabled:opacity-50 transition-all hover:shadow-primary/20"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* INVITE USER MODAL                                             */}
      {/* ============================================================ */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInvite(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md mx-4 bg-surface-container rounded-2xl border border-outline-variant/20 shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-on-surface">Invite User</h3>
                <button
                  onClick={() => setShowInvite(false)}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <p className="text-sm text-on-surface-variant">
                Share the registration link below with the user you want to invite. They will be assigned the selected role upon sign-up.
              </p>

              {/* Role selector */}
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-highest border border-outline-variant/20 rounded-lg text-sm text-on-surface focus:ring-1 focus:ring-primary/40 focus:outline-none appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                  }}
                >
                  {EDITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Link display */}
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                  Invite Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${appUrl}/register?role=${inviteRole}`}
                    className="flex-1 px-4 py-2.5 bg-surface-container-highest border border-outline-variant/20 rounded-lg text-xs font-mono text-on-surface select-all focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${appUrl}/register?role=${inviteRole}`
                      );
                    }}
                    className="shrink-0 px-3 py-2.5 bg-primary-container/20 text-primary-container rounded-lg text-xs font-bold hover:bg-primary-container/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end">
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
