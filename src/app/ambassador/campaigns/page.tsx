'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { canViewAmbassadorPages } from '@/types';

export default function CampaignsPage() {
  const { userProfile } = useAuthContext();

  if (!userProfile || !canViewAmbassadorPages(userProfile)) {
    return null;
  }

  const campaigns = [
    {
      id: 1,
      name: 'Spring Promo 2024',
      status: 'active',
      startDate: '2024-03-15',
      endDate: '2024-05-15',
      uses: 34,
      conversions: 8,
      earnings: 1250.50,
    },
    {
      id: 2,
      name: 'College Initiative',
      status: 'active',
      startDate: '2024-02-01',
      endDate: '2024-08-31',
      uses: 18,
      conversions: 4,
      earnings: 680.00,
    },
    {
      id: 3,
      name: 'Summer Blast',
      status: 'planning',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      uses: 0,
      conversions: 0,
      earnings: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Campaigns</h1>
        <p className="mt-2 text-gray-400">Participate in promotional campaigns and earn bonuses</p>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-4">
          <p className="text-xs text-gray-500">Active Campaigns</p>
          <p className="mt-2 text-2xl font-bold text-cyan-400">
            {campaigns.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/20 p-4">
          <p className="text-xs text-gray-500">Total Uses</p>
          <p className="mt-2 text-2xl font-bold text-fuchsia-400">
            {campaigns.reduce((sum, c) => sum + c.uses, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="text-xs text-gray-500">Campaign Earnings</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            ${campaigns.reduce((sum, c) => sum + c.earnings, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={`rounded-lg border p-6 transition-all duration-200 ${
              campaign.status === 'active'
                ? 'border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/20 to-purple-950/20'
                : 'border-gray-700/50 bg-gray-800/30'
            }`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-100">{campaign.name}</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {campaign.startDate} to {campaign.endDate}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  campaign.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-gray-700/50 text-gray-300'
                }`}
              >
                {campaign.status === 'active' ? 'Active' : 'Planning'}
              </span>
            </div>

            {campaign.status === 'active' && (
              <>
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Code Uses</p>
                    <p className="mt-1 text-lg font-bold text-fuchsia-400">{campaign.uses}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Conversions</p>
                    <p className="mt-1 text-lg font-bold text-emerald-400">{campaign.conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Earnings</p>
                    <p className="mt-1 text-lg font-bold text-fuchsia-400">
                      ${campaign.earnings.toFixed(2)}
                    </p>
                  </div>
                </div>

                <Link href="/ambassador/share" className="block w-full rounded-lg border border-fuchsia-500/50 bg-fuchsia-500/10 px-4 py-2.5 text-center text-sm font-semibold text-fuchsia-300 transition-all duration-200 hover:bg-fuchsia-500/20">
                  Open Share Hub
                </Link>
              </>
            )}

            {campaign.status === 'planning' && (
              <Link href="/ambassador/events" className="block w-full rounded-lg border border-gray-600 bg-gray-700/30 px-4 py-2.5 text-center text-sm font-semibold text-gray-300 transition-all duration-200 hover:bg-gray-600/30">
                Track Launch Updates
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Campaign Tips */}
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-6">
        <h3 className="mb-3 font-semibold text-cyan-300">Campaign Tips</h3>
        <ul className="space-y-2 text-sm text-cyan-200">
          <li>✓ Join campaigns that match your audience for higher conversions</li>
          <li>✓ Use campaign codes alongside your primary code for tracking</li>
          <li>✓ Share campaign-specific content for 2-3x engagement boost</li>
          <li>✓ Check campaign metrics weekly to optimize your strategy</li>
          <li>✓ Top performers get featured in the ambassador spotlight</li>
        </ul>
        <p className="mt-4 text-xs text-cyan-200/80">
          Campaign-specific codes are not live yet, so active campaigns currently route you back to your main Share Hub.
        </p>
      </div>
    </div>
  );
}
