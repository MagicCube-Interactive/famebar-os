'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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

interface TeamTreeNodeProps {
  node: TreeMember;
  level: number;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
}

/**
 * TeamTreeNode
 * Single expandable node in the recruitment tree
 */
export default function TeamTreeNode({
  node,
  level,
  isExpanded,
  onToggle,
}: TeamTreeNodeProps) {
  const hasChildren = node.children.length > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
      case 'stalled':
        return <Clock className="h-3.5 w-3.5 text-fuchsia-400" />;
      case 'new':
        return <Users className="h-3.5 w-3.5 text-cyan-400" />;
      case 'at-risk':
        return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-400/10';
      case 'stalled':
        return 'text-fuchsia-400 bg-fuchsia-400/10';
      case 'new':
        return 'text-cyan-400 bg-cyan-400/10';
      case 'at-risk':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div>
      {/* Node Container */}
      <div
        className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-3 hover:bg-gray-800/40 transition-colors mb-2"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Expand Toggle + Info */}
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => onToggle(node.id)}
                className="mt-0.5 rounded hover:bg-gray-700 p-0.5 transition-colors flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-5 flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold text-gray-100 truncate">{node.name}</h4>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${getStatusColor(node.status)}`}>
                  {getStatusIcon(node.status)}
                  <span className="font-medium capitalize text-xs">{node.status}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 truncate">{node.email}</p>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-4 text-right flex-shrink-0">
            <div>
              <p className="text-xs text-gray-500">Sales</p>
              <p className="text-sm font-bold text-emerald-400">${node.salesThisMonth.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Recruits</p>
              <p className="text-sm font-bold text-cyan-400">{node.recruits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <div key={child.id}>
              <TeamTreeNode
                node={child}
                level={level + 1}
                isExpanded={true}
                onToggle={onToggle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
