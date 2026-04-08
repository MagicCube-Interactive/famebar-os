'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
  Filter,
  Calendar,
} from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'sale' | 'recruit' | 'milestone' | 'stalled' | 'atrisk';
  title: string;
  description: string;
  timestamp: string;
  ambassadorName: string;
  amount?: number;
}

interface StalledAmbassador {
  id: string;
  name: string;
  email: string;
  lastActivityDate: string;
  daysInactive: number;
  salesThisMonth: number;
  tier: number;
}

interface ActivationStep {
  step: 'registered' | 'verified' | 'first_sale' | 'completed';
  completed: boolean;
  ambassadorName: string;
  date?: string;
}

/**
 * Team Activity Page
 * Activity feed, stalled ambassadors, funnel, at-risk alerts
 */
export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'stalled' | 'funnel' | 'alerts'>('feed');

  // Mock data
  const activityFeed: ActivityEvent[] = [
    {
      id: '1',
      type: 'sale',
      title: 'Sarah Johnson made a sale',
      description: 'Order #ORD-2024-001 - $145.00',
      timestamp: '2 hours ago',
      ambassadorName: 'Sarah Johnson',
      amount: 145.00,
    },
    {
      id: '2',
      type: 'recruit',
      title: 'New recruit activated',
      description: 'Jessica Lee (jessica@famebar.com) verified',
      timestamp: '5 hours ago',
      ambassadorName: 'Alex Martinez',
    },
    {
      id: '3',
      type: 'sale',
      title: 'Alex Martinez made a sale',
      description: 'Order #ORD-2024-002 - $275.50',
      timestamp: '8 hours ago',
      ambassadorName: 'Alex Martinez',
      amount: 275.50,
    },
    {
      id: '4',
      type: 'milestone',
      title: 'Sarah Johnson reached $5,000 sales',
      description: 'Monthly milestone unlocked',
      timestamp: '1 day ago',
      ambassadorName: 'Sarah Johnson',
    },
    {
      id: '5',
      type: 'stalled',
      title: 'Emma Wilson stalled',
      description: 'No activity in 7+ days',
      timestamp: '1 day ago',
      ambassadorName: 'Emma Wilson',
    },
    {
      id: '6',
      type: 'atrisk',
      title: 'David Brown at-risk',
      description: 'Zero sales this month, consider reaching out',
      timestamp: '2 days ago',
      ambassadorName: 'David Brown',
    },
  ];

  const stalledAmbassadors: StalledAmbassador[] = [
    {
      id: '1',
      name: 'Emma Wilson',
      email: 'emma@famebar.com',
      lastActivityDate: '2024-04-01',
      daysInactive: 12,
      salesThisMonth: 450,
      tier: 2,
    },
    {
      id: '2',
      name: 'David Brown',
      email: 'david@famebar.com',
      lastActivityDate: '2024-03-28',
      daysInactive: 15,
      salesThisMonth: 0,
      tier: 2,
    },
    {
      id: '3',
      name: 'Michael Torres',
      email: 'michael@famebar.com',
      lastActivityDate: '2024-03-25',
      daysInactive: 18,
      salesThisMonth: 0,
      tier: 1,
    },
  ];

  const activationFunnel: ActivationStep[] = [
    {
      step: 'registered',
      completed: true,
      ambassadorName: 'Jessica Lee',
      date: '2024-04-10',
    },
    {
      step: 'verified',
      completed: true,
      ambassadorName: 'Jessica Lee',
      date: '2024-04-11',
    },
    {
      step: 'first_sale',
      completed: false,
      ambassadorName: 'Jessica Lee',
    },
    {
      step: 'completed',
      completed: false,
      ambassadorName: 'Jessica Lee',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case 'recruit':
        return <Users className="h-5 w-5 text-blue-400" />;
      case 'milestone':
        return <CheckCircle className="h-5 w-5 text-amber-400" />;
      case 'stalled':
        return <Clock className="h-5 w-5 text-amber-400" />;
      case 'atrisk':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'recruit':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'milestone':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'stalled':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'atrisk':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Team Activity</h1>
        <p className="text-gray-400">Monitor team performance, stalled members, and activation progress</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50">
        {(['feed', 'stalled', 'funnel', 'alerts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'feed'
              ? 'Activity Feed'
              : tab === 'stalled'
              ? 'Stalled Ambassadors'
              : tab === 'funnel'
              ? 'Activation Funnel'
              : 'At-Risk Alerts'}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      {activeTab === 'feed' && (
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-100">Recent Activity</h3>

          <div className="space-y-3">
            {activityFeed.map((event) => (
              <div
                key={event.id}
                className={`rounded-lg border p-4 flex items-start gap-4 ${getActivityColor(event.type)}`}
              >
                <div className="flex-shrink-0">{getActivityIcon(event.type)}</div>

                <div className="flex-1">
                  <h4 className="font-semibold text-gray-100">{event.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                  <p className="text-xs text-gray-500 mt-2">{event.timestamp}</p>
                </div>

                {event.amount && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Sale Amount</p>
                    <p className="text-lg font-bold text-emerald-400">${event.amount.toFixed(2)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stalled Ambassadors */}
      {activeTab === 'stalled' && (
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-100">
            Stalled Ambassadors ({stalledAmbassadors.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th className="px-4 py-3 text-left font-semibold text-gray-400">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-400">Days Inactive</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-400">Last Activity</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-400">Sales This Month</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {stalledAmbassadors.map((ambassador) => (
                  <tr key={ambassador.id} className="border-b border-gray-700/30 hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-100">{ambassador.name}</p>
                        <p className="text-xs text-gray-500">{ambassador.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                        {ambassador.daysInactive} days
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{ambassador.lastActivityDate}</td>
                    <td className="px-4 py-3 text-right text-gray-100">${ambassador.salesThisMonth.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition-colors">
                        Reach Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activation Funnel */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
            <h3 className="mb-6 text-lg font-semibold text-gray-100">New Recruit Activation Funnel</h3>

            <div className="space-y-4">
              {/* Registered */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">Registered</p>
                  <span className="text-xs text-gray-500">5 ambassadors</span>
                </div>
                <div className="h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center px-4 text-sm font-semibold text-white">
                  100%
                </div>
              </div>

              {/* Verified */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">Email Verified</p>
                  <span className="text-xs text-gray-500">4 ambassadors (80%)</span>
                </div>
                <div className="h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center px-4 text-sm font-semibold text-white w-4/5">
                  80%
                </div>
              </div>

              {/* First Sale */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">First Sale</p>
                  <span className="text-xs text-gray-500">3 ambassadors (60%)</span>
                </div>
                <div className="h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 flex items-center px-4 text-sm font-semibold text-white w-3/5">
                  60%
                </div>
              </div>

              {/* Active Status */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">Active Status Achieved</p>
                  <span className="text-xs text-gray-500">2 ambassadors (40%)</span>
                </div>
                <div className="h-10 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 flex items-center px-4 text-sm font-semibold text-gray-900 w-2/5">
                  40%
                </div>
              </div>
            </div>
          </div>

          {/* Individual Funnel Steps */}
          <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Individual Activation Steps</h3>

            <div className="space-y-3">
              {activationFunnel.map((step, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 flex items-center gap-3 ${
                    step.completed
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-gray-700/30 bg-gray-800/20'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.completed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {step.completed ? '✓' : idx + 1}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-gray-100 capitalize">
                      {step.step.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.ambassadorName}</p>
                  </div>

                  {step.date && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{step.date}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* At-Risk Alerts */}
      {activeTab === 'alerts' && (
        <div className="rounded-xl border border-red-500/30 bg-red-900/10 p-6">
          <h3 className="mb-4 text-lg font-semibold text-red-300 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            At-Risk Ambassadors
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* No Sales This Month */}
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <h4 className="font-semibold text-red-300 mb-3">Zero Sales This Month</h4>
              <div className="space-y-2">
                {['David Brown', 'Michael Torres', 'James Wilson'].map((name) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{name}</span>
                    <button className="text-xs rounded px-2 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                      Check In
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Inactive 2+ Weeks */}
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
              <h4 className="font-semibold text-orange-300 mb-3">Inactive 2+ Weeks</h4>
              <div className="space-y-2">
                {['Emma Wilson', 'Robert Chen', 'Lisa Anderson'].map((name) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{name}</span>
                    <button className="text-xs rounded px-2 py-1 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-colors">
                      Reach Out
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="mt-6 border-t border-gray-700/30 pt-6">
            <h4 className="font-semibold text-gray-100 mb-3">Suggested Actions</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">→</span>
                <span>Send motivational message to at-risk members highlighting recent wins</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">→</span>
                <span>Offer 1-on-1 coaching calls to help overcome barriers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">→</span>
                <span>Create a short-term challenge with rewards to re-engage the team</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
