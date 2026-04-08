'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { isAmbassador } from '@/types';
import { Search, Filter, TrendingUp, Zap } from 'lucide-react';

export default function CustomersPage() {
  const { userProfile } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState<'all' | 'active' | 'lapsed' | 'new'>('all');

  if (!userProfile || !isAmbassador(userProfile)) {
    return null;
  }

  // Mock customer data
  const customers = [
    { id: 1, name: 'Sarah Johnson', segment: 'active', orders: 8, lastOrder: '2024-04-07', tokensEarned: 1250 },
    { id: 2, name: 'Mike Chen', segment: 'active', orders: 5, lastOrder: '2024-04-03', tokensEarned: 875 },
    { id: 3, name: 'Emma Davis', segment: 'new', orders: 1, lastOrder: '2024-04-08', tokensEarned: 250 },
    { id: 4, name: 'James Wilson', segment: 'lapsed', orders: 3, lastOrder: '2024-03-15', tokensEarned: 625 },
    { id: 5, name: 'Lisa Rodriguez', segment: 'active', orders: 12, lastOrder: '2024-04-06', tokensEarned: 2100 },
    { id: 6, name: 'David Park', segment: 'new', orders: 1, lastOrder: '2024-04-05', tokensEarned: 175 },
    { id: 7, name: 'Rachel Green', segment: 'lapsed', orders: 2, lastOrder: '2024-02-20', tokensEarned: 350 },
    { id: 8, name: 'Tom Anderson', segment: 'active', orders: 6, lastOrder: '2024-04-01', tokensEarned: 950 },
  ];

  const filteredCustomers = customers.filter(
    c =>
      (filterSegment === 'all' || c.segment === filterSegment) &&
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topCustomers = customers.sort((a, b) => b.tokensEarned - a.tokensEarned).slice(0, 3);

  const segmentStats = {
    active: customers.filter(c => c.segment === 'active').length,
    lapsed: customers.filter(c => c.segment === 'lapsed').length,
    new: customers.filter(c => c.segment === 'new').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Customers</h1>
        <p className="mt-2 text-gray-400">Manage and track your customer base</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="text-xs text-gray-500">Active Customers</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{segmentStats.active}</p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-xs text-gray-500">New This Month</p>
          <p className="mt-2 text-2xl font-bold text-amber-400">{segmentStats.new}</p>
        </div>
        <div className="rounded-lg border border-orange-500/30 bg-orange-950/20 p-4">
          <p className="text-xs text-gray-500">Lapsed (30+ days)</p>
          <p className="mt-2 text-2xl font-bold text-orange-400">{segmentStats.lapsed}</p>
        </div>
      </div>

      {/* Top Customers */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-100">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          Top Customers
        </h2>
        <div className="space-y-3">
          {topCustomers.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between rounded-lg bg-gray-900/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                  #{index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-200">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.orders} orders</p>
                </div>
              </div>
              <p className="font-bold text-yellow-400">{customer.tokensEarned} tokens</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-700/50 bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:border-amber-500/50 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'lapsed', 'new'] as const).map((segment) => (
            <button
              key={segment}
              onClick={() => setFilterSegment(segment)}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                filterSegment === segment
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              {segment === 'all' && 'All'}
              {segment === 'active' && 'Active'}
              {segment === 'lapsed' && 'Lapsed'}
              {segment === 'new' && 'New'}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700/30">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Name</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Last Order</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Tokens Earned</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-700/20 hover:bg-gray-800/50 transition-all">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-200">{customer.name}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="font-semibold text-gray-200">{customer.orders}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-400">{customer.lastOrder}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-yellow-400">{customer.tokensEarned}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        customer.segment === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : customer.segment === 'new'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-orange-500/20 text-orange-300'
                      }`}
                    >
                      {customer.segment === 'active' && 'Active'}
                      {customer.segment === 'new' && 'New'}
                      {customer.segment === 'lapsed' && 'Lapsed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-8 text-center">
          <p className="text-gray-400">No customers found</p>
        </div>
      )}
    </div>
  );
}
