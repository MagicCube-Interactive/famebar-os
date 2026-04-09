'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Users, TrendingUp, UserPlus, Copy, Check, Loader2 } from 'lucide-react';

interface Recruit {
  id: string;
  tier: number;
  rank: string;
  is_active: boolean;
  personal_sales_this_month: number;
  total_sales: number;
  total_recruits: number;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    created_at: string;
  };
}

export default function TeamPage() {
  const { user, role } = useAuthContext();
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || role !== 'ambassador') return;

    const fetchTeamData = async () => {
      const supabase = createClient();
      const userId = user.id;

      const [recruitsResult, profileResult] = await Promise.all([
        // Direct recruits: ambassador_profiles where sponsor_id = current user
        supabase
          .from('ambassador_profiles')
          .select('*, profiles!inner(full_name, email, avatar_url, created_at)')
          .eq('sponsor_id', userId)
          .order('created_at', { ascending: false }),

        // Get current ambassador's referral code
        supabase
          .from('ambassador_profiles')
          .select('referral_code')
          .eq('id', userId)
          .single(),
      ]);

      if (recruitsResult.data) {
        setRecruits(recruitsResult.data as Recruit[]);
      }

      if (profileResult.data) {
        setReferralCode(profileResult.data.referral_code);
      }

      setLoading(false);
    };

    fetchTeamData();
  }, [user, role]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || role !== 'ambassador') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Computed stats
  const totalRecruits = recruits.length;
  const activeRecruits = recruits.filter((r) => r.is_active).length;
  const totalTeamSales = recruits.reduce((sum, r) => sum + (r.total_sales || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Your Team</h1>
        <p className="mt-2 text-on-surface-variant">
          Manage and grow your direct recruits
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-tertiary/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Total Recruits</p>
          <p className="mt-2 text-3xl font-bold text-tertiary">{totalRecruits}</p>
          <p className="mt-1 text-xs text-tertiary">direct ambassadors</p>
        </div>
        <div className="rounded-lg border border-secondary/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Active Recruits</p>
          <p className="mt-2 text-3xl font-bold text-secondary">{activeRecruits}</p>
          <p className="mt-1 text-xs text-secondary">
            {totalRecruits > 0
              ? `${Math.round((activeRecruits / totalRecruits) * 100)}% active rate`
              : 'no recruits yet'}
          </p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Total Team Sales</p>
          <p className="mt-2 text-3xl font-bold text-primary-fixed-dim">
            ${totalTeamSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-primary">lifetime from recruits</p>
        </div>
        <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Your Referral Code</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold tracking-wider text-on-surface">
              {referralCode || '---'}
            </p>
            {referralCode && (
              <button
                onClick={handleCopyCode}
                className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
                title="Copy referral code"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-secondary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">share to recruit</p>
        </div>
      </div>

      {/* Invite CTA */}
      <div className="rounded-lg border border-primary/20 bg-surface-container-low p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <UserPlus className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary-fixed-dim" />
            <div>
              <h3 className="font-semibold text-primary">Grow Your Team</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Share your referral code <span className="font-mono font-semibold text-primary">{referralCode}</span> with potential ambassadors. Every recruit you add becomes another revenue stream.
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="whitespace-nowrap rounded-lg bg-gradient-to-r from-primary-container to-primary px-6 py-2.5 font-semibold text-on-primary transition-all duration-200 hover:opacity-90"
          >
            {copied ? 'Copied!' : 'Copy Invite Code'}
          </button>
        </div>
      </div>

      {/* Direct Recruits Table or Empty State */}
      {recruits.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-on-surface-variant/40" />
          <h3 className="mt-4 text-lg font-semibold text-on-surface">
            No Recruits Yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
            You haven't recruited any ambassadors yet. Share your referral code{' '}
            <span className="font-mono font-semibold text-primary">
              {referralCode}
            </span>{' '}
            with friends and colleagues to start building your team and earning
            override commissions on their sales.
          </p>
          <button
            onClick={handleCopyCode}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-container to-primary px-6 py-2.5 font-semibold text-on-primary transition-all duration-200 hover:opacity-90"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Referral Code'}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container-low">
          <div className="border-b border-outline-variant/10 bg-surface-container px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
              <Users className="h-5 w-5 text-primary-fixed-dim" />
              Direct Recruits ({totalRecruits})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container">
                <tr className="border-b border-outline-variant/10">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-on-surface-variant">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-on-surface-variant">
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-on-surface-variant">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-on-surface-variant">
                    Sales (MTD)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-on-surface-variant">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-on-surface-variant">
                    Recruits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-on-surface-variant">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {recruits.map((recruit) => (
                  <tr
                    key={recruit.id}
                    className="border-b border-outline-variant/10 transition-all hover:bg-surface-container-low"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-on-surface">
                        {recruit.profiles?.full_name || 'Unnamed'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-on-surface-variant">
                        {recruit.profiles?.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-primary-fixed-dim/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        L{recruit.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          recruit.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {recruit.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-on-surface">
                        {recruit.personal_sales_this_month > 0
                          ? `$${recruit.personal_sales_this_month.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '\u2014'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-on-surface">
                        ${(recruit.total_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-on-surface">
                        {recruit.total_recruits || 0}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-on-surface-variant">
                        {new Date(recruit.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
