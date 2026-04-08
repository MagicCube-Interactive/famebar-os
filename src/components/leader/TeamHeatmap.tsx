'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  status: 'active' | 'stalled' | 'new' | 'at-risk';
  salesThisMonth: number;
  recruits: number;
}

interface TeamHeatmapProps {
  data: TeamMember[];
}

/**
 * TeamHeatmap
 * Grid showing team members colored by activity status
 * Green = active, amber = stalled, blue = new, red = at-risk
 */
export default function TeamHeatmap({ data }: TeamHeatmapProps) {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'stalled' | 'new' | 'at-risk'>('all');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const filteredData = selectedStatus === 'all'
    ? data
    : data.filter((member) => member.status === selectedStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/30 border-emerald-500/50 hover:bg-emerald-500/40';
      case 'stalled':
        return 'bg-amber-500/30 border-amber-500/50 hover:bg-amber-500/40';
      case 'new':
        return 'bg-blue-500/30 border-blue-500/50 hover:bg-blue-500/40';
      case 'at-risk':
        return 'bg-red-500/30 border-red-500/50 hover:bg-red-500/40';
      default:
        return 'bg-gray-500/30 border-gray-500/50';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-300';
      case 'stalled':
        return 'text-amber-300';
      case 'new':
        return 'text-blue-300';
      case 'at-risk':
        return 'text-red-300';
      default:
        return 'text-gray-300';
    }
  };

  const statusCounts = {
    all: data.length,
    active: data.filter((m) => m.status === 'active').length,
    stalled: data.filter((m) => m.status === 'stalled').length,
    new: data.filter((m) => m.status === 'new').length,
    'at-risk': data.filter((m) => m.status === 'at-risk').length,
  };

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'stalled', 'new', 'at-risk'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-amber-500 text-gray-900'
                : 'border border-gray-700/50 bg-gray-800/30 text-gray-400 hover:text-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredData.map((member) => (
          <div
            key={member.id}
            className={`rounded-lg border p-3 cursor-pointer transition-all ${getStatusColor(member.status)}`}
            onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
          >
            {/* Compact View */}
            {expandedMember !== member.id && (
              <div>
                <h4 className="font-semibold text-gray-100 text-sm truncate">{member.name}</h4>
                <p className={`text-xs font-medium mt-1 ${getStatusTextColor(member.status)} uppercase tracking-wide`}>
                  {member.status}
                </p>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-gray-300">${member.salesThisMonth.toFixed(0)}</span>
                  <span className="text-gray-300">{member.recruits} recruits</span>
                </div>
              </div>
            )}

            {/* Expanded View */}
            {expandedMember === member.id && (
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-100 text-sm">{member.name}</h4>
                    <p className={`text-xs font-medium mt-1 ${getStatusTextColor(member.status)}`}>
                      {member.status.toUpperCase()}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sales:</span>
                    <span className="font-semibold text-emerald-300">${member.salesThisMonth.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recruits:</span>
                    <span className="font-semibold text-blue-300">{member.recruits}</span>
                  </div>
                </div>

                <button className="mt-2 w-full rounded-lg bg-gray-700/50 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700 transition-colors">
                  View Profile
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-8 text-center">
          <p className="text-sm text-gray-400">No team members with this status</p>
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-4 border-t border-gray-700/30">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-gray-400">Active (sales + recruits)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-gray-400">New (first 30 days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-gray-400">Stalled (7+ days inactive)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-gray-400">At-Risk (zero sales)</span>
        </div>
      </div>
    </div>
  );
}
