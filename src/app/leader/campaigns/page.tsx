'use client';

import React from 'react';
import { Megaphone, TrendingUp, Users } from 'lucide-react';

export default function CampaignsPage() {
  const campaigns = [
    {
      id: '1',
      name: 'Spring Launch 2024',
      status: 'active',
      participants: 42,
      revenue: 15240,
      roi: 2.4,
    },
    {
      id: '2',
      name: 'Referral Bonus',
      status: 'active',
      participants: 28,
      revenue: 8920,
      roi: 3.1,
    },
    {
      id: '3',
      name: 'Winter Sale',
      status: 'completed',
      participants: 35,
      revenue: 12500,
      roi: 1.8,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Campaigns</h1>
        <p className="text-gray-400">Manage campaigns, track participation, and measure ROI</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-100">{campaign.name}</h3>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  campaign.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-gray-500/10 text-gray-400'
                }`}
              >
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Participants
                </span>
                <span className="font-bold text-blue-400">{campaign.participants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Megaphone className="h-3 w-3" /> Revenue
                </span>
                <span className="font-bold text-emerald-400">${campaign.revenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> ROI
                </span>
                <span className="font-bold text-amber-400">{campaign.roi}x</span>
              </div>
            </div>

            <button className="mt-4 w-full rounded-lg border border-gray-600 bg-gray-700/20 py-2 text-xs font-medium text-gray-200 hover:bg-gray-700/40 transition-colors">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
