'use client';

import Link from 'next/link';
import React from 'react';
import { BarChart3, DollarSign, ShoppingCart, Users } from 'lucide-react';

const liveSources = [
  {
    title: 'Orders',
    description: 'Retail orders, refunds, and buyer purchase history.',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Cash Ledger',
    description: 'Commission events, payout readiness, and settlement state.',
    href: '/admin/cash-ledger',
    icon: DollarSign,
  },
  {
    title: 'Ambassadors',
    description: 'Approved ambassadors, referral codes, and pack eligibility.',
    href: '/admin/ambassadors',
    icon: Users,
  },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Analytics</h1>
        <p className="text-gray-400">
          Commercial analytics are intentionally read-only until chart definitions are mapped to ledger-backed metrics.
        </p>
      </div>

      <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-6">
        <div className="flex items-start gap-4">
          <BarChart3 className="mt-1 h-6 w-6 flex-shrink-0 text-fuchsia-300" />
          <div>
            <h2 className="font-semibold text-gray-100">No synthetic analytics are shown</h2>
            <p className="mt-2 text-sm text-gray-400">
              The previous placeholder chart values have been removed so operators do not mistake demo metrics for revenue
              truth. Use the live operational pages below until a dedicated analytics model is specified.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {liveSources.map((source) => {
          const Icon = source.icon;
          return (
            <Link
              key={source.href}
              href={source.href}
              className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-5 transition-colors hover:bg-gray-800/50"
            >
              <Icon className="mb-4 h-6 w-6 text-cyan-300" />
              <h3 className="font-semibold text-gray-100">{source.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{source.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
