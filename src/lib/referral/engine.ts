/**
 * Referral Attribution Engine for FameBar OS
 * Handles referral code generation, validation, and anti-abuse checks
 */

import {
  ReferralCode,
  ReferralCodeType,
  AmbassadorProfile,
  COMMISSION_TIER_CONFIG,
} from '@/types';
import crypto from 'crypto';

// In-memory storage (replace with real DB calls)
const referralCodes = new Map<string, ReferralCode>();
const sessionLocks = new Map<string, { code: string; timestamp: number }>();
const codeUsageCache = new Map<string, { buyerIds: Set<string>; ipAddresses: Set<string>; paymentMethods: Set<string> }>();

/**
 * Generates a unique, URL-safe referral code
 * Primary codes: permanent, single code per ambassador
 * Campaign/event codes: time-limited, multiple codes allowed
 */
export function generateReferralCode(
  ambassadorId: string,
  type: ReferralCodeType,
  campaignName?: string,
  expiresIn?: number // days until expiration
): ReferralCode {
  // Generate 8-character URL-safe code
  const code = generateUniqueCode();

  const expiresAt = type === 'primary'
    ? undefined // Primary codes never expire
    : expiresIn
    ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // Default 90 days

  const referralCode: ReferralCode = {
    code,
    ambassadorId,
    type,
    campaignName,
    expiresAt,
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  referralCodes.set(code, referralCode);
  initializeCodeUsageTracking(code);

  return referralCode;
}

/**
 * Creates a campaign-specific referral code
 * Shorthand for campaign code generation
 */
export function createCampaignCode(
  ambassadorId: string,
  campaignName: string,
  expiresAt?: string
): ReferralCode {
  const code = generateUniqueCode();
  const expiresDate = expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const referralCode: ReferralCode = {
    code,
    ambassadorId,
    type: 'campaign',
    campaignName,
    expiresAt: expiresDate,
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  referralCodes.set(code, referralCode);
  initializeCodeUsageTracking(code);

  return referralCode;
}

/**
 * Resolves a referral code and returns its metadata
 */
export function resolveReferralCode(code: string): {
  ambassadorId?: string;
  type?: ReferralCodeType;
  isValid: boolean;
  isExpired: boolean;
  code?: ReferralCode;
} {
  const referralCode = referralCodes.get(code);

  if (!referralCode) {
    return { isValid: false, isExpired: false };
  }

  const now = new Date();
  const isExpired = !!(referralCode.expiresAt && new Date(referralCode.expiresAt) < now);

  return {
    ambassadorId: referralCode.ambassadorId,
    type: referralCode.type,
    isValid: referralCode.isActive && !isExpired,
    isExpired,
    code: referralCode,
  };
}

/**
 * Locks a referral session to prevent mid-checkout code changes
 * Important for fraud prevention: ensures buyer can't swap codes mid-transaction
 */
export function lockReferralSession(buyerSessionId: string, referralCode: string): void {
  sessionLocks.set(buyerSessionId, {
    code: referralCode,
    timestamp: Date.now(),
  });
}

/**
 * Retrieves locked referral code for a session (within 30min window)
 */
export function getLockedReferralCode(buyerSessionId: string): string | null {
  const lock = sessionLocks.get(buyerSessionId);
  if (!lock) return null;

  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  if (lock.timestamp < thirtyMinutesAgo) {
    sessionLocks.delete(buyerSessionId);
    return null;
  }

  return lock.code;
}

/**
 * Gets ambassador profile/basic info by code
 */
export function getAmbassadorByCode(code: string): { ambassadorId: string; type: ReferralCodeType } | null {
  const referralCode = referralCodes.get(code);
  if (!referralCode) return null;

  return {
    ambassadorId: referralCode.ambassadorId,
    type: referralCode.type,
  };
}

/**
 * Validates code usage with anti-abuse checks
 * Prevents:
 * - Self-referral (ambassador using own code to buy)
 * - Same device/IP abuse (multiple accounts from same device)
 * - Payment method duplication
 * - Expired codes
 * - Inactive codes
 */
export function validateCodeUsage(
  code: string,
  buyerId: string,
  ambassadorId: string,
  ipAddress?: string,
  paymentMethod?: string
): {
  valid: boolean;
  reason?: string;
} {
  const resolved = resolveReferralCode(code);

  // Check code exists and is valid
  if (!resolved.isValid) {
    return { valid: false, reason: resolved.isExpired ? 'Code has expired' : 'Code not found or inactive' };
  }

  // Prevent self-referral
  if (resolved.ambassadorId === buyerId) {
    return { valid: false, reason: 'Cannot use your own referral code' };
  }

  // Track usage
  const usage = codeUsageCache.get(code);
  if (!usage) {
    return { valid: false, reason: 'Code tracking error' };
  }

  // Check for same-device abuse (multiple accounts from same IP/device)
  if (ipAddress && usage.ipAddresses.has(ipAddress)) {
    const recentCount = Array.from(usage.buyerIds).filter(id => {
      // In production, check if buyer created within last 7 days
      return true;
    }).length;

    if (recentCount > 2) {
      return { valid: false, reason: 'Too many signups from this device using same code' };
    }
  }

  // Check for payment method duplication
  if (paymentMethod && usage.paymentMethods.has(paymentMethod)) {
    // In production, check if payment method used within last 14 days for this code
    return { valid: false, reason: 'This payment method has already been used with this code' };
  }

  // Code is valid
  usage.buyerIds.add(buyerId);
  if (ipAddress) usage.ipAddresses.add(ipAddress);
  if (paymentMethod) usage.paymentMethods.add(paymentMethod);

  return { valid: true };
}

/**
 * Deactivates a referral code (prevents future use)
 */
export function deactivateCode(code: string): void {
  const referralCode = referralCodes.get(code);
  if (referralCode) {
    referralCode.isActive = false;
  }
}

/**
 * Records code usage (called after successful purchase)
 */
export function recordCodeUsage(code: string): void {
  const referralCode = referralCodes.get(code);
  if (referralCode) {
    referralCode.usageCount += 1;
    referralCode.lastUsedAt = new Date().toISOString();
  }
}

/**
 * Gets top performing codes for an ambassador
 */
export function getAmbassadorCodes(ambassadorId: string): ReferralCode[] {
  return Array.from(referralCodes.values())
    .filter(code => code.ambassadorId === ambassadorId)
    .sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Gets code performance stats
 */
export function getCodeStats(code: string): {
  code: string;
  ambassadorId: string;
  usageCount: number;
  type: ReferralCodeType;
  isActive: boolean;
  isExpired: boolean;
} | null {
  const referralCode = referralCodes.get(code);
  if (!referralCode) return null;

  const isExpired = !!(referralCode.expiresAt && new Date(referralCode.expiresAt) < new Date());

  return {
    code: referralCode.code,
    ambassadorId: referralCode.ambassadorId,
    usageCount: referralCode.usageCount,
    type: referralCode.type,
    isActive: referralCode.isActive,
    isExpired,
  };
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Generates a unique 8-character URL-safe code
 * Format: consonant-vowel pattern for memorability
 */
function generateUniqueCode(): string {
  const consonants = 'BCDFGHJKLMNPRSTVWXYZ';
  const vowels = 'AEIOUY';
  let code = '';

  for (let i = 0; i < 8; i++) {
    const isConsonant = i % 2 === 0;
    const chars = isConsonant ? consonants : vowels;
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Check uniqueness
  if (referralCodes.has(code)) {
    return generateUniqueCode();
  }

  return code;
}

/**
 * Initializes usage tracking for a new code
 */
function initializeCodeUsageTracking(code: string): void {
  codeUsageCache.set(code, {
    buyerIds: new Set(),
    ipAddresses: new Set(),
    paymentMethods: new Set(),
  });
}

/**
 * Cleanup: remove expired session locks (runs periodically in production)
 */
export function cleanupExpiredLocks(): void {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  const keysToDelete: string[] = [];

  sessionLocks.forEach((lock, key) => {
    if (lock.timestamp < thirtyMinutesAgo) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => sessionLocks.delete(key));
}
