'use client';

import React, { useState } from 'react';
import { Check, X, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface QueueItem {
  id: string;
  type: 'order' | 'ambassador' | 'payout' | 'refund';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

interface ApprovalQueueProps {
  count: number;
}

/**
 * ApprovalQueue
 * Widget showing items pending approval with approve/reject actions
 */
export default function ApprovalQueue({ count }: ApprovalQueueProps) {
  const [items, setItems] = useState<QueueItem[]>([
    {
      id: '1',
      type: 'order',
      title: 'Order #ORD-2024-001',
      description: 'Manual review needed - high value order',
      amount: 850.50,
      timestamp: '10 min ago',
      priority: 'high',
    },
    {
      id: '2',
      type: 'ambassador',
      title: 'New Ambassador Registration',
      description: 'Jessica Lee - needs email verification',
      timestamp: '25 min ago',
      priority: 'medium',
    },
    {
      id: '3',
      type: 'payout',
      title: 'Payout Request - Sarah Johnson',
      description: '$2,450.00 withdrawal request',
      amount: 2450.00,
      timestamp: '1 hour ago',
      priority: 'medium',
    },
    {
      id: '4',
      type: 'refund',
      title: 'Refund Request #REF-001',
      description: 'Customer requesting full refund',
      amount: 145.00,
      timestamp: '2 hours ago',
      priority: 'high',
    },
  ]);

  const handleApprove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReject = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/10';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10';
      case 'low':
        return 'text-blue-400 bg-blue-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'ambassador':
        return '👤';
      case 'payout':
        return '💰';
      case 'refund':
        return '↩️';
      default:
        return '⚙️';
    }
  };

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Approval Queue</h3>
        <span className="inline-block rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
          {items.length} pending
        </span>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                {/* Type Icon */}
                <div className="text-2xl">{getTypeIcon(item.type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-gray-100">{item.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                      {item.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.timestamp}</p>
                </div>

                {/* Amount */}
                {item.amount && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-lg font-bold text-emerald-400">
                      ${item.amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(item.id)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2 text-sm font-medium text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-6 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">All items approved!</p>
        </div>
      )}

      <button className="mt-4 w-full rounded-lg border border-gray-600 bg-gray-700/20 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-700/40 transition-colors">
        View All Approvals →
      </button>
    </div>
  );
}
