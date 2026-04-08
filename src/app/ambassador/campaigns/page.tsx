'use client';

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { isAmbassador } from '@/types';
import { Megaphone, TrendingUp, Users, Zap } from 'lucide-react';

export default function CampaignsPage() {
  const { userProfile } = useAuthContext();

  if (!userProfile || !isAmbassador(userProfile)) {
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
        <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-4">
          <p className="text-xs text-gray-500">Active Campaigns</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">
            {campaigns.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-xs text-gray-500">Total Uses</p>
          <p className="mt-2 text-2xl font-bold text-amber-400">
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
                ? 'border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-yellow-950/20'
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
                    <p className="mt-1 text-lg font-bold text-amber-400">{campaign.uses}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Conversions</p>
                    <p className="mt-1 text-lg font-bold text-emerald-400">{campaign.conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Earnings</p>
                    <p className="mt-1 text-lg font-bold text-yellow-400">
                      ${campaign.earnings.toFixed(2)}
                    </p>
                  </div>
                </div>

                <button className="w-full rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition-all duration-200 hover:bg-amber-500/20">
                  View Campaign Code
                </button>
              </>
            )}

            {campaign.status === 'planning' && (
              <button className="w-full rounded-lg border border-gray-600 bg-gray-700/30 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-all duration-200 hover:bg-gray-600/30">
                Get Notified When Live
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Campaign Tips */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-6">
        <h3 className="mb-3 font-semibold text-blue-300">Campaign Tips</h3>
        <ul className="space-y-2 text-sm text-blue-200">
          <li>✓ Join campaigns that match your audience for higher conversions</li>
          <li>✓ Use campaign codes alongside your primary code for tracking</li>
          <li>✓ Share campaign-specific content for 2-3x engagement boost</li>
          <li>✓ Check campaign metrics weekly to optimize your strategy</li>
          <li>✓ Top performers get featured in the ambassador spotlight</li>
        </ul>
      </div>
    </div>
  );
}
