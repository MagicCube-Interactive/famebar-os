'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingDown,
} from 'lucide-react';
import TeamTreeNode from '@/components/leader/TeamTreeNode';

interface TreeMember {
  id: string;
  name: string;
  email: string;
  salesThisMonth: number;
  status: 'active' | 'stalled' | 'new' | 'at-risk';
  recruits: number;
  tier: number;
  children: TreeMember[];
}

/**
 * Team Tree Page
 * Hierarchical view of recruitment network with search and filter
 */
export default function TeamTreePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'stalled' | 'new' | 'at-risk'>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  // Mock team tree data
  const teamTree: TreeMember = {
    id: 'root',
    name: 'You',
    email: 'leader@famebar.com',
    salesThisMonth: 2850,
    status: 'active',
    recruits: 12,
    tier: 4,
    children: [
      {
        id: 'l1-1',
        name: 'Sarah Johnson',
        email: 'sarah@famebar.com',
        salesThisMonth: 3200,
        status: 'active',
        recruits: 4,
        tier: 3,
        children: [
          {
            id: 'l2-1',
            name: 'Mike Chen',
            email: 'mike@famebar.com',
            salesThisMonth: 1800,
            status: 'active',
            recruits: 2,
            tier: 2,
            children: [],
          },
          {
            id: 'l2-2',
            name: 'Emma Wilson',
            email: 'emma@famebar.com',
            salesThisMonth: 450,
            status: 'stalled',
            recruits: 1,
            tier: 2,
            children: [],
          },
        ],
      },
      {
        id: 'l1-2',
        name: 'Alex Martinez',
        email: 'alex@famebar.com',
        salesThisMonth: 2100,
        status: 'active',
        recruits: 5,
        tier: 3,
        children: [
          {
            id: 'l2-3',
            name: 'Jessica Lee',
            email: 'jessica@famebar.com',
            salesThisMonth: 750,
            status: 'new',
            recruits: 0,
            tier: 2,
            children: [],
          },
          {
            id: 'l2-4',
            name: 'David Brown',
            email: 'david@famebar.com',
            salesThisMonth: 0,
            status: 'at-risk',
            recruits: 0,
            tier: 2,
            children: [],
          },
        ],
      },
      {
        id: 'l1-3',
        name: 'Lisa Anderson',
        email: 'lisa@famebar.com',
        salesThisMonth: 2900,
        status: 'active',
        recruits: 3,
        tier: 3,
        children: [],
      },
    ],
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Flatten tree for search/filter
  const flattenTree = (node: TreeMember, list: TreeMember[] = []): TreeMember[] => {
    list.push(node);
    node.children.forEach((child) => flattenTree(child, list));
    return list;
  };

  const allMembers = flattenTree(teamTree);
  const filteredMembers = allMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    active: allMembers.filter((m) => m.status === 'active').length,
    stalled: allMembers.filter((m) => m.status === 'stalled').length,
    new: allMembers.filter((m) => m.status === 'new').length,
    'at-risk': allMembers.filter((m) => m.status === 'at-risk').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'stalled':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'new':
        return <Users className="h-4 w-4 text-blue-400" />;
      case 'at-risk':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-400/10';
      case 'stalled':
        return 'text-amber-400 bg-amber-400/10';
      case 'new':
        return 'text-blue-400 bg-blue-400/10';
      case 'at-risk':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Team Tree</h1>
        <p className="text-gray-400">View your recruitment hierarchy and team member performance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
          <p className="text-xs font-medium text-gray-400 mb-1">Total Team Members</p>
          <p className="text-2xl font-bold text-gray-100">{allMembers.length - 1}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/10 p-4">
          <p className="text-xs font-medium text-emerald-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-400">{statusCounts.active}</p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 p-4">
          <p className="text-xs font-medium text-amber-400 mb-1">Stalled</p>
          <p className="text-2xl font-bold text-amber-400">{statusCounts.stalled}</p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-900/10 p-4">
          <p className="text-xs font-medium text-red-400 mb-1">At-Risk</p>
          <p className="text-2xl font-bold text-red-400">{statusCounts['at-risk']}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-700/50 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'stalled', 'new', 'at-risk'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-amber-500 text-gray-900 border border-amber-400'
                    : 'border border-gray-700/50 bg-gray-800/30 text-gray-400 hover:text-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Tree or List View */}
      {searchQuery || statusFilter !== 'all' ? (
        // Filtered List View
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-100">
            Search Results ({filteredMembers.length - 1})
          </h3>

          <div className="space-y-2">
            {filteredMembers.slice(1).map((member) => (
              <div
                key={member.id}
                className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-4 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-100">{member.name}</h4>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded ${getStatusColor(member.status)}`}>
                        {getStatusIcon(member.status)}
                        <span className="text-xs font-medium capitalize">{member.status}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>

                  <div className="flex items-end gap-4 text-right">
                    <div>
                      <p className="text-xs text-gray-400">Sales This Month</p>
                      <p className="text-lg font-bold text-emerald-400">${member.salesThisMonth.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Direct Recruits</p>
                      <p className="text-lg font-bold text-blue-400">{member.recruits}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Tree View
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-100">Recruitment Hierarchy</h3>

          <div className="space-y-2">
            <TeamTreeNode
              node={teamTree}
              level={0}
              isExpanded={expandedNodes.has(teamTree.id)}
              onToggle={toggleNode}
            />

            {teamTree.children.map((child) => (
              <TeamTreeNode
                key={child.id}
                node={child}
                level={1}
                isExpanded={expandedNodes.has(child.id)}
                onToggle={toggleNode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mini Cards for L1 Summary */}
      {!searchQuery && statusFilter === 'all' && (
        <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-100">Your Direct Team (L1)</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamTree.children.map((member) => (
              <div
                key={member.id}
                className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-4 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-100">{member.name}</h4>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${getStatusColor(member.status)}`}>
                    {getStatusIcon(member.status)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sales</span>
                    <span className="font-semibold text-emerald-400">${member.salesThisMonth.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Recruits</span>
                    <span className="font-semibold text-blue-400">{member.recruits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tier</span>
                    <span className="font-semibold text-amber-400">L{member.tier}</span>
                  </div>
                </div>

                <button className="mt-3 w-full rounded-lg border border-gray-600 bg-gray-700/20 py-2 text-xs font-medium text-gray-200 hover:bg-gray-700/40 transition-colors">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
