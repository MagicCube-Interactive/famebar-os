/**
 * Commission Engine Test Suite
 *
 * Comprehensive tests for the 7-tier commission calculation system.
 * Tests cover normal cases, edge cases, active requirements, and validation.
 *
 * Test categories:
 * 1. Direct commission (Tier 0)
 * 2. Full 7-tier chains
 * 3. Partial chains
 * 4. Active status requirements
 * 5. Edge cases (zero orders, etc.)
 * 6. Validation logic
 * 7. Multiple orders
 */

import {
  calculateDirectCommission,
  calculateTierCommission,
  calculateCommissionChain,
  isAmbassadorActive,
  getCommissionRate,
  validateCommissionChain,
  calculateTotalCommissionPayout,
  getMaximumCommissionPayout,
  getCommissionBreakdown,
} from '../engine';
import { CommissionEvent, TeamNode, AmbassadorRank, PLATFORM_CONFIG } from '../../../types/index';

// ============================================================================
// TEST SETUP & HELPERS
// ============================================================================

/**
 * Create a mock team node for testing
 */
function createMockTeamNode(
  ambassadorId: string,
  sponsorId?: string,
  personalSalesThisMonth: number = 0,
  level: number = 0,
): TeamNode {
  const path: string[] = [ambassadorId];
  if (sponsorId) {
    path.unshift(sponsorId);
  }

  return {
    ambassadorId,
    sponsorId,
    level,
    directRecruits: [],
    path,
    personalSalesThisMonth,
    teamSalesThisMonth: personalSalesThisMonth,
    isActive: personalSalesThisMonth >= PLATFORM_CONFIG.ACTIVE_REQUIREMENT_AMOUNT,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create a mock team tree
 */
function createMockTeamTree(
  ambassadors: Array<{
    id: string;
    sponsorId?: string;
    personalSales?: number;
  }>,
): Record<string, TeamNode> {
  const tree: Record<string, TeamNode> = {};

  for (const amb of ambassadors) {
    tree[amb.id] = createMockTeamNode(amb.id, amb.sponsorId, amb.personalSales || 0);
  }

  // Build paths correctly
  for (const id in tree) {
    const node = tree[id];
    const path: string[] = [id];

    let current = node;
    while (current.sponsorId && tree[current.sponsorId]) {
      path.unshift(current.sponsorId);
      current = tree[current.sponsorId];
    }

    node.path = path;
  }

  return tree;
}

// ============================================================================
// TIER 0 (DIRECT) COMMISSION TESTS
// ============================================================================

describe('calculateDirectCommission', () => {
  test('should calculate 25% commission on $25 order', () => {
    const commission = calculateDirectCommission(25.0);
    expect(commission).toBe(6.25);
  });

  test('should calculate 25% commission on $100 order', () => {
    const commission = calculateDirectCommission(100.0);
    expect(commission).toBe(25.0);
  });

  test('should handle small orders correctly', () => {
    const commission = calculateDirectCommission(1.0);
    expect(commission).toBe(0.25);
  });

  test('should handle zero orders', () => {
    const commission = calculateDirectCommission(0.0);
    expect(commission).toBe(0.0);
  });

  test('should handle large orders', () => {
    const commission = calculateDirectCommission(1000.0);
    expect(commission).toBe(250.0);
  });
});

// ============================================================================
// TIER RATE TESTS
// ============================================================================

describe('getCommissionRate', () => {
  test('should return correct rates for all valid tiers', () => {
    expect(getCommissionRate(0)).toBe(0.25);
    expect(getCommissionRate(1)).toBe(0.1);
    expect(getCommissionRate(2)).toBe(0.05);
    expect(getCommissionRate(3)).toBe(0.04);
    expect(getCommissionRate(4)).toBe(0.03);
    expect(getCommissionRate(5)).toBe(0.02);
    expect(getCommissionRate(6)).toBe(0.01);
  });

  test('should throw error for invalid tier', () => {
    expect(() => getCommissionRate(-1)).toThrow();
    expect(() => getCommissionRate(7)).toThrow();
    expect(() => getCommissionRate(10)).toThrow();
  });
});

describe('calculateTierCommission', () => {
  test('should calculate Tier 0 (Direct) correctly', () => {
    expect(calculateTierCommission(25.0, 0)).toBe(6.25);
  });

  test('should calculate Tier 1 correctly', () => {
    expect(calculateTierCommission(25.0, 1)).toBe(2.5);
  });

  test('should calculate Tier 2 correctly', () => {
    expect(calculateTierCommission(25.0, 2)).toBe(1.25);
  });

  test('should calculate Tier 3 correctly', () => {
    expect(calculateTierCommission(25.0, 3)).toBe(1.0);
  });

  test('should calculate Tier 4 correctly', () => {
    expect(calculateTierCommission(25.0, 4)).toBe(0.75);
  });

  test('should calculate Tier 5 correctly', () => {
    expect(calculateTierCommission(25.0, 5)).toBe(0.5);
  });

  test('should calculate Tier 6 correctly', () => {
    expect(calculateTierCommission(25.0, 6)).toBe(0.25);
  });
});

// ============================================================================
// ACTIVE STATUS TESTS
// ============================================================================

describe('isAmbassadorActive', () => {
  test('should return false for sales below $300', () => {
    expect(isAmbassadorActive(250.0)).toBe(false);
    expect(isAmbassadorActive(299.99)).toBe(false);
  });

  test('should return true for sales at exactly $300', () => {
    expect(isAmbassadorActive(300.0)).toBe(true);
  });

  test('should return true for sales above $300', () => {
    expect(isAmbassadorActive(500.0)).toBe(true);
    expect(isAmbassadorActive(1000.0)).toBe(true);
  });

  test('should return true for tiers 0-3 regardless of sales', () => {
    expect(isAmbassadorActive(0, 0)).toBe(true);
    expect(isAmbassadorActive(0, 1)).toBe(true);
    expect(isAmbassadorActive(0, 2)).toBe(true);
    expect(isAmbassadorActive(0, 3)).toBe(true);
  });

  test('should return false for tier 4 with low sales', () => {
    expect(isAmbassadorActive(250.0, 4)).toBe(false);
  });

  test('should return true for tier 4 with $300+ sales', () => {
    expect(isAmbassadorActive(300.0, 4)).toBe(true);
  });

  test('should handle edge case of zero sales', () => {
    expect(isAmbassadorActive(0)).toBe(false);
  });
});

// ============================================================================
// COMMISSION CHAIN TESTS
// ============================================================================

describe('calculateCommissionChain', () => {
  test('should calculate single direct commission only', () => {
    const tree = createMockTeamTree([{ id: 'seller1' }]);

    const events = calculateCommissionChain('order1', 25.0, 'seller1', tree);

    expect(events).toHaveLength(1);
    expect(events[0].tier).toBe(0);
    expect(events[0].amount).toBe(6.25);
    expect(events[0].ambassadorId).toBe('seller1');
  });

  test('should calculate full 7-tier chain with all active', () => {
    const tree = createMockTeamTree([
      { id: 'level0', personalSales: 300 },
      { id: 'level1', sponsorId: 'level0', personalSales: 300 },
      { id: 'level2', sponsorId: 'level1', personalSales: 300 },
      { id: 'level3', sponsorId: 'level2', personalSales: 300 },
      { id: 'level4', sponsorId: 'level3', personalSales: 300 },
      { id: 'level5', sponsorId: 'level4', personalSales: 300 },
      { id: 'level6', sponsorId: 'level5', personalSales: 300 },
    ]);

    const events = calculateCommissionChain('order1', 25.0, 'level6', tree);

    expect(events).toHaveLength(7);
    expect(events[0].tier).toBe(0);
    expect(events[0].amount).toBe(6.25);
    expect(events[1].tier).toBe(1);
    expect(events[1].amount).toBe(2.5);
    expect(events[2].tier).toBe(2);
    expect(events[2].amount).toBe(1.25);
    expect(events[3].tier).toBe(3);
    expect(events[3].amount).toBe(1.0);
    expect(events[4].tier).toBe(4);
    expect(events[4].amount).toBe(0.75);
    expect(events[5].tier).toBe(5);
    expect(events[5].amount).toBe(0.5);
    expect(events[6].tier).toBe(6);
    expect(events[6].amount).toBe(0.25);
  });

  test('should verify total commission equals $12.50 for $25 order', () => {
    const tree = createMockTeamTree([
      { id: 'level0', personalSales: 300 },
      { id: 'level1', sponsorId: 'level0', personalSales: 300 },
      { id: 'level2', sponsorId: 'level1', personalSales: 300 },
      { id: 'level3', sponsorId: 'level2', personalSales: 300 },
      { id: 'level4', sponsorId: 'level3', personalSales: 300 },
      { id: 'level5', sponsorId: 'level4', personalSales: 300 },
      { id: 'level6', sponsorId: 'level5', personalSales: 300 },
    ]);

    const events = calculateCommissionChain('order1', 25.0, 'level6', tree);
    const total = events.reduce((sum, e) => sum + e.amount, 0);

    expect(total).toBeCloseTo(12.5, 2);
  });

  test('should skip tiers 4-6 when ambassador not active', () => {
    const tree = createMockTeamTree([
      { id: 'level0', personalSales: 300 },
      { id: 'level1', sponsorId: 'level0', personalSales: 300 },
      { id: 'level2', sponsorId: 'level1', personalSales: 300 },
      { id: 'level3', sponsorId: 'level2', personalSales: 300 },
      { id: 'level4', sponsorId: 'level3', personalSales: 200 }, // Below $300
      { id: 'level5', sponsorId: 'level4', personalSales: 200 },
      { id: 'level6', sponsorId: 'level5', personalSales: 200 },
    ]);

    const events = calculateCommissionChain('order1', 25.0, 'level6', tree);

    // Should have tiers 0, 1, 2, 3 only (4, 5, 6 skipped because level4, 5, 6 not active)
    expect(events.length).toBeLessThan(7);
    expect(events.every((e) => e.tier <= 3)).toBe(true);
  });

  test('should handle partial chain (only 3 levels deep)', () => {
    const tree = createMockTeamTree([
      { id: 'level0', personalSales: 300 },
      { id: 'level1', sponsorId: 'level0', personalSales: 300 },
      { id: 'level2', sponsorId: 'level1', personalSales: 300 },
    ]);

    const events = calculateCommissionChain('order1', 25.0, 'level2', tree);

    expect(events).toHaveLength(3);
    expect(events.map((e) => e.tier)).toEqual([0, 1, 2]);
  });

  test('should return empty array for unknown seller', () => {
    const tree = createMockTeamTree([{ id: 'level0' }]);

    const events = calculateCommissionChain('order1', 25.0, 'unknown_seller', tree);

    expect(events).toHaveLength(0);
  });

  test('should return empty array for zero order', () => {
    const tree = createMockTeamTree([{ id: 'level0' }]);

    const events = calculateCommissionChain('order1', 0.0, 'level0', tree);

    expect(events).toHaveLength(0);
  });

  test('should return empty array for negative order', () => {
    const tree = createMockTeamTree([{ id: 'level0' }]);

    const events = calculateCommissionChain('order1', -25.0, 'level0', tree);

    expect(events).toHaveLength(0);
  });

  test('should handle 10 unit order ($250)', () => {
    const tree = createMockTeamTree([
      { id: 'level0', personalSales: 300 },
      { id: 'level1', sponsorId: 'level0', personalSales: 300 },
      { id: 'level2', sponsorId: 'level1', personalSales: 300 },
    ]);

    const events = calculateCommissionChain('order1', 250.0, 'level2', tree);

    expect(events[0].amount).toBe(62.5); // Tier 0: 25% of $250
    expect(events[1].amount).toBe(25.0); // Tier 1: 10% of $250
    expect(events[2].amount).toBe(12.5); // Tier 2: 5% of $250

    const total = events.reduce((sum, e) => sum + e.amount, 0);
    expect(total).toBeCloseTo(100.0, 2); // 40% of $250
  });

  test('should have correct source ambassador ID', () => {
    const tree = createMockTeamTree([
      { id: 'level0', personalSales: 300 },
      { id: 'level1', sponsorId: 'level0', personalSales: 300 },
    ]);

    const events = calculateCommissionChain('order1', 25.0, 'level1', tree);

    expect(events.every((e) => e.sourceAmbassadorId === 'level1')).toBe(true);
  });

  test('should set all events to pending status', () => {
    const tree = createMockTeamTree([
      { id: 'level0', personalSales: 300 },
      { id: 'level1', sponsorId: 'level0', personalSales: 300 },
    ]);

    const events = calculateCommissionChain('order1', 25.0, 'level1', tree);

    expect(events.every((e) => e.status === 'pending')).toBe(true);
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('validateCommissionChain', () => {
  test('should validate empty chain', () => {
    const validation = validateCommissionChain([]);

    expect(validation.valid).toBe(true);
    expect(validation.totalPayout).toBe(0);
    expect(validation.errors).toHaveLength(0);
  });

  test('should validate single commission', () => {
    const events: CommissionEvent[] = [
      {
        commissionId: 'c1',
        orderId: 'o1',
        ambassadorId: 'a1',
        tier: 0,
        rate: 0.25,
        amount: 6.25,
        status: 'pending',
        sourceAmbassadorId: 'a1',
        createdAt: new Date().toISOString(),
      },
    ];

    const validation = validateCommissionChain(events);

    expect(validation.valid).toBe(true);
    expect(validation.totalPayout).toBe(6.25);
  });

  test('should detect negative commission amounts', () => {
    const events: CommissionEvent[] = [
      {
        commissionId: 'c1',
        orderId: 'o1',
        ambassadorId: 'a1',
        tier: 0,
        rate: 0.25,
        amount: -6.25,
        status: 'pending',
        sourceAmbassadorId: 'a1',
        createdAt: new Date().toISOString(),
      },
    ];

    const validation = validateCommissionChain(events);

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should accept valid 7-tier chain', () => {
    const events: CommissionEvent[] = [
      {
        commissionId: 'c0',
        orderId: 'o1',
        ambassadorId: 'a0',
        tier: 0,
        rate: 0.25,
        amount: 6.25,
        status: 'pending',
        sourceAmbassadorId: 'a0',
        createdAt: new Date().toISOString(),
      },
      {
        commissionId: 'c1',
        orderId: 'o1',
        ambassadorId: 'a1',
        tier: 1,
        rate: 0.1,
        amount: 2.5,
        status: 'pending',
        sourceAmbassadorId: 'a0',
        createdAt: new Date().toISOString(),
      },
      {
        commissionId: 'c2',
        orderId: 'o1',
        ambassadorId: 'a2',
        tier: 2,
        rate: 0.05,
        amount: 1.25,
        status: 'pending',
        sourceAmbassadorId: 'a0',
        createdAt: new Date().toISOString(),
      },
      {
        commissionId: 'c3',
        orderId: 'o1',
        ambassadorId: 'a3',
        tier: 3,
        rate: 0.04,
        amount: 1.0,
        status: 'pending',
        sourceAmbassadorId: 'a0',
        createdAt: new Date().toISOString(),
      },
      {
        commissionId: 'c4',
        orderId: 'o1',
        ambassadorId: 'a4',
        tier: 4,
        rate: 0.03,
        amount: 0.75,
        status: 'pending',
        sourceAmbassadorId: 'a0',
        createdAt: new Date().toISOString(),
      },
      {
        commissionId: 'c5',
        orderId: 'o1',
        ambassadorId: 'a5',
        tier: 5,
        rate: 0.02,
        amount: 0.5,
        status: 'pending',
        sourceAmbassadorId: 'a0',
        createdAt: new Date().toISOString(),
      },
      {
        commissionId: 'c6',
        orderId: 'o1',
        ambassadorId: 'a6',
        tier: 6,
        rate: 0.01,
        amount: 0.25,
        status: 'pending',
        sourceAmbassadorId: 'a0',
        createdAt: new Date().toISOString(),
      },
    ];

    const validation = validateCommissionChain(events);

    expect(validation.valid).toBe(true);
    expect(validation.totalPayout).toBeCloseTo(12.5, 2);
    expect(validation.errors).toHaveLength(0);
  });

  test('should warn if total payout is significantly below 50%', () => {
    const events: CommissionEvent[] = [
      {
        commissionId: 'c1',
        orderId: 'o1',
        ambassadorId: 'a1',
        tier: 0,
        rate: 0.25,
        amount: 6.25,
        status: 'pending',
        sourceAmbassadorId: 'a1',
        createdAt: new Date().toISOString(),
      },
    ];

    const validation = validateCommissionChain(events);

    expect(validation.warnings && validation.warnings.length > 0).toBe(true);
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('calculateTotalCommissionPayout', () => {
  test('should sum all commissions correctly', () => {
    const events: CommissionEvent[] = [
      {
        commissionId: 'c1',
        orderId: 'o1',
        ambassadorId: 'a1',
        tier: 0,
        rate: 0.25,
        amount: 6.25,
        status: 'pending',
        sourceAmbassadorId: 'a1',
        createdAt: new Date().toISOString(),
      },
      {
        commissionId: 'c2',
        orderId: 'o1',
        ambassadorId: 'a2',
        tier: 1,
        rate: 0.1,
        amount: 2.5,
        status: 'pending',
        sourceAmbassadorId: 'a1',
        createdAt: new Date().toISOString(),
      },
    ];

    const total = calculateTotalCommissionPayout(events);

    expect(total).toBeCloseTo(8.75, 2);
  });

  test('should return 0 for empty array', () => {
    const total = calculateTotalCommissionPayout([]);
    expect(total).toBe(0);
  });
});

describe('getMaximumCommissionPayout', () => {
  test('should return 50% of $25 order', () => {
    const max = getMaximumCommissionPayout(25.0);
    expect(max).toBe(12.5);
  });

  test('should return 50% of $100 order', () => {
    const max = getMaximumCommissionPayout(100.0);
    expect(max).toBe(50.0);
  });

  test('should return 50% of $250 order', () => {
    const max = getMaximumCommissionPayout(250.0);
    expect(max).toBe(125.0);
  });
});

describe('getCommissionBreakdown', () => {
  test('should return all tier amounts for $25 order', () => {
    const breakdown = getCommissionBreakdown(25.0);

    expect(breakdown[0]).toBe(6.25);
    expect(breakdown[1]).toBe(2.5);
    expect(breakdown[2]).toBe(1.25);
    expect(breakdown[3]).toBe(1.0);
    expect(breakdown[4]).toBe(0.75);
    expect(breakdown[5]).toBe(0.5);
    expect(breakdown[6]).toBe(0.25);
  });

  test('should sum to 50% of order', () => {
    const breakdown = getCommissionBreakdown(25.0);
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    expect(total).toBeCloseTo(12.5, 2);
  });

  test('should scale correctly for larger orders', () => {
    const breakdown = getCommissionBreakdown(100.0);

    expect(breakdown[0]).toBe(25.0);
    expect(breakdown[1]).toBe(10.0);
    expect(breakdown[2]).toBe(5.0);
  });
});
