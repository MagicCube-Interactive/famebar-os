/**
 * FameClub Commission Settlement & Clawback Engine
 *
 * Manages the settlement lifecycle of commissions and tokens:
 * - Orders enter "pending" status and stay there for 14 days
 * - After 14 days with successful payment, move to "available" for withdrawal
 * - On refund, clawback ALL commissions and tokens up the entire sponsor chain
 *
 * This is critical for fraud prevention and consumer protection.
 */

import {
  Order,
  CommissionEvent,
  TokenEvent,
  SettlementStatus,
  CommissionStatus,
  TokenStatus,
  PLATFORM_CONFIG,
} from '../../types/index';

/**
 * Settlement configuration with timing and rules
 */
export interface SettlementConfig {
  windowDays: number;
  allowManualAdjustments: boolean;
}

/**
 * Clawback result showing all reversals
 */
export interface ClawbackResult {
  success: boolean;
  orderId: string;
  commissionsClaimed: string[];
  tokensClaimed: string[];
  totalCommissionClawedBack: number;
  totalTokensClawedBack: number;
  errors: string[];
}

/**
 * Settlement check result
 */
export interface SettlementCheckResult {
  ordersSettled: number;
  totalCommissionsReleased: number;
  totalTokensReleased: number;
  errors: string[];
}

/**
 * Get the settlement window duration in days
 *
 * @returns Number of days before commissions/tokens become available
 *
 * @example
 * const window = getSettlementWindow();
 * // Returns 14 (default from PLATFORM_CONFIG)
 */
export function getSettlementWindow(): number {
  return PLATFORM_CONFIG.SETTLEMENT_WINDOW_DAYS;
}

/**
 * Determine if an order is eligible for settlement
 *
 * An order can be settled if:
 * 1. Payment status is 'completed'
 * 2. Settlement status is 'pending'
 * 3. Order was created at least SETTLEMENT_WINDOW_DAYS ago
 *
 * @param order - Order object to check
 * @returns true if order can be settled, false otherwise
 *
 * @example
 * const canSettle = isOrderSettleable(order);
 * if (canSettle) {
 *   settleOrder(order.orderId);
 * }
 */
export function isOrderSettleable(order: Order): boolean {
  // Must be successfully paid
  if (order.paymentStatus !== 'completed') {
    return false;
  }

  // Must not already be settled/refunded/clawed back
  if (order.settlementStatus !== 'pending') {
    return false;
  }

  // Check if settlement window has passed
  const createdDate = new Date(order.createdAt);
  const now = new Date();
  const daysElapsed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysElapsed >= getSettlementWindow();
}

/**
 * Calculate the settlement date for an order
 *
 * @param createdAt - ISO 8601 timestamp when order was created
 * @returns ISO 8601 timestamp when order will be eligible for settlement
 *
 * @example
 * const settlementDate = getSettlementDate(order.createdAt);
 * // Returns a date 14 days in the future
 */
export function getSettlementDate(createdAt: string): string {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + getSettlementWindow());
  return date.toISOString();
}

/**
 * Check if an order is within the settlement window
 *
 * Returns true if order was created within the last N days (where N is settlement window)
 *
 * @param createdAt - ISO 8601 timestamp when order was created
 * @returns true if still within settlement window
 *
 * @example
 * const withinWindow = isWithinSettlementWindow(order.createdAt);
 * if (withinWindow) {
 *   console.log('Commissions still pending...');
 * }
 */
export function isWithinSettlementWindow(createdAt: string): boolean {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const daysElapsed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysElapsed < getSettlementWindow();
}

/**
 * Get all commission events for clawback (up the entire sponsor chain)
 *
 * Returns all CommissionEvent objects associated with an order.
 * These will be reversed if the order is refunded or clawed back.
 *
 * @param orderId - Order to retrieve commission chain for
 * @param commissionEvents - All commission events in system (or filtered to order)
 * @returns Array of CommissionEvent objects to clawback
 *
 * @remarks
 * In practice, you would query your Firestore collection for events
 * matching this orderId. This function is a utility for the clawback logic.
 *
 * @example
 * const events = getClawbackChain('order123', allCommissions);
 * // Returns all commission events from all tiers for this order
 */
export function getClawbackChain(
  orderId: string,
  commissionEvents: CommissionEvent[],
): CommissionEvent[] {
  return commissionEvents.filter((event) => event.orderId === orderId);
}

/**
 * Get all token events for clawback
 *
 * Returns all TokenEvent objects associated with an order.
 *
 * @param orderId - Order to retrieve token events for
 * @param tokenEvents - All token events in system (or filtered to order)
 * @returns Array of TokenEvent objects to clawback
 *
 * @example
 * const tokens = getTokenClawbackChain('order123', allTokens);
 * // Returns all token events for this order
 */
export function getTokenClawbackChain(
  orderId: string,
  tokenEvents: TokenEvent[],
): TokenEvent[] {
  return tokenEvents.filter((event) => event.orderId === orderId);
}

/**
 * Process a clawback for a refunded/cancelled order
 *
 * Claws back ALL commissions and tokens that were earned from this order
 * up the entire sponsor chain. This must happen regardless of whether
 * the commissions have been paid yet.
 *
 * After clawback:
 * - All commission events get status 'clawedback' with clawbackAmount set
 * - All token events get status 'clawedback' with clawbackAmount set
 * - Order settlement status becomes 'clawedback' or 'refunded'
 *
 * @param orderId - Order being refunded
 * @param commissionEvents - All commission events for the order (fetch from DB)
 * @param tokenEvents - All token events for the order (fetch from DB)
 * @returns Clawback result with details
 *
 * @remarks
 * This function calculates what should be clawed back but does NOT
 * update the database. Callers must handle persistence.
 *
 * @example
 * const result = processRefund('order123', commissions, tokens);
 * if (result.success) {
 *   // Update all commission and token events in database
 *   // Update order settlement status
 * }
 */
export function processRefund(
  orderId: string,
  commissionEvents: CommissionEvent[],
  tokenEvents: TokenEvent[],
): ClawbackResult {
  const errors: string[] = [];
  const commissionsClaimed: string[] = [];
  const tokensClaimed: string[] = [];
  let totalCommissionClawedBack = 0;
  let totalTokensClawedBack = 0;

  // Get commissions for this order
  const orderCommissions = getClawbackChain(orderId, commissionEvents);
  for (const event of orderCommissions) {
    // Only clawback pending or available commissions
    // (paid commissions cannot be clawed back in this version)
    if (event.status === 'pending' || event.status === 'available') {
      commissionsClaimed.push(event.commissionId);
      totalCommissionClawedBack += event.amount;
    } else if (event.status === 'paid') {
      errors.push(
        `Cannot clawback paid commission ${event.commissionId} for ambassador ${event.ambassadorId}. Contact support.`,
      );
    }
  }

  // Get tokens for this order
  const orderTokens = getTokenClawbackChain(orderId, tokenEvents);
  for (const event of orderTokens) {
    // Only clawback pending or available tokens
    if (event.status === 'pending' || event.status === 'available') {
      tokensClaimed.push(event.eventId);
      totalTokensClawedBack += event.finalTokens;
    } else if (event.status === 'spent') {
      errors.push(
        `Cannot clawback spent tokens ${event.eventId} for ambassador ${event.ambassadorId}. Contact support.`,
      );
    }
  }

  return {
    success: errors.length === 0,
    orderId,
    commissionsClaimed,
    tokensClaimed,
    totalCommissionClawedBack: Math.round(totalCommissionClawedBack * 100) / 100,
    totalTokensClawedBack,
    errors,
  };
}

/**
 * Mark an order as settled (move all pending commissions to available)
 *
 * After settlement window passes, move all pending commissions/tokens
 * to 'available' status so ambassadors can request withdrawal.
 *
 * @param orderId - Order to settle
 * @param commissionEvents - All commission events for order
 * @param tokenEvents - All token events for order
 * @returns Array of updated CommissionEvent and TokenEvent objects
 *
 * @remarks
 * Returns the updated events but does not persist to database.
 * Callers must handle the save.
 *
 * @example
 * const settled = settleOrder('order123', commissions, tokens);
 * // settled.commissions = all with status='available'
 * // settled.tokens = all with status='available'
 */
export interface SettleOrderResult {
  orderId: string;
  commissions: CommissionEvent[];
  tokens: TokenEvent[];
  settlementDate: string;
}

export function settleOrder(
  orderId: string,
  commissionEvents: CommissionEvent[],
  tokenEvents: TokenEvent[],
): SettleOrderResult {
  const now = new Date().toISOString();

  // Mark all pending commissions as available
  const settledCommissions = commissionEvents
    .filter((event) => event.orderId === orderId && event.status === 'pending')
    .map((event) => ({
      ...event,
      status: 'available' as CommissionStatus,
      availableAt: now,
    }));

  // Mark all pending tokens as available
  const settledTokens = tokenEvents
    .filter((event) => event.orderId === orderId && event.status === 'pending')
    .map((event) => ({
      ...event,
      status: 'available' as TokenStatus,
      availableAt: now,
    }));

  return {
    orderId,
    commissions: settledCommissions,
    tokens: settledTokens,
    settlementDate: now,
  };
}

/**
 * Check which orders are ready for settlement
 *
 * Scans through orders and identifies those that have passed the
 * settlement window and are ready to be settled.
 *
 * @param orders - All orders to check
 * @returns Array of order IDs ready for settlement
 *
 * @example
 * const readyOrders = getOrdersReadyForSettlement(allOrders);
 * // Returns ['order123', 'order456', ...]
 */
export function getOrdersReadyForSettlement(orders: Order[]): string[] {
  return orders
    .filter((order) => isOrderSettleable(order))
    .map((order) => order.orderId);
}

/**
 * Calculate total commissions/tokens that need to be settled
 *
 * @param commissionEvents - All commission events
 * @param tokenEvents - All token events
 * @param orderIds - Specific order IDs to calculate for
 * @returns Settlement totals
 *
 * @example
 * const totals = calculateSettlementTotals(commissions, tokens, readyOrders);
 * console.log(`Settling $${totals.totalCommissions} in commissions`);
 */
export interface SettlementTotals {
  totalCommissions: number;
  totalTokens: number;
  commissionCount: number;
  tokenCount: number;
}

export function calculateSettlementTotals(
  commissionEvents: CommissionEvent[],
  tokenEvents: TokenEvent[],
  orderIds: string[],
): SettlementTotals {
  let totalCommissions = 0;
  let totalTokens = 0;
  let commissionCount = 0;
  let tokenCount = 0;

  const orderIdSet = new Set(orderIds);

  for (const event of commissionEvents) {
    if (orderIdSet.has(event.orderId) && event.status === 'pending') {
      totalCommissions += event.amount;
      commissionCount++;
    }
  }

  for (const event of tokenEvents) {
    if (orderIdSet.has(event.orderId) && event.status === 'pending') {
      totalTokens += event.finalTokens;
      tokenCount++;
    }
  }

  return {
    totalCommissions: Math.round(totalCommissions * 100) / 100,
    totalTokens,
    commissionCount,
    tokenCount,
  };
}

/**
 * Get audit info for settlement
 *
 * Returns formatted information about what's being settled
 *
 * @param orderId - Order being settled
 * @param order - Order object
 * @param commissionTotal - Total commissions being settled
 * @param tokenTotal - Total tokens being settled
 * @returns Audit log entry info
 *
 * @example
 * const audit = getSettlementAuditInfo(order);
 * // Returns details for logging
 */
export interface SettlementAuditInfo {
  orderId: string;
  action: string;
  details: {
    orderTotal: number;
    commissionTotal: number;
    tokenTotal: number;
    previousStatus: SettlementStatus;
    newStatus: SettlementStatus;
    settledAt: string;
  };
}

export function getSettlementAuditInfo(
  orderId: string,
  order: Order,
  commissionTotal: number,
  tokenTotal: number,
): SettlementAuditInfo {
  const now = new Date().toISOString();

  return {
    orderId,
    action: 'order_settlement',
    details: {
      orderTotal: order.total,
      commissionTotal,
      tokenTotal,
      previousStatus: order.settlementStatus,
      newStatus: 'settled',
      settledAt: now,
    },
  };
}

/**
 * Validate that a clawback is permitted
 *
 * Some situations may prevent clawbacks (e.g., commissions already paid out
 * for too long, legal requirements, etc.)
 *
 * @param order - Order being clawed back
 * @param commissionEvents - Associated commissions
 * @returns Validation result
 *
 * @example
 * const validation = validateClawbackPermitted(order, commissions);
 * if (!validation.permitted) {
 *   console.error('Clawback denied:', validation.reason);
 * }
 */
export interface ClawbackValidation {
  permitted: boolean;
  reason?: string;
}

export function validateClawbackPermitted(
  order: Order,
  commissionEvents: CommissionEvent[],
): ClawbackValidation {
  // Check if order is already clawed back
  if (order.settlementStatus === 'clawedback') {
    return {
      permitted: false,
      reason: 'Order already clawed back',
    };
  }

  // Check if commissions have been paid (would need special handling)
  const paidCommissions = commissionEvents.filter(
    (event) => event.orderId === order.orderId && event.status === 'paid',
  );

  if (paidCommissions.length > 0) {
    // Could implement a time limit here - e.g., can't clawback if paid >30 days ago
    // For now, we flag it but allow it with a warning
    return {
      permitted: true,
      reason: `Warning: ${paidCommissions.length} commission(s) already paid. Requires manual handling.`,
    };
  }

  return { permitted: true };
}
