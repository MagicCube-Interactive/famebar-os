'use client';

import Link from 'next/link';
import React from 'react';
import { AlertTriangle, Lock, Shield } from 'lucide-react';

export default function FraudPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold tracking-tight text-on-surface">Admin Fraud Center</h1>
        <span className="rounded bg-surface-container-highest px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
          RULES PENDING
        </span>
      </div>

      <div className="rounded-xl border border-error/20 bg-error/10 p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-error" />
          <div>
            <h2 className="font-semibold text-on-surface">Fraud review is not commercially ready yet</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Demo suspicious-activity records have been removed. Real fraud actions need defined detection rules,
              evidence capture, admin permissions, and audit-log persistence before operators can mark, dismiss, or export
              cases.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/orders"
          className="rounded-lg border border-surface-container-highest/50 bg-surface-container-low p-5 transition-colors hover:bg-surface-container"
        >
          <Shield className="mb-4 h-6 w-6 text-primary" />
          <h3 className="font-semibold text-on-surface">Review Orders</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Use the live orders table for refund review and buyer/order investigation.
          </p>
        </Link>
        <div className="rounded-lg border border-surface-container-highest/50 bg-surface-container-low p-5 opacity-70">
          <Lock className="mb-4 h-6 w-6 text-on-surface-variant" />
          <h3 className="font-semibold text-on-surface">Automated Rule Queue</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Disabled until self-buy, velocity, device, refund-abuse, and evidence retention rules are specified.
          </p>
        </div>
      </div>
    </div>
  );
}
