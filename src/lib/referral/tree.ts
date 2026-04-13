/**
 * Referral Tree / Genealogy Management for FameClub
 * Handles team hierarchy, upline/downline navigation, and team statistics
 */

import { TeamNode, AmbassadorRank } from '@/types';

// In-memory storage (replace with real DB calls)
const teamNodes = new Map<string, TeamNode>();
const sponsorshipMap = new Map<string, string>(); // ambassadorId -> sponsorId

/**
 * Registers a new ambassador in the team tree
 * Establishes the sponsorship link and builds genealogy
 */
export function addToTree(newAmbassadorId: string, sponsorId?: string): TeamNode {
  if (teamNodes.has(newAmbassadorId)) {
    return teamNodes.get(newAmbassadorId)!;
  }

  // Get sponsor's path to establish this node's path
  const ancestorPath: string[] = [];
  if (sponsorId) {
    sponsorshipMap.set(newAmbassadorId, sponsorId);
    const sponsorNode = teamNodes.get(sponsorId);
    if (sponsorNode) {
      ancestorPath.push(...sponsorNode.path, sponsorId);
    } else {
      ancestorPath.push(sponsorId);
    }
  }

  const level = ancestorPath.length;

  const newNode: TeamNode = {
    ambassadorId: newAmbassadorId,
    sponsorId,
    level,
    directRecruits: [],
    path: ancestorPath,
    personalSalesThisMonth: 0,
    teamSalesThisMonth: 0,
    isActive: false,
    updatedAt: new Date().toISOString(),
  };

  teamNodes.set(newAmbassadorId, newNode);

  // Add this ambassador to sponsor's direct recruits
  if (sponsorId) {
    const sponsorNode = teamNodes.get(sponsorId);
    if (sponsorNode && !sponsorNode.directRecruits.includes(newAmbassadorId)) {
      sponsorNode.directRecruits.push(newAmbassadorId);
      sponsorNode.updatedAt = new Date().toISOString();
    }
  }

  return newNode;
}

/**
 * Gets the upline (sponsor chain) from this ambassador up to root
 * Limited by maxDepth to prevent infinite traversal
 * Useful for commission calculation and hierarchy visualization
 */
export function getUpline(ambassadorId: string, maxDepth: number = 6): TeamNode[] {
  const upline: TeamNode[] = [];
  let currentId: string | undefined = ambassadorId;
  let depth = 0;

  while (currentId && depth < maxDepth) {
    const sponsorId = sponsorshipMap.get(currentId);
    if (!sponsorId) break;

    const node = teamNodes.get(sponsorId);
    if (!node) break;

    upline.push(node);
    currentId = sponsorId;
    depth++;
  }

  return upline;
}

/**
 * Gets the downline (all recruits) from this ambassador
 * Recursively traverses the tree up to maxDepth
 * Used for team views and team statistics
 */
export function getDownline(ambassadorId: string, maxDepth: number = 6): TeamNode[] {
  const downline: TeamNode[] = [];
  const queue: [string, number][] = [[ambassadorId, 0]];

  while (queue.length > 0) {
    const [currentId, depth] = queue.shift()!;

    if (depth >= maxDepth) continue;

    const node = teamNodes.get(currentId);
    if (!node) continue;

    // Add all direct recruits to downline
    for (const recruitId of node.directRecruits) {
      const recruitNode = teamNodes.get(recruitId);
      if (recruitNode) {
        downline.push(recruitNode);
        queue.push([recruitId, depth + 1]);
      }
    }
  }

  return downline;
}

/**
 * Gets direct recruits for an ambassador
 * First level only (not recursive)
 */
export function getDirectRecruits(ambassadorId: string): TeamNode[] {
  const node = teamNodes.get(ambassadorId);
  if (!node) return [];

  return node.directRecruits
    .map(id => teamNodes.get(id))
    .filter((n): n is TeamNode => n !== undefined);
}

/**
 * Gets ancestor path from root to this ambassador
 * Useful for breadcrumb navigation and hierarchy display
 */
export function getAncestorPath(ambassadorId: string): string[] {
  const node = teamNodes.get(ambassadorId);
  if (!node) return [];
  return [...node.path, ambassadorId];
}

/**
 * Checks if potentialDescendant is in the downline of potentialAncestor
 * Useful for preventing circular references and hierarchy validation
 */
export function isDescendantOf(potentialDescendant: string, potentialAncestor: string): boolean {
  const path = getAncestorPath(potentialDescendant);
  return path.includes(potentialAncestor);
}

/**
 * Gets comprehensive team statistics for an ambassador
 * Includes team size, activity metrics, and sales breakdown by level
 */
export function getTeamStats(ambassadorId: string): {
  totalTeamSize: number;
  activeCount: number;
  stalledCount: number;
  newThisMonth: number;
  totalTeamSalesThisMonth: number;
  salesByLevel: Record<number, number>;
  teamByLevel: Record<number, number>;
} {
  const downline = getDownline(ambassadorId);
  const directRecruits = getDirectRecruits(ambassadorId);

  const salesByLevel: Record<number, number> = {};
  const teamByLevel: Record<number, number> = {};
  let activeCount = 0;
  let newThisMonth = 0;
  let totalTeamSalesThisMonth = 0;

  // Count self
  const selfNode = teamNodes.get(ambassadorId);
  if (selfNode) {
    totalTeamSalesThisMonth += selfNode.personalSalesThisMonth;
    if (selfNode.isActive) activeCount++;
  }

  // Process downline
  for (const node of downline) {
    const level = node.level - (selfNode?.level || 0);

    // Track sales by level
    if (!salesByLevel[level]) salesByLevel[level] = 0;
    salesByLevel[level] += node.personalSalesThisMonth;
    totalTeamSalesThisMonth += node.personalSalesThisMonth;

    // Track team size by level
    if (!teamByLevel[level]) teamByLevel[level] = 0;
    teamByLevel[level]++;

    // Count active ambassadors
    if (node.isActive) activeCount++;

    // Count new recruits this month (in production, check createdAt timestamp)
    if (node.level === (selfNode?.level || 0) + 1) {
      newThisMonth++;
    }
  }

  // Calculate stalled (inactive) count
  const stalledCount = downline.filter(n => !n.isActive).length;

  return {
    totalTeamSize: 1 + downline.length, // Include self
    activeCount,
    stalledCount,
    newThisMonth,
    totalTeamSalesThisMonth,
    salesByLevel,
    teamByLevel,
  };
}

/**
 * Updates sales data for a node (called after order settlement)
 */
export function updateNodeSales(ambassadorId: string, saleAmount: number): void {
  const node = teamNodes.get(ambassadorId);
  if (!node) return;

  node.personalSalesThisMonth += saleAmount;
  node.teamSalesThisMonth += saleAmount;
  node.updatedAt = new Date().toISOString();

  // Propagate sales up the upline
  const upline = getUpline(ambassadorId);
  for (const ancestorNode of upline) {
    ancestorNode.teamSalesThisMonth += saleAmount;
    ancestorNode.updatedAt = new Date().toISOString();
  }
}

/**
 * Updates active status based on sales metrics
 */
export function updateActiveStatus(ambassadorId: string, isActive: boolean): void {
  const node = teamNodes.get(ambassadorId);
  if (!node) return;

  node.isActive = isActive;
  node.updatedAt = new Date().toISOString();
}

/**
 * Gets all ambassadors at a specific level from root
 */
export function getAmbassadorsByLevel(level: number): TeamNode[] {
  return Array.from(teamNodes.values()).filter(node => node.level === level);
}

/**
 * Finds ambassadors without activity in N days
 */
export function getInactiveAmbassadors(daysSinceLastActivity: number = 7): TeamNode[] {
  const threshold = new Date(Date.now() - daysSinceLastActivity * 24 * 60 * 60 * 1000);

  return Array.from(teamNodes.values()).filter(node => {
    const lastUpdate = new Date(node.updatedAt);
    return lastUpdate < threshold;
  });
}

/**
 * Gets ambassador node by ID
 */
export function getNode(ambassadorId: string): TeamNode | null {
  return teamNodes.get(ambassadorId) || null;
}

/**
 * Resets monthly sales for all ambassadors (called at month boundary)
 */
export function resetMonthlySales(): void {
  teamNodes.forEach(node => {
    node.personalSalesThisMonth = 0;
    // teamSalesThisMonth is recalculated from downline
    node.updatedAt = new Date().toISOString();
  });
}

/**
 * Gets total commission potential for an ambassador based on team structure
 */
export function getCommissionPotential(
  ambassadorId: string,
  commissionRates: Record<number, number>
): {
  currentMonthEarnings: number;
  estimatedMonthlyCapacity: number;
  breakdownByLevel: Record<number, number>;
} {
  const node = teamNodes.get(ambassadorId);
  if (!node) {
    return { currentMonthEarnings: 0, estimatedMonthlyCapacity: 0, breakdownByLevel: {} };
  }

  const downline = getDownline(ambassadorId);
  const breakdownByLevel: Record<number, number> = {};
  let currentMonthEarnings = 0;
  let estimatedMonthlyCapacity = 0;

  // Calculate current month earnings based on actual sales
  const selfRate = commissionRates[0] || 0;
  currentMonthEarnings += (node.personalSalesThisMonth || 0) * selfRate;

  for (const downlineNode of downline) {
    const level = downlineNode.level - node.level;
    if (level > 0 && commissionRates[level]) {
      const rate = commissionRates[level];
      const earnings = (downlineNode.personalSalesThisMonth || 0) * rate;
      currentMonthEarnings += earnings;

      if (!breakdownByLevel[level]) breakdownByLevel[level] = 0;
      breakdownByLevel[level] += earnings;
    }
  }

  // Estimate capacity assuming each active member does $500/month avg
  estimatedMonthlyCapacity = (node.personalSalesThisMonth || 0) * selfRate;
  for (const downlineNode of downline) {
    const level = downlineNode.level - node.level;
    if (level > 0 && downlineNode.isActive && commissionRates[level]) {
      const rate = commissionRates[level];
      estimatedMonthlyCapacity += 500 * rate; // Assume $500/month per active member
    }
  }

  return {
    currentMonthEarnings,
    estimatedMonthlyCapacity,
    breakdownByLevel,
  };
}

/**
 * Exports entire tree structure (for analytics/reporting)
 */
export function exportTree(): TeamNode[] {
  return Array.from(teamNodes.values());
}

/**
 * Clears all data (for testing)
 */
export function clearTree(): void {
  teamNodes.clear();
  sponsorshipMap.clear();
}
