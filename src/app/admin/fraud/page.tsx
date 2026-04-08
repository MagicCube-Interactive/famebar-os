'use client';

import React, { useState } from 'react';
import { AlertTriangle, Shield, Filter, Download, ChevronRight } from 'lucide-react';

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
 * Fraud & Reviews Center — Aureum Obsidian Design
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

  const devicePatterns = [
    { pattern: 'Device ID: ABC123XYZ', count: 5, risk: 'High' },
    { pattern: 'Payment: VISA****1234', count: 8, risk: 'High' },
    { pattern: 'IP: 192.168.1.x', count: 12, risk: 'Medium' },
  ];

  const refundRates = [
    { name: 'Emma Wilson', rate: 40, orders: 8, amount: 725 },
    { name: 'Robert Chen', rate: 25, orders: 12, amount: 450 },
    { name: 'Michael Torres', rate: 15, orders: 20, amount: 600 },
  ];

  const auditLogs = [
    { action: 'Flagged as suspicious', by: 'admin@famebar.com', time: '2 hours ago', timeCode: '14:22:05' },
    { action: 'Manual review initiated', by: 'Sarah (compliance)', time: '3 hours ago', timeCode: '14:18:12' },
    { action: 'Pattern detected: device_id match', by: 'System', time: '4 hours ago', timeCode: '13:55:44' },
  ];

  const getSeverityIndicatorColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-error shadow-[0_0_10px_rgba(255,180,171,0.4)]';
      case 'high':
        return 'bg-error-container';
      case 'medium':
        return 'bg-primary';
      default:
        return 'bg-surface-container-highest';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-error/10 text-error border border-error/20';
      case 'high':
        return 'bg-error-container/20 text-error border border-error/20';
      case 'medium':
        return 'bg-primary/10 text-primary border border-primary/20';
      default:
        return 'bg-surface-container-highest text-on-surface/60';
    }
  };

  const tabs = [
    { key: 'queue' as const, label: 'Suspicious Activity' },
    { key: 'patterns' as const, label: 'Device Patterns' },
    { key: 'refunds' as const, label: 'Refund Analysis' },
    { key: 'logs' as const, label: 'Audit Log' },
  ];

  const criticalCount = suspiciousActivities.filter((a) => a.severity === 'critical').length;
  const totalProbes = suspiciousActivities.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-lg font-bold tracking-tight text-on-surface">Admin Fraud Center (AF)</h1>
        <div className="h-4 w-px bg-surface-container-highest" />
        <div className="flex gap-1">
          <span className="px-2 py-0.5 bg-error-container text-error text-[10px] font-mono font-bold rounded">
            SENTINEL
          </span>
          <span className="px-2 py-0.5 bg-surface-container-highest text-primary text-[10px] font-mono font-bold rounded">
            {totalProbes + 42} PROBES
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-8 border-b border-surface-container-highest/30 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'font-bold text-primary border-b-2 border-primary'
                : 'text-on-surface/60 hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* ===== LEFT COLUMN ===== */}
        <section className="col-span-8 flex flex-col gap-6 overflow-hidden">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mb-1">Velocity Spike</p>
              <h3 className="text-2xl font-bold font-mono text-secondary">
                +248% <span className="text-xs font-normal text-on-surface/40">vs 24h</span>
              </h3>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl border-l-2 border-primary">
              <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mb-1">Self-Buy Pattern</p>
              <h3 className="text-2xl font-bold font-mono text-primary">
                18 <span className="text-xs font-normal text-on-surface/40">Detected</span>
              </h3>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mb-1">Risk Exposure</p>
              <h3 className="text-2xl font-bold font-mono text-error">$14.2k</h3>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mb-1">Refund Rate</p>
              <h3 className="text-2xl font-bold font-mono text-error">
                &gt;15% <span className="text-xs font-normal text-on-surface/40">flagged</span>
              </h3>
            </div>
          </div>

          {/* Suspicious Activity Queue */}
          {activeTab === 'queue' && (
            <div className="flex-1 bg-surface-container p-4 rounded-xl overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold uppercase tracking-tighter">Current Risk Queue</h4>
                <div className="flex gap-2">
                  <button className="p-1.5 bg-surface-container-high rounded-lg hover:bg-surface-bright transition-colors">
                    <Filter className="w-4 h-4 text-on-surface/60" />
                  </button>
                  <button className="p-1.5 bg-surface-container-high rounded-lg hover:bg-surface-bright transition-colors">
                    <Download className="w-4 h-4 text-on-surface/60" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {suspiciousActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="group flex flex-col bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-all cursor-pointer"
                    onClick={() => setSelectedItem(selectedItem?.id === activity.id ? null : activity)}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-1.5 h-8 rounded-full ${getSeverityIndicatorColor(activity.severity)}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{activity.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${getSeverityBadge(activity.severity)}`}>
                              {activity.severity.toUpperCase()}
                            </span>
                            {activity.reviewed && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-secondary/10 text-secondary border border-secondary/20">
                                REVIEWED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-on-surface/40">Ambassador:</span>
                            <span className="text-xs font-semibold text-primary">{activity.ambassadorName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs font-mono text-on-surface/60">{activity.description.slice(0, 24)}</div>
                          <div className="text-[10px] text-on-surface/40 uppercase">{activity.timestamp}</div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="px-3 py-1.5 bg-primary text-on-primary text-[10px] font-bold rounded-lg hover:brightness-110 transition-all">
                            Investigate
                          </button>
                          <button className="px-3 py-1.5 bg-surface-container-highest text-on-surface text-[10px] font-bold rounded-lg hover:bg-surface-bright transition-all">
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedItem?.id === activity.id && (
                      <div className="px-4 pb-4 pt-1 border-t border-outline-variant/20 space-y-3">
                        <ul className="space-y-1">
                          {activity.details.map((detail, idx) => (
                            <li key={idx} className="text-xs text-on-surface/60 flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-on-surface/20" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 pt-1">
                          <button className="flex-1 rounded-lg bg-secondary/10 border border-secondary/20 py-2 text-xs font-bold text-secondary hover:bg-secondary/20 transition-colors">
                            Mark Safe
                          </button>
                          <button className="flex-1 rounded-lg bg-error/10 border border-error/20 py-2 text-xs font-bold text-error hover:bg-error/20 transition-colors">
                            Flag &amp; Review
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Device Patterns Tab */}
          {activeTab === 'patterns' && (
            <div className="flex-1 bg-surface-container p-4 rounded-xl overflow-hidden flex flex-col">
              <h4 className="text-sm font-bold uppercase tracking-tighter mb-4">Device / Payment Patterns</h4>
              <div className="flex-1 overflow-y-auto space-y-3">
                {devicePatterns.map((item, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-3 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-8 rounded-full ${item.risk === 'High' ? 'bg-error' : 'bg-primary'}`} />
                      <div>
                        <p className="font-mono text-sm font-bold text-on-surface">{item.pattern}</p>
                        <p className="text-xs text-on-surface/40 mt-0.5">Associated with {item.count} accounts</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      item.risk === 'High'
                        ? 'bg-error/10 text-error border border-error/20'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {item.risk.toUpperCase()} RISK
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refund Analysis Tab (full-width when active) */}
          {activeTab === 'refunds' && (
            <div className="flex-1 bg-surface-container p-4 rounded-xl overflow-hidden flex flex-col">
              <h4 className="text-sm font-bold uppercase tracking-tighter mb-4">Refund Rates by Ambassador</h4>
              <div className="flex-1 overflow-y-auto space-y-3">
                {refundRates.map((item, idx) => (
                  <div key={idx} className="p-3 bg-surface-container-low rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-on-surface">{item.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        item.rate > 30
                          ? 'bg-error/10 text-error border border-error/20'
                          : item.rate > 15
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-secondary/10 text-secondary border border-secondary/20'
                      }`}>
                        {item.rate}% REFUNDS
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-on-surface/40 mb-2">
                      <span>{item.orders} orders</span>
                      <span>${item.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.rate > 30 ? 'bg-error' : item.rate > 15 ? 'bg-primary' : 'bg-secondary'
                        }`}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log Tab (full-width when active) */}
          {activeTab === 'logs' && (
            <div className="flex-1 bg-surface-container p-4 rounded-xl overflow-hidden flex flex-col">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface/60 mb-4">Full Audit Log</h4>
              <div className="flex-1 overflow-y-auto space-y-4">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        idx === 0 ? 'bg-secondary' : idx === 1 ? 'bg-primary' : 'bg-error'
                      }`} />
                      {idx < auditLogs.length - 1 && <div className="flex-1 w-px bg-surface-container-highest mt-2" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-[10px] font-mono text-on-surface/40">{log.timeCode}</p>
                      <p className="text-xs font-semibold mt-0.5">{log.action}</p>
                      <p className="text-[10px] text-on-surface/40">by {log.by} - {log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ===== RIGHT COLUMN ===== */}
        <section className="col-span-4 flex flex-col gap-6 overflow-hidden">
          {/* Refund Rate Table */}
          <div className="bg-surface-container p-4 rounded-xl flex flex-col h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface/60">
                Refund Rate &gt; 15%
              </h4>
              <AlertTriangle className="w-4 h-4 text-error" />
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-on-surface/40 border-b border-surface-container-highest/20">
                  <tr>
                    <th className="pb-2 font-medium">Ambassador</th>
                    <th className="pb-2 font-medium text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/10">
                  {refundRates.map((item, idx) => (
                    <tr key={idx} className={item.rate <= 15 ? 'opacity-40' : ''}>
                      <td className="py-3 font-semibold">{item.name}</td>
                      <td className={`py-3 text-right font-bold ${item.rate > 15 ? 'text-error' : 'text-on-surface/60'}`}>
                        {item.rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Audit Log Feed */}
          <div className="flex-1 bg-surface-container p-4 rounded-xl overflow-hidden flex flex-col">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface/60 mb-4">
              Security Audit Log
            </h4>
            <div className="flex-1 overflow-y-auto space-y-4">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${
                      idx === 0 ? 'bg-secondary' : idx === 1 ? 'bg-primary' : 'bg-error'
                    }`} />
                    {idx < auditLogs.length - 1 && <div className="flex-1 w-px bg-surface-container-highest mt-2" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-[10px] font-mono text-on-surface/40">{log.timeCode}</p>
                    <p className="text-xs font-semibold mt-0.5">{log.action}</p>
                    <p className="text-[10px] text-on-surface/40 italic">by {log.by}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Floating Security Status Pill */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-surface-container-high/80 backdrop-blur-xl px-4 py-2 rounded-full border border-outline-variant/10 shadow-2xl z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-[10px] font-bold font-mono tracking-tighter">ENGINE ONLINE</span>
        </div>
        <div className="w-px h-3 bg-surface-container-highest" />
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold font-mono">SSL 256-BIT</span>
        </div>
      </div>
    </div>
  );
}
