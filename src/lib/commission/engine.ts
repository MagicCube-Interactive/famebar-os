/**
 * FameBar OS Commission Calculation Engine
 *
 * Core business logic for the 7-tier affiliate network commission structure.
 * This is a critical financial system that must be mathematically perfect.
 *
 * Commission Structure:
 * - Tier 0 (Direct): 25% = $6.25 per $25 unit
 * - Tier 1: 10% = $2.50
 * - Tier 2: 5% = $1.25
 * - Tier 3: 4% = $1.00
 * - Tier 4: 3% = $0.75 (requires active status: $300+ personal sales/month)
 * - Tier 5: 2% = $0.50 (requires active status)
 * - Tier 6: 1% = $0.25 (requires active status)
 *
 * Total: 50% community payout ($12.50 per $25 unit)
 */

import {
  CommissionEvent,
  AmbassadorRank,
  COMMISSION_TIER_CONFIG,
  PLATFORM_CONFIG,
  TeamNode,
  requiresActiveStatus,
} from '../../types/index';

/**
 * Commission validation result with detailed error information
 */
export interface CommissionValidation {
  valid: boolean;
  totalPayout: number;
  errors: string[];
  warnings?: string[];
}

/**
 * Team tree structure for sponsor chain lookup
 */
export interface TeamTree {
  [ambassadorId: string]: TeamNode;
}

/**
 * Calculate the direct commission for the selling ambassador (Tier 0)
 *
 * @param orderTotal - Total order amount in dollars
 * @returns Direct commission amount (25% of order)
 *
 * @example
 * calculateDirectCommission(25.00) // Returns 6.25
 * calculateDirectCommission(100.00) // Returns 25.00
 */
export function calculateDirectCommission(orderTotal: number): number {
  return orderTotal * COMMISSION_TIER_CONFIG[0];
}

/**
 * Get the commission rate for a specific tier
 *
 * @param tier - Tier level (0-6)
 * @returns Commission rate as decimal (0.25, 0.10, 0.05, etc.)
 * @throws Error if tier is invalid
 *
 * @example
 * getCommissionRate(0) // Returns 0.25
 * getCommissionRate(4) // Returns 0.03
 */
export function getCommissionRate(tier: AmbassadorRank): number {
  if (tier < 0 || tier > 6) {
    throw new Error(`Invalid tier: ${tier}. Must be between 0 and 6.`);
  }
  return COMMISSION_TIER_CONFIG[tier];
}

/**
 * Calculate commission amount for a specific tier
 *
 * @param orderTotal - Total order amount in dollars
 * @param tier - Tier level (0-6)
 * @returns Commission amount for that tier
 * @throws Error if tier is invalid
 *
 * @example
 * calculateTierCommission(25.00, 0) // Returns 6.25 (25%)
 * calculateTierCommission(25.00, 1) // Returns 2.50 (10%)
 * calculateTierCommission(25.00, 4) // Returns 0.75 (3%)
 */
export function calculateTierCommission(orderTotal: number, tier: AmbassadorRank): number {
  const rate = getCommissionRate(tier);
  return orderTotal * rate;
}

/**
 * Determine if an ambassador meets the active requirement for their tier
 *
 * Tiers 0-3: No active requirement (always available)
 * Tiers 4-6: Require $300+ in personal sales during current calendar month
 *
 * @param personalSalesThisMonth - Total personal sales in current month (dollars)
 * @param tier - Ambassador's tier level (optional, for context)
 * @returns true if ambassador qualifies as active, false otherwise
 *
 * @example
 * isAmbassadorActive(250.00) // Returns false (below $300 threshold)
 * isAmbassadorActive(300.00) // Returns true (meets threshold exactly)
 * isAmbassadorActive(500.00) // Returns true (exceeds threshold)
 */
export function isAmbassadorActive(personalSalesThisMonth: number, tier?: AmbassadorRank): boolean {
  // If tier is provided and doesn't require active status, always active
  if (tier !== undefined && !requiresActiveStatus(tier)) {
    return true;
  }

  return personalSalesThisMonth >= PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT;
}

/**
 * Calculate the entire commission chain for an order
 *
 * Walks up the sponsor hierarchy from the selling ambassador through all ancestors.
 * For each ancestor up to 6 levels deep, calculates commission at the appropriate tier.
 * Tiers 4-6 are only paid if the ancestor meets active status ($300+ personal sales).
 *
 * @param orderId - Unique order identifier
 * @param orderTotal - Total order amount (dollars)
 * @param sellingAmbassadorId - Firebase UID of the ambassador who made the sale
 * @param teamTree - Map of all ambassadors and their positions in the network
 * @returns Array of CommissionEvent objects, one per tier paid
 *
 * @remarks
 * - If sellingAmbassadorId is not in teamTree, returns empty array
 * - Commission chain is limited to 6 levels (Tiers 1-6)
 * - Tier 0 (direct) is calculated separately from the sponsor chain
 * - Tiers 4-6 are skipped if the ancestor is not active
 * - All amounts are rounded to 2 decimal places
 *
 * @example
 * // Full 7-tier chain: $25 order through all ancestors
 * const events = calculateCommissionChain('order123', 25.00, 'ambassador1', teamTree);
 * // Returns: array with up to 7 CommissionEvent objects
 *
 * // Partial chain: only 3 levels deep
 * const events = calculateCommissionChain('order456', 25.00, 'newAmbassador', teamTree);
 * // Returns: array with 3 CommissionEvent objects (Tiers 0, 1, 2)
 */
export function calculateCommissionChain(
  orderId: string,
  orderTotal: number,
  sellingAmbassadorId: string,
  teamTree: TeamTree,
): CommissionEvent[] {
  const events: CommissionEvent[] = [];
  const now = new Date().toISOString();

  // Validate inputs
  if (!sellingAmbassadorId || !teamTree[sellingAmbassadorId]) {
    return events;
  }

  if (orderTotal <= 0) {
    return events;
  }

  const sellingNode = teamTree[sellingAmbassadorId];

  // Calculate Tier 0 (Direct) commission for the selling ambassador
  const tier0Amount = calculateDirectCommission(orderTotal);
  events.push({
    commissionId: crypto.randomUUID(),
    orderId,
    ambassadorId: sellingAmbassadorId,
    tier: 0,
    rate: COMMISSION_TIER_CONFIG[0],
    amount: Math.round(tier0Amount * 100) / 100, // Round to 2 decimals
    status: 'pending',
    sourceAmbassadorId: sellingAmbassadorId,
    createdAt: now,
  });

  // Walk up the sponsor chain to calculate Tiers 1-6
  // path includes the selling ambassador at index 0, so sponsors start at index 1
  for (let tierIndex = 1; tierIndex <= 6 && tierIndex < sellingNode.path.length; tierIndex++) {
    const sponsorId = sellingNode.path[tierIndex];
    const sponsorNode = teamTree[sponsorId];

    if (!sponsorNode) {
      // Sponsor not found in tree, skip this tier
      continue;
    }

    // Determine current tier (0-6)
    const currentTier = tierIndex as AmbassadorRank;

    // Check if this tier requires active status
    const requiresActive = requiresActiveStatus(currentTier);

    // If active status is required, check if sponsor qualifies
    if (requiresActive && !isAmbassadorActive(sponsorNode.personalSalesThisMonth, currentTier)) {
      // Sponsor is not active, this commission is NOT paid
      // (not redistributed, just not paid at all)
      continue;
    }

    // Calculate commission for this tier
    const tierAmount = calculateTierCommission(orderTotal, currentTier);

    events.push({
      commissionId: crypto.randomUUID(),
      orderId,
      ambassadorId: sponsorId,
      tier: currentTier,
      rate: COMMISSION_TIER_CONFIG[currentTier],
      amount: Math.round(tierAmount * 100) / 100, // Round to 2 decimals
      status: 'pending',
      sourceAmbassadorId: sellingAmbassadorId,
      createdAt: now,
    });
  }

  return events;
}

/**
 * Validate a complete commission chain
 *
 * Ensures that:
 * - All commission amounts are positive
 * - Total payout does not exceed 50% of order
 * - All tiers are properly represented
 * - No duplicate tier entries for the same ambassador
 *
 * @param chain - Array of CommissionEvent objects to validate
 * @returns Validation result with status, total payout, and any errors found
 *
 * @example
 * const validation = validateCommissionChain(events);
 * if (!validation.valid) {
 *   console.error('Chain errors:', validation.errors);
 * }
 */
export function validateCommissionChain(chain: CommissionEvent[]): CommissionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const maxPayout = 0.5; // 50% of order

  // Check for empty chain
  if (!chain || chain.length === 0) {
    return {
      valid: true,
      totalPayout: 0,
      errors,
      warnings,
    };
  }

  // Get the order total from the first commission event
  // (We reconstruct it from the tier 0 commission if present)
  let orderTotal = 0;
  const tier0Event = chain.find((e) => e.tier === 0);
  if (tier0Event) {
    orderTotal = tier0Event.amount / COMMISSION_TIER_CONFIG[0];
  }

  let totalPayout = 0;
  const seenTiers: Set<string> = new Set();

  for (const event of chain) {
    // Validate commission amount is positive
    if (event.amount < 0) {
      errors.push(
        `Invalid commission amount: ${event.amount} for tier ${event.tier} (ambassador ${event.ambassadorId})`,
      );
    }

    // Validate tier is in valid range
    if (event.tier < 0 || event.tier > 6) {
      errors.push(`Invalid tier: ${event.tier}`);
    }

    // Check for duplicate tiers for same ambassador
    const tieKey = `${event.ambassadorId}_${event.tier}`;
    if (seenTiers.has(tieKey)) {
      errors.push(`Duplicate tier ${event.tier} for ambassador ${event.ambassadorId}`);
    }
    seenTiers.add(tieKey);

    totalPayout += event.amount;
  }

  // Check total payout against 50% limit
  if (orderTotal > 0) {
    const payoutPercent = totalPayout / orderTotal;
    if (payoutPercent > maxPayout + 0.0001) {
      // Small epsilon for floating point
      errors.push(
        `Total payout (${(payoutPercent * 100).toFixed(2)}%) exceeds maximum 50% of order (${totalPayout.toFixed(2)} > ${(orderTotal * maxPayout).toFixed(2)})`,
      );
    }

    if (payoutPercent < maxPayout - 0.01) {
      // Warn if significantly under 50%
      warnings.push(
        `Total payout (${(payoutPercent * 100).toFixed(2)}%) is below expected 50% of order`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    totalPayout: Math.round(totalPayout * 100) / 100,
    errors,
    warnings,
  };
}

/**
 * Calculate total commission payout for an order
 *
 * @param chain - Array of CommissionEvent objects
 * @returns Total amount committed to all tiers
 *
 * @example
 * const total = calculateTotalCommissionPayout(events);
 * // Returns 12.50 for a $25 order with full chain
 */
export function calculateTotalCommissionPayout(chain: CommissionEvent[]): number {
  return Math.round(chain.reduce((sum, event) => sum + event.amount, 0) * 100) / 100;
}

/**
 * Calculate the maximum possible commission for an order
 * (full 7-tier chain with all tiers active)
 *
 * @param orderTotal - Order amount in dollars
 * @returns Maximum commission (50% of order)
 *
 * @example
 * const max = getMaximumCommissionPayout(25.00);
 * // Returns 12.50
 */
export function getMaximumCommissionPayout(orderTotal: number): number {
  return Math.round(orderTotal * 0.5 * 100) / 100;
}

/**
 * Get the commission breakdown by tier for an order
 *
 * Useful for reporting and analytics
 *
 * @param orderTotal - Order amount in dollars
 * @returns Object mapping tier numbers to commission amounts
 *
 * @example
 * const breakdown = getCommissionBreakdown(25.00);
 * // Returns { 0: 6.25, 1: 2.50, 2: 1.25, 3: 1.00, 4: 0.75, 5: 0.50, 6: 0.25 }
 */
export function getCommissionBreakdown(
  orderTotal: number,
): Record<AmbassadorRank, number> {
  const breakdown: Record<AmbassadorRank, number> = {
    0: calculateTierCommission(orderTotal, 0),
    1: calculateTierCommission(orderTotal, 1),
    2: calculateTierCommission(orderTotal, 2),
    3: calculateTierCommission(orderTotal, 3),
    4: calculateTierCommission(orderTotal, 4),
    5: calculateTierCommission(orderTotal, 5),
    6: calculateTierCommission(orderTotal, 6),
  };

  // Round all to 2 decimals
  for (const tier of Object.keys(breakdown)) {
    breakdown[parseInt(tier) as AmbassadorRank] =
      Math.round(breakdown[parseInt(tier) as AmbassadorRank] * 100) / 100;
  }

  return breakdown;
}
