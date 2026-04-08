'use client';

import React, { useState } from 'react';
import { AlertTriangle, Flag, Eye } from 'lucide-react';

interface SuspiciousActivity {
  id: string;
  type: 'self_buy' | 'device_pattern' | 'payment_pattern' | 'velocity' | 'refund_abuse';
  title: string;
  description: string;
  ambassadorName: string;
  severity: 'critical' | 'high' | 'medium';
  timestamp: string;
  reviewed: boolean;
  details: string[];
}

/**
 * Fraud & Reviews Center
 */
export default function FraudPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'patterns' | 'refunds' | 'logs'>('queue');
  const [selectedItem, setSelectedItem] = useState<SuspiciousActivity | null>(null);

  const suspiciousActivities: SuspiciousActivity[] = [
    {
      id: '1',
      type: 'self_buy',
      title: 'Suspected Self-Buy',
      description: 'Ambassador purchased from their own referral code',
      ambassadorName: 'David Brown',
      severity: 'critical',
      timestamp: '2 hours ago',
      reviewed: false,
      details: [
        'Order placed: $450.00',
        'Same IP address as registration',
        'Same payment method used in previous orders',
      ],
    },
    {
      id: '2',
      type: 'device_pattern',
      title: 'Repeated Device Pattern',
      description: 'Multiple ambassadors using same device/payment',
      ambassadorName: 'Jessica Lee, Michael Chen',
      severity: 'high',
      timestamp: '4 hours ago',
      reviewed: false,
      details: [
        'Device ID: ABC123XYZ',
        '5 ambassadors detected',
        'Accounts created within 24 hours',
      ],
    },
    {
      id: '3',
      type: 'refund_abuse',
      title: 'High Refund Rate',
      description: 'Ambassador has 40% refund rate',
      ambassadorName: 'Emma Wilson',
      severity: 'high',
      timestamp: '8 hours ago',
      reviewed: false,
      details: [
        '8 orders, 3 refunded ($725 total)',
        'Refund request pattern: 3-7 days after purchase',
      ],
    },
    {
      id: '4',
      type: 'velocity',
      title: 'Abnormal Velocity',
      description: '50+ orders in 24 hours (bot activity)',
      ambassadorName: 'John Smith',
      severity: 'critical',
      timestamp: '12 hours ago',
      reviewed: true,
      details: [
        'Order count: 67 in 24 hours',
        'All same product',
        'Amounts vary slightly ($25.00-$25.50)',
      ],
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-900/20';
      case 'high':
        return 'border-orange-500/50 bg-orange-900/20';
      case 'medium':
        return 'border-amber-500/50 bg-amber-900/20';
      default:
        return 'border-gray-500/50 bg-gray-900/20';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-300';
      case 'high':
        return 'bg-orange-500/20 text-orange-300';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Fraud & Reviews Center</h1>
        <p className="text-gray-400">Monitor suspicious activity, detect patterns, and manage fraud prevention</p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-red-500/30 bg-red-900/10 p-4">
          <p className="text-xs font-medium text-red-400">Critical Alerts</p>
          <p className="text-3xl font-bold text-red-400 mt-1">2</p>
        </div>
        <div className="rounded-lg border border-orange-500/30 bg-orange-900/10 p-4">
          <p className="text-xs font-medium text-orange-400">High Priority</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">2</p>
        </div>
        <div className="rounded-lg border border-gray-500/30 bg-gray-900/10 p-4">
          <p className="text-xs font-medium text-gray-400">Medium Priority</p>
          <p className="text-3xl font-bold text-gray-400 mt-1">0</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50">
        {(['queue', 'patterns', 'refunds', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-red-400 text-red-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'queue'
              ? 'Suspicious Queue'
              : tab === 'patterns'
              ? 'Pattern Analysis'
              : tab === 'refunds'
              ? 'Refund Analysis'
              : 'Audit Log'}
          </button>
        ))}
      </div>

      {/* Suspicious Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {suspiciousActivities.map((activity) => (
            <div
              key={activity.id}
              className={`rounded-lg border p-5 cursor-pointer transition-all hover:shadow-lg ${getSeverityColor(activity.severity)}`}
              onClick={() => setSelectedItem(selectedItem?.id === activity.id ? null : activity)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    activity.severity === 'critical'
                      ? 'text-red-400'
                      : activity.severity === 'high'
                      ? 'text-orange-400'
                      : 'text-amber-400'
                  }`} />
                  <div>
                    <h4 className="font-semibold text-gray-100">{activity.title}</h4>
                    <p className="text-sm text-gray-300 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{activity.ambassadorName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getSeverityBadge(activity.severity)}`}>
                    {activity.severity.toUpperCase()}
                  </span>
                  {activity.reviewed && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                      REVIEWED
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedItem?.id === activity.id && (
                <div className="mt-4 border-t border-gray-700/30 pt-4 space-y-3">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-200 mb-2">Details:</h5>
                    <ul className="space-y-1">
                      {activity.details.map((detail, idx) => (
                        <li key={idx} className="text-xs text-gray-400 flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-gray-600" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 rounded-lg bg-emerald-500/20 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors">
                      Mark Safe
                    </button>
                    <button className="flex-1 rounded-lg bg-red-500/20 py-2 text-sm font-medium text-red-300 hover:bg-red-500/30 transition-colors">
                      Flag & Review
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3">{activity.timestamp}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pattern Analysis */}
      {activeTab === 'patterns' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/20 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Device/Payment Patterns</h3>

            <div className="space-y-3">
              {[
                { pattern: 'Device ID: ABC123XYZ', count: 5, risk: 'High' },
                { pattern: 'Payment: VISA****1234', count: 8, risk: 'High' },
                { pattern: 'IP: 192.168.1.x', count: 12, risk: 'Medium' },
              ].map((item, idx) => (
                <div key={idx} className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-gray-300">{item.pattern}</p>
                      <p className="text-xs text-gray-500 mt-1">Associated with {item.count} accounts</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.risk === 'High'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {item.risk} Risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Refund Analysis */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/20 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Refund Rates by Ambassador</h3>

            <div className="space-y-3">
              {[
                { name: 'Emma Wilson', rate: 40, orders: 8, amount: 725 },
                { name: 'Robert Chen', rate: 25, orders: 12, amount: 450 },
                { name: 'Michael Torres', rate: 15, orders: 20, amount: 600 },
              ].map((item, idx) => (
                <div key={idx} className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-100">{item.name}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.rate > 30
                        ? 'bg-red-500/20 text-red-300'
                        : item.rate > 15
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {item.rate}% refunds
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{item.orders} orders</span>
                    <span>${item.amount.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.rate > 30
                          ? 'bg-red-500'
                          : item.rate > 15
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {activeTab === 'logs' && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/20 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Audit Log</h3>

          <div className="space-y-2 text-sm">
            {[
              { action: 'Flagged as suspicious', by: 'admin@famebar.com', time: '2 hours ago' },
              { action: 'Manual review initiated', by: 'Sarah (compliance)', time: '3 hours ago' },
              { action: 'Pattern detected: device_id match', by: 'System', time: '4 hours ago' },
            ].map((log, idx) => (
              <div key={idx} className="border-b border-gray-700/30 py-2 last:border-b-0">
                <p className="text-gray-300 font-medium">{log.action}</p>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{log.by}</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
