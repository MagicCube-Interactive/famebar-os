/**
 * FameBar OS $FAME Token Calculation Engine
 *
 * Manages token rewards, founder boost multipliers, and Hold-to-Save discounts.
 *
 * Token Economics:
 * - Base rate: 10 $FAME per $1 of revenue (order total)
 * - Founders Boost: 2.0x multiplier for first 20 ambassadors, valid for 6 months from registration
 * - Hold-to-Save: Discount tiers based on $FAME holdings
 *   - 10,000+ tokens: 5% discount
 *   - 25,000+ tokens: 10% discount
 *   - 50,000+ tokens: 15% discount
 *   - 100,000+ tokens: 20% discount
 */

import {
  TokenEvent,
  PLATFORM_CONFIG,
  HOLD_TO_SAVE_TIERS,
} from '../../types/index';

/**
 * Hold-to-Save discount result
 */
export interface HoldToSaveResult {
  discountPercent: number;
  discountAmount: number;
  discountedTotal: number;
}

/**
 * Get the founder boost multiplier based on registration date
 *
 * First 20 ambassadors (founders) receive 2.0x multiplier on tokens for 6 months.
 * After 6 months, multiplier reverts to 1.0x.
 *
 * @param isFounder - Whether ambassador is in first 20
 * @param founderStartDate - ISO 8601 timestamp when ambassador registered
 * @returns Multiplier (2.0 if active founder period, 1.0 otherwise)
 *
 * @example
 * // Founder registered today
 * getFounderMultiplier(true, new Date().toISOString()) // Returns 2.0
 *
 * // Founder registered 7 months ago (boost expired)
 * const sevenMonthsAgo = new Date();
 * sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
 * getFounderMultiplier(true, sevenMonthsAgo.toISOString()) // Returns 1.0
 *
 * // Non-founder
 * getFounderMultiplier(false, new Date().toISOString()) // Returns 1.0
 */
export function getFounderMultiplier(isFounder: boolean, founderStartDate?: string): number {
  if (!isFounder || !founderStartDate) {
    return 1.0;
  }

  const startDate = new Date(founderStartDate);
  const now = new Date();

  // Calculate months elapsed
  const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());

  // If 6 months or more have passed, boost is expired
  if (monthsElapsed >= PLATFORM_CONFIG.FOUNDER_BOOST_DURATION_MONTHS) {
    return 1.0;
  }

  return PLATFORM_CONFIG.FOUNDER_BOOST_MULTIPLIER;
}

/**
 * Get Hold-to-Save discount percentage based on $FAME token balance
 *
 * Higher token holdings unlock greater discounts on personal orders.
 * Tiers are cumulative (e.g., 100,000+ tokens gets 20%, not 5+10+15+20).
 *
 * @param fameBalance - Current $FAME token balance
 * @returns Discount percentage (0, 5, 10, 15, or 20)
 *
 * @example
 * getHoldToSaveDiscount(5000) // Returns 0
 * getHoldToSaveDiscount(10000) // Returns 5
 * getHoldToSaveDiscount(25000) // Returns 10
 * getHoldToSaveDiscount(50000) // Returns 15
 * getHoldToSaveDiscount(100000) // Returns 20
 * getHoldToSaveDiscount(150000) // Returns 20
 */
export function getHoldToSaveDiscount(fameBalance: number): number {
  // Check tiers in descending order
  if (fameBalance >= 100000) return 20;
  if (fameBalance >= 50000) return 15;
  if (fameBalance >= 25000) return 10;
  if (fameBalance >= 10000) return 5;
  return 0;
}

/**
 * Apply Hold-to-Save discount to an order total
 *
 * Calculates the discount based on ambassador's current $FAME holdings
 * and applies it to the order total.
 *
 * @param orderTotal - Order amount before discount (dollars)
 * @param fameBalance - Ambassador's current $FAME token balance
 * @returns Object containing discount details and discounted total
 *
 * @example
 * const result = applyHoldToSaveDiscount(100.00, 50000);
 * // Returns {
 * //   discountPercent: 15,
 * //   discountAmount: 15.00,
 * //   discountedTotal: 85.00
 * // }
 */
export function applyHoldToSaveDiscount(
  orderTotal: number,
  fameBalance: number,
): HoldToSaveResult {
  const discountPercent = getHoldToSaveDiscount(fameBalance);
  const discountAmount = Math.round((orderTotal * discountPercent) / 100 * 100) / 100;
  const discountedTotal = Math.round((orderTotal - discountAmount) * 100) / 100;

  return {
    discountPercent,
    discountAmount,
    discountedTotal,
  };
}

/**
 * Calculate tokens earned for an order
 *
 * Base rate is 10 $FAME per $1 of revenue. If ambassador is a founder
 * within the 6-month boost window, tokens are multiplied by 2.0x.
 *
 * @param orderTotal - Order amount in dollars (after any discounts applied)
 * @param ambassadorId - Firebase UID of the ambassador earning tokens
 * @param isFounder - Whether ambassador was in first 20
 * @param founderStartDate - ISO 8601 timestamp of ambassador registration
 * @param orderId - Unique order identifier
 * @returns TokenEvent object ready to be persisted
 *
 * @remarks
 * - Tokens are always rounded to nearest whole number
 * - Token amount = (orderTotal × TOKENS_PER_DOLLAR) × founderMultiplier
 * - Event created with 'pending' status (becomes 'available' after settlement)
 *
 * @example
 * // Regular ambassador earning tokens
 * const event = calculateTokensForOrder(25.00, 'amb123', false, undefined, 'ord456');
 * // Returns TokenEvent with finalTokens: 250 (25 × 10)
 *
 * // Founder earning tokens with boost active
 * const event = calculateTokensForOrder(25.00, 'amb123', true, new Date().toISOString(), 'ord456');
 * // Returns TokenEvent with finalTokens: 500 (25 × 10 × 2.0)
 */
export function calculateTokensForOrder(
  orderTotal: number,
  ambassadorId: string,
  isFounder: boolean = false,
  founderStartDate?: string,
  orderId?: string,
): TokenEvent {
  const now = new Date().toISOString();

  // Calculate base tokens
  const tokensEarned = Math.round(orderTotal * PLATFORM_CONFIG.TOKENS_PER_DOLLAR);

  // Apply founder multiplier if applicable
  const founderMultiplier = getFounderMultiplier(isFounder, founderStartDate);
  const finalTokens = Math.round(tokensEarned * founderMultiplier);

  return {
    eventId: crypto.randomUUID(),
    ambassadorId,
    orderId: orderId || '',
    tokensEarned,
    founderMultiplier,
    finalTokens,
    status: 'pending',
    createdAt: now,
  };
}

/**
 * Calculate the total token value in USD
 *
 * Each $FAME token has a fixed exchange rate defined in PLATFORM_CONFIG.
 * Default is 1 $FAME = $0.01 USD.
 *
 * @param tokenAmount - Number of $FAME tokens
 * @returns USD value of tokens
 *
 * @example
 * calculateTokenValue(1000) // Returns 10.00 (assuming 1 token = $0.01)
 * calculateTokenValue(500) // Returns 5.00
 */
export function calculateTokenValue(tokenAmount: number): number {
  return Math.round(tokenAmount * PLATFORM_CONFIG.FAME_TO_USD * 100) / 100;
}

/**
 * Calculate how many tokens are needed to reach a specific Hold-to-Save tier
 *
 * @param targetTier - Target discount tier (0, 5, 10, 15, or 20)
 * @returns Tokens required to reach that tier, or 0 if tier is invalid
 *
 * @example
 * getTokensForTier(5) // Returns 10000
 * getTokensForTier(15) // Returns 50000
 * getTokensForTier(20) // Returns 100000
 * getTokensForTier(0) // Returns 0
 */
export function getTokensForTier(targetTier: 0 | 5 | 10 | 15 | 20): number {
  const entries = Object.entries(HOLD_TO_SAVE_TIERS);
  for (const [tokens, discount] of entries) {
    if (discount === targetTier) {
      return parseInt(tokens, 10);
    }
  }
  return targetTier === 0 ? 0 : -1; // -1 indicates invalid tier
}

/**
 * Get all Hold-to-Save tiers in order with requirements
 *
 * @returns Array of tier objects with token requirements and discounts
 *
 * @example
 * const tiers = getAllHoldToSaveTiers();
 * // Returns [
 * //   { tokens: 0, discount: 0, name: 'Starter' },
 * //   { tokens: 10000, discount: 5, name: 'Bronze' },
 * //   { tokens: 25000, discount: 10, name: 'Silver' },
 * //   { tokens: 50000, discount: 15, name: 'Gold' },
 * //   { tokens: 100000, discount: 20, name: 'Platinum' }
 * // ]
 */
export interface HoldToSaveTier {
  tokens: number;
  discount: number;
  name: string;
}

export function getAllHoldToSaveTiers(): HoldToSaveTier[] {
  const tierNames: Record<number, string> = {
    0: 'Starter',
    5: 'Bronze',
    10: 'Silver',
    15: 'Gold',
    20: 'Platinum',
  };

  const tiers: HoldToSaveTier[] = [{ tokens: 0, discount: 0, name: tierNames[0] }];

  const entries = Object.entries(HOLD_TO_SAVE_TIERS).sort(
    ([tokensA], [tokensB]) => parseInt(tokensA, 10) - parseInt(tokensB, 10),
  );

  for (const [tokens, discount] of entries) {
    tiers.push({
      tokens: parseInt(tokens, 10),
      discount,
      name: tierNames[discount],
    });
  }

  return tiers;
}

/**
 * Calculate progress toward next Hold-to-Save tier
 *
 * @param currentBalance - Current $FAME token balance
 * @returns Object with current tier, next tier, tokens needed, and progress
 *
 * @example
 * const progress = getHoldToSaveProgress(35000);
 * // Returns {
 * //   currentTier: { tokens: 25000, discount: 10 },
 * //   nextTier: { tokens: 50000, discount: 15 },
 * //   tokensNeeded: 15000,
 * //   progressPercent: 70
 * // }
 */
export interface HoldToSaveProgress {
  currentTier: { tokens: number; discount: number };
  nextTier: { tokens: number; discount: number } | null;
  tokensNeeded: number;
  progressPercent: number;
}

export function getHoldToSaveProgress(currentBalance: number): HoldToSaveProgress {
  const allTiers = getAllHoldToSaveTiers();

  let currentTierIdx = 0;
  for (let i = allTiers.length - 1; i >= 0; i--) {
    if (currentBalance >= allTiers[i].tokens) {
      currentTierIdx = i;
      break;
    }
  }

  const currentTier = allTiers[currentTierIdx];
  const nextTier = currentTierIdx < allTiers.length - 1 ? allTiers[currentTierIdx + 1] : null;

  let tokensNeeded = 0;
  let progressPercent = 100;

  if (nextTier) {
    tokensNeeded = Math.max(0, nextTier.tokens - currentBalance);
    const tierRange = nextTier.tokens - currentTier.tokens;
    const progressTowardNext = currentBalance - currentTier.tokens;
    progressPercent = Math.round((progressTowardNext / tierRange) * 100);
  }

  return {
    currentTier: { tokens: currentTier.tokens, discount: currentTier.discount },
    nextTier: nextTier ? { tokens: nextTier.tokens, discount: nextTier.discount } : null,
    tokensNeeded,
    progressPercent,
  };
}
