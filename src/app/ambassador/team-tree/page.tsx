'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Network } from 'lucide-react';
import TeamTreeNode from '@/components/shared/TeamTreeNode';
import { useAuthContext } from '@/context/AuthContext';

interface TreeNode {
  id: string;
  name: string;
  email: string;
  salesThisMonth: number;
  status: 'active' | 'stalled' | 'new' | 'at-risk';
  recruits: number;
  tier: number;
  children: TreeNode[];
}

export default function TeamTreePage() {
  const { role } = useAuthContext();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (role !== 'ambassador' && role !== 'admin') {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ambassador/team-tree');
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load team tree');
        }
        setTree(data.tree);
        setExpanded({ [data.tree.id]: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team tree');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [role]);

  const memberCount = useMemo(() => {
    const countNodes = (node: TreeNode | null): number => {
      if (!node) return 0;
      return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
    };
    return countNodes(tree);
  }, [tree]);

  const toggleNode = (nodeId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/20 bg-error/10 p-6 text-sm text-error">
        {error}
      </div>
    );
  }

  if (!tree) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-xl border border-outline-variant/10 bg-surface-container p-6">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Network className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Team Tree</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Follow your live recruitment structure from direct invites down through the rest of
            your tree. This view is read-only and mirrors the current sponsor chain.
          </p>
          <p className="mt-3 text-xs uppercase tracking-widest text-primary">
            {memberCount} ambassador{memberCount === 1 ? '' : 's'} in visible tree
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6">
        <TeamTreeNode
          node={tree}
          level={0}
          isExpanded={expanded[tree.id] ?? true}
          onToggle={toggleNode}
          expandedNodes={expanded}
        />
      </div>
    </div>
  );
}
