'use client';

import Link from 'next/link';
import React from 'react';
import { CheckCircle, ClipboardList } from 'lucide-react';

interface ApprovalQueueProps {
  count: number;
}

/**
 * ApprovalQueue
 * Widget linking operators to the canonical Commerce Hub approval workflow.
 */
export default function ApprovalQueue({ count }: ApprovalQueueProps) {
  const hasPending = count > 0;

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Approval Queue</h3>
        <span className="inline-block rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
          {count} pending
        </span>
      </div>

      {hasPending ? (
        <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-0.5 h-5 w-5 flex-shrink-0 text-fuchsia-300" />
            <div>
              <h4 className="font-semibold text-gray-100">Commerce review required</h4>
              <p className="mt-1 text-sm text-gray-400">
                Buyer ambassador requests, 50-pack approvals, consignment sales,
                remittances, and wholesale pack records are handled in the
                Commerce Hub so every action writes to the operational ledger.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-6 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No commerce approvals pending.</p>
        </div>
      )}

      <Link
        href="/admin/record-sale"
        className="mt-4 block w-full rounded-lg border border-gray-600 bg-gray-700/20 py-2.5 text-center text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700/40"
      >
        Open Commerce Hub →
      </Link>
    </div>
  );
}
