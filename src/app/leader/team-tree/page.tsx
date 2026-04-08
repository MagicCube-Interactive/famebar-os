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
  UserPlus,
  Mail,
  BarChart3,
  Star,
} from 'lucide-react';

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
 * Team Tree Page — Genealogy Visualizer
 * Aureum Obsidian design: tree visualization with detail sidebar
 */
export default function TeamTreePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'stalled' | 'new' | 'at-risk'>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [selectedMember, setSelectedMember] = useState<TreeMember | null>(null);

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

  const getStatusBadgeLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Top Seller';
      case 'stalled':
        return 'Stalled';
      case 'new':
        return 'New';
      case 'at-risk':
        return 'At Risk';
      default:
        return status;
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-secondary';
      case 'stalled':
        return 'bg-amber-400';
      case 'new':
        return 'bg-blue-400';
      case 'at-risk':
        return 'bg-error';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary/10 text-primary';
      case 'at-risk':
        return 'bg-on-surface-variant/10 text-on-surface-variant';
      case 'stalled':
        return 'bg-amber-400/10 text-amber-400';
      case 'new':
        return 'bg-blue-400/10 text-blue-400';
      default:
        return 'bg-on-surface-variant/10 text-on-surface-variant';
    }
  };

  const getRevenueColor = (status: string) => {
    if (status === 'at-risk') return 'text-on-surface-variant';
    return 'text-secondary';
  };

  const formatRevenue = (amount: number) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
    return `$${amount}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Select first L1 member by default if none selected
  const activeMember = selectedMember || teamTree.children[0];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header & Controls */}
      <section className="px-8 py-6 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/10">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">Genealogy Visualizer</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Navigate your multi-level ambassador network and performance hubs.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant h-4 w-4" />
            <input
              type="text"
              placeholder="Search ambassadors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-lowest border-none text-sm rounded-lg pl-10 pr-4 py-2.5 w-64 focus:ring-1 focus:ring-primary/40 text-on-surface placeholder:text-on-surface-variant/60"
            />
          </div>
          <button className="flex items-center gap-2 bg-surface-container-high px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-variant transition-colors text-on-surface">
            <Filter className="h-4 w-4" /> Filters
          </button>
          <button className="flex items-center gap-2 bg-gradient-to-br from-primary-container to-primary px-5 py-2.5 rounded-lg text-sm font-bold text-on-primary shadow-lg shadow-primary/10">
            <UserPlus className="h-4 w-4" /> Recruit New
          </button>
        </div>
      </section>

      {/* Visualization Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Tree Canvas */}
        <div className="flex-1 overflow-auto p-12 bg-[radial-gradient(#1a202c_1px,transparent_1px)] [background-size:24px_24px]">
          {searchQuery || statusFilter !== 'all' ? (
            /* Filtered List View */
            <div className="max-w-3xl mx-auto space-y-2">
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
                Search Results ({filteredMembers.length - 1})
              </h3>
              {filteredMembers
                .filter((m) => m.id !== 'root')
                .map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`w-full text-left bg-surface-container hover:bg-surface-variant transition-all cursor-pointer p-4 rounded-xl border border-outline-variant/10 shadow-lg ${
                      activeMember?.id === member.id ? 'ring-1 ring-primary/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-sm font-bold text-on-surface">
                          {getInitials(member.name)}
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusDotColor(member.status)} border-2 border-surface-container rounded-full`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-on-surface">{member.name}</p>
                        <p className="text-[10px] font-mono text-on-surface-variant">
                          ID: FOS-{member.id.replace(/[^0-9]/g, '').padStart(4, '0')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`${getStatusBadgeStyle(member.status)} text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider`}
                        >
                          {getStatusBadgeLabel(member.status)}
                        </span>
                        <p className={`text-xs font-mono mt-1 ${getRevenueColor(member.status)}`}>
                          {formatRevenue(member.salesThisMonth)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          ) : (
            /* Tree View */
            <div className="min-w-max flex flex-col items-center">
              {/* Root Node (Leader) */}
              <div className="relative group cursor-pointer" onClick={() => setSelectedMember(teamTree)}>
                <div className="flex flex-col items-center">
                  <div className="p-1 rounded-full bg-gradient-to-tr from-primary to-primary-fixed shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center text-2xl font-bold text-primary">
                      {getInitials(teamTree.name)}
                    </div>
                  </div>
                  <div className="mt-4 bg-surface-container-highest px-4 py-2 rounded-xl shadow-xl text-center border border-primary/20">
                    <p className="text-sm font-bold text-primary">{teamTree.name}</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
                      <span className="text-[10px] font-mono text-secondary tracking-tighter">
                        L0 &bull; ROOT
                      </span>
                    </div>
                  </div>
                </div>
                {/* Vertical connector from root to branch line */}
                <div className="w-0.5 h-12 bg-surface-variant mx-auto" />
              </div>

              {/* Level 1 Branch */}
              <div className="relative">
                {/* Horizontal connector spanning all L1 nodes */}
                <div className="h-0.5 bg-surface-variant absolute top-0 left-0 w-full" />
                <div className="flex gap-24 pt-12">
                  {teamTree.children.map((child) => (
                    <div key={child.id} className="flex flex-col items-center relative">
                      {/* Vertical connector from branch line to node */}
                      <div className="w-0.5 h-12 bg-surface-variant absolute -top-12 left-1/2 -translate-x-1/2" />

                      {/* L1 Node Card */}
                      <button
                        onClick={() => setSelectedMember(child)}
                        className={`bg-surface-container hover:bg-surface-variant transition-all cursor-pointer p-4 rounded-xl border border-outline-variant/10 w-56 shadow-lg text-left ${
                          activeMember?.id === child.id ? 'ring-1 ring-primary/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-sm font-bold text-on-surface">
                              {getInitials(child.name)}
                            </div>
                            <span
                              className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusDotColor(child.status)} border-2 border-surface-container rounded-full`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-on-surface">{child.name}</p>
                            <p className="text-[10px] font-mono text-on-surface-variant">
                              ID: FOS-{child.id.replace(/[^0-9]/g, '').padStart(4, '0')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          <span
                            className={`${getStatusBadgeStyle(child.status)} text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider`}
                          >
                            {getStatusBadgeLabel(child.status)}
                          </span>
                          <span className={`text-xs font-mono ${getRevenueColor(child.status)}`}>
                            {formatRevenue(child.salesThisMonth)}
                          </span>
                        </div>
                      </button>

                      {/* Vertical connector to L2 */}
                      <div className="w-0.5 h-12 bg-surface-variant" />

                      {/* Level 2 Children */}
                      {child.children.length > 0 ? (
                        <div className="flex gap-8">
                          {child.children.map((grandchild) => (
                            <div key={grandchild.id} className="flex flex-col items-center relative">
                              {/* Vertical connector from L1 to L2 node */}
                              <div className="w-0.5 h-8 bg-surface-variant absolute -top-8 left-1/2 -translate-x-1/2" />
                              <button
                                onClick={() => setSelectedMember(grandchild)}
                                className={`bg-surface-container-low p-3 rounded-lg border border-outline-variant/5 w-40 hover:scale-105 transition-transform text-left ${
                                  activeMember?.id === grandchild.id ? 'ring-1 ring-primary/40' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface">
                                    {getInitials(grandchild.name)}
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-bold text-on-surface">
                                      {grandchild.name.split(' ')[0]}{' '}
                                      {grandchild.name.split(' ').slice(1).map((n) => n[0] + '.').join(' ')}
                                    </p>
                                    <p className="text-[9px] text-on-surface-variant">
                                      L{grandchild.tier} &bull;{' '}
                                      {grandchild.status.charAt(0).toUpperCase() + grandchild.status.slice(1)}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/5 w-40 opacity-40">
                          <p className="text-[10px] text-center italic text-on-surface-variant">No L2 downline</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Node Detail Panel (Sidebar) */}
        <aside className="w-full md:w-80 bg-surface-variant/60 backdrop-blur-xl border-l border-outline-variant/10 flex flex-col z-10 overflow-y-auto">
          {activeMember ? (
            <>
              {/* Profile Header */}
              <div className="p-6 text-center border-b border-outline-variant/10">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-2xl bg-surface-container-highest flex items-center justify-center text-3xl font-bold text-primary mx-auto ring-4 ring-primary/20">
                    {getInitials(activeMember.name)}
                  </div>
                  <span className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {activeMember.status === 'active'
                      ? 'Active'
                      : activeMember.status === 'at-risk'
                        ? 'At Risk'
                        : activeMember.status.charAt(0).toUpperCase() + activeMember.status.slice(1)}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-on-surface">{activeMember.name}</h3>
                <p className="text-sm font-mono text-primary">
                  {activeMember.tier >= 3 ? 'Elite' : activeMember.tier >= 2 ? 'Rising' : 'Starter'} Ambassador
                  &bull; L{activeMember.tier}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="p-6 grid grid-cols-2 gap-3 border-b border-outline-variant/10">
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Total Sales</p>
                  <p className="text-lg font-mono text-secondary mt-1">
                    ${activeMember.salesThisMonth.toLocaleString()}
                  </p>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Downline</p>
                  <p className="text-lg font-mono text-on-surface mt-1">
                    {activeMember.children.length > 0
                      ? `${flattenTree(activeMember).length - 1} Members`
                      : '0 Members'}
                  </p>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Retention</p>
                  <p className="text-lg font-mono text-on-surface mt-1">
                    {activeMember.status === 'active'
                      ? '94%'
                      : activeMember.status === 'at-risk'
                        ? '42%'
                        : '78%'}
                  </p>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Commission</p>
                  <p className="text-lg font-mono text-primary mt-1">
                    {activeMember.tier >= 3 ? '15%' : activeMember.tier >= 2 ? '10%' : '5%'}
                  </p>
                </div>
              </div>

              {/* What Unlocks Next */}
              <div className="p-6 flex-1">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  What Unlocks Next
                </h4>
                <div className="bg-surface-container-highest/40 p-4 rounded-xl border border-primary/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.05)_0%,transparent_100%)]" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-primary" />
                      <p className="text-sm font-bold text-on-surface">
                        {activeMember.tier >= 3 ? 'Regional Lead Tier' : 'Elite Ambassador'}
                      </p>
                    </div>
                    <div className="mt-3 bg-background/50 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{
                          width: `${Math.min(
                            (activeMember.salesThisMonth / (activeMember.tier >= 3 ? 4000 : 2000)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-on-surface-variant">
                      Earn{' '}
                      <strong>
                        $
                        {Math.max(
                          0,
                          (activeMember.tier >= 3 ? 4000 : 2000) - activeMember.salesThisMonth
                        ).toLocaleString()}
                      </strong>{' '}
                      more in sales to unlock 2% bonus overrides.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container-highest hover:bg-surface-variant transition-colors rounded-xl text-sm font-semibold text-on-surface">
                    <Mail className="h-4 w-4" /> Message {activeMember.name.split(' ')[0]}
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-background border border-outline-variant/10 hover:bg-surface-container-low transition-colors rounded-xl text-sm font-semibold text-on-surface">
                    <BarChart3 className="h-4 w-4" /> View Performance Report
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 flex items-center justify-center flex-1">
              <p className="text-sm text-on-surface-variant italic">Select a team member to view details</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
