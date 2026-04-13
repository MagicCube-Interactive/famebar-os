/**
 * FameClub Direct-Selling Platform - Complete Type Definitions
 *
 * This file defines all data models for the 7-tier affiliate/MLM platform with
 * comprehensive business rules including community payouts, token rewards,
 * verification requirements, and settlement windows.
 */

// ============================================================================
// UTILITY TYPES & ENUMS
// ============================================================================

/**
 * User roles within the FameClub platform
 */
export type UserRole = 'ambassador' | 'admin';

/**
 * Order payment status lifecycle
 */
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * Commission settlement and clawback states
 */
export type CommissionStatus = 'pending' | 'available' | 'paid' | 'clawedback';

/**
 * Token transaction states
 */
export type TokenStatus = 'pending' | 'available' | 'spent' | 'clawedback';

/**
 * Settlement statuses for orders (separate from payment status)
 */
export type SettlementStatus = 'pending' | 'settled' | 'refunded' | 'clawedback';

/**
 * Ambassador rank/tier levels (0-6, where higher tier = deeper in network)
 */
export type AmbassadorRank = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Referral code types
 */
export type ReferralCodeType = 'primary' | 'campaign' | 'event';

/**
 * Campaign and event statuses
 */
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

/**
 * Message channel types
 */
export type MessageChannel = 'telegram' | 'signal' | 'email' | 'sms' | 'push';

/**
 * Event types
 */
export type EventType = 'online' | 'offline' | 'hybrid';

/**
 * Opt-in status for Telegram communications
 */
export type OptInStatus = 'opted_in' | 'opted_out' | 'pending';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Hold-to-Save discount tiers: Fame token balance mapped to discount percentage
 * Users holding 10,000+ $FAME tokens can get 5-20% personal order discount
 */
export const HOLD_TO_SAVE_TIERS = {
  10000: 5,    // 5% discount
  25000: 10,   // 10% discount
  50000: 15,   // 15% discount
  100000: 20,  // 20% discount
} as const;

/**
 * Commission rates by tier (0-6): 25/10/5/4/3/2/1%
 * Total 50% community payout split across all tiers
 * Tier 0 (direct ambassador) receives 25%
 */
export const COMMISSION_TIER_CONFIG = {
  0: 0.25,  // 25% - Direct recruitment
  1: 0.10,  // 10% - Tier 1 recruits
  2: 0.05,  // 5%  - Tier 2 recruits
  3: 0.04,  // 4%  - Tier 3 recruits
  4: 0.03,  // 3%  - Tier 4 recruits (requires $300/month)
  5: 0.02,  // 2%  - Tier 5 recruits (requires $300/month)
  6: 0.01,  // 1%  - Tier 6 recruits (requires $300/month)
} as const;

/**
 * Platform configuration for settlement and rewards
 */
export const PLATFORM_CONFIG = {
  /** Retail price per unit */
  RETAIL_PRICE: 25.00,

  /** $FAME tokens earned per $1 of revenue */
  TOKENS_PER_DOLLAR: 10,

  /** Exchange rate: 1 $FAME = $0.01 */
  FAME_TO_USD: 0.01,

  /** Minimum $FAME holdings for Hold-to-Save activation */
  HOLD_TO_SAVE_MINIMUM: 10000,

  /** Active requirement for tiers 4-6: minimum monthly personal sales */
  ACTIVE_REQUIREMENT_AMOUNT: 300.00,

  /** Founder boost multiplier on direct sales */
  FOUNDER_BOOST_MULTIPLIER: 2,

  /** Founder boost duration in months */
  FOUNDER_BOOST_DURATION_MONTHS: 6,

  /** Maximum ambassadors eligible for founder boost */
  FOUNDER_BOOST_LIMIT: 20,

  /** Settlement window in days before rewards are released */
  SETTLEMENT_WINDOW_DAYS: 14,

  /** Minimum age requirement for platform participation */
  MINIMUM_AGE: 21,
} as const;

// ============================================================================
// CORE USER TYPES
// ============================================================================

/**
 * Base user profile for all platform participants
 * Contains common authentication, verification, and profile information
 */
export interface User {
  /** Unique identifier (Firebase UID) */
  userId: string;

  /** User's email address */
  email: string;

  /** User's role on the platform */
  role: UserRole;

  /** First and last name */
  firstName: string;
  lastName: string;

  /** Phone number for contact */
  phoneNumber?: string;

  /** Telegram username for communications (without @) */
  telegramHandle?: string;

  /** Signal username or phone number for communications */
  signalHandle?: string;

  /** Profile picture URL */
  profileImageUrl?: string;

  /** Whether user has completed identity verification */
  isVerified: boolean;

  /** Document verification status */
  kycVerified: boolean;

  /** Account creation timestamp (ISO 8601) */
  createdAt: string;

  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Extended profile for ambassadors/recruiters
 * Includes recruitment hierarchy, tier tracking, and commission data
 */
export interface AmbassadorProfile extends User {
  /** Firebase UID of the ambassador who recruited this user */
  sponsorId?: string;

  /** Primary referral code (used to recruit others) */
  referralCode: string;

  /** Current tier/rank in the affiliate hierarchy (0-6) */
  tier: AmbassadorRank;

  /** Whether this ambassador was part of the first 20 (founder cohort) */
  isFounder: boolean;

  /** When founder boost period started (ISO 8601) */
  founderStartDate?: string;

  /** Whether ambassador meets the active requirement for their tier */
  activeStatus: boolean;

  /** Total personal sales in current month ($) */
  personalSalesThisMonth: number;

  /** Cumulative lifetime sales ($) */
  totalSales: number;

  /** Total number of direct recruits */
  totalRecruits: number;

  /** Payout information (bank details, routing number, etc.) */
  payoutInfo?: {
    accountHolderName?: string;
    bankName?: string;
    routingNumber?: string;
    accountNumber?: string;
    accountType?: 'checking' | 'savings';
  };

  /** Telegram chat ID for direct messaging (numeric) */
  telegramChatId?: number;

  /** Campaign codes ambassador is participating in */
  campaignTags: string[];

  /** Event codes ambassador is participating in */
  eventTags: string[];

  /** Message categories ambassador prefers to receive */
  preferredMessageCategories: string[];

  /** Timestamp of last activity */
  lastActivityAt?: string;
}

/**
 * Payment methods supported for manual sales recording
 */
export type PaymentMethod = 'cash' | 'zelle' | 'venmo';

// ============================================================================
// ORDER & TRANSACTION TYPES
// ============================================================================

/**
 * Individual line item within an order
 */
export interface OrderItem {
  /** Product SKU/ID */
  productId: string;

  /** Product name */
  productName: string;

  /** Quantity ordered */
  quantity: number;

  /** Unit price ($) */
  unitPrice: number;

  /** Line total (quantity × unitPrice) before discounts */
  lineTotal: number;
}

/**
 * Referral commission entry in the commission chain
 * Shows which ambassador earned commission at which tier
 */
export interface ReferralChainEntry {
  /** Ambassador ID earning commission */
  ambassadorId: string;

  /** Tier level (0-6) at which commission is earned */
  tier: AmbassadorRank;

  /** Commission rate applied (0.01 to 0.25) */
  commissionRate: number;

  /** Commission amount earned ($) */
  commissionAmount: number;

  /** Whether this commission was from founder boost period */
  hasFounderBoost?: boolean;
}

/**
 * Complete order record with payment, settlement, and referral tracking
 * Critical for revenue tracking, commission calculation, and refund clawbacks
 */
export interface Order {
  /** Unique order identifier */
  orderId: string;

  /** Firebase UID of the buyer (optional — sales may be recorded by admin without a buyer account) */
  buyerId?: string;

  /** Referral code used at purchase (ambassador code that made the sale) */
  ambassadorCode: string;

  /** Payment method (cash, zelle, venmo) */
  paymentMethod?: PaymentMethod;

  /** Admin who recorded this sale (if admin-recorded) */
  recordedBy?: string;

  /** Customer name (for non-platform customers) */
  customerName?: string;

  /** Line items in this order */
  items: OrderItem[];

  /** Subtotal before discount ($) */
  subtotal: number;

  /** Applied discount ($) */
  discount: number;

  /** Final order total ($) = subtotal - discount */
  total: number;

  /** Payment status (completed, pending, failed, etc.) */
  paymentStatus: OrderStatus;

  /** Settlement status (pending, settled, refunded, clawedback) */
  settlementStatus: SettlementStatus;

  /** Complete commission chain: all ambassadors earning from this order */
  referralChain: ReferralChainEntry[];

  /** Whether buyer was 21+ verified at purchase */
  ageVerified: boolean;

  /** Order creation timestamp (ISO 8601) */
  createdAt: string;

  /** When order transitioned to settled (ISO 8601) */
  settledAt?: string;

  /** When order was refunded/clawed back (ISO 8601) */
  refundedAt?: string;

  /** Refund/clawback reason (if applicable) */
  refundReason?: string;
}

// ============================================================================
// COMMISSION & REWARD TYPES
// ============================================================================

/**
 * Individual commission earned by an ambassador on a specific order
 * Tracks the lifecycle of each commission from pending to paid/clawed back
 */
export interface CommissionEvent {
  /** Unique commission record identifier */
  commissionId: string;

  /** Order that generated this commission */
  orderId: string;

  /** Ambassador earning this commission */
  ambassadorId: string;

  /** Tier level (0-6) at which this commission is earned */
  tier: AmbassadorRank;

  /** Commission rate applied (0.01 to 0.25) */
  rate: number;

  /** Commission amount ($) */
  amount: number;

  /** Lifecycle status of this commission */
  status: CommissionStatus;

  /** Original ambassador who made the sale (tier 0) */
  sourceAmbassadorId: string;

  /** When this commission was created (ISO 8601) */
  createdAt: string;

  /** When commission becomes available for withdrawal (after settlement window) */
  availableAt?: string;

  /** When commission was paid out (ISO 8601) */
  paidAt?: string;

  /** Amount clawed back if refund occurs */
  clawbackAmount?: number;

  /** Payment reference (Zelle confirmation #, Venmo transaction ID, etc.) */
  paymentReference?: string;

  /** Payout method used (cash, zelle, venmo) */
  payoutMethod?: PaymentMethod;

  /** Admin who marked this commission as paid */
  paidBy?: string;
}

/**
 * Token rewards earned by ambassadors based on sales volume
 * $FAME tokens: 10 tokens per $1 revenue, can be held for discounts or spent
 */
export interface TokenEvent {
  /** Unique token transaction identifier */
  eventId: string;

  /** Ambassador earning tokens */
  ambassadorId: string;

  /** Order that generated these tokens */
  orderId: string;

  /** Base tokens earned (order total × 10) */
  tokensEarned: number;

  /** Founder boost multiplier applied (1x or 2x) */
  founderMultiplier: number;

  /** Final tokens awarded (tokensEarned × founderMultiplier) */
  finalTokens: number;

  /** Lifecycle status of these tokens */
  status: TokenStatus;

  /** When tokens were earned (ISO 8601) */
  createdAt: string;

  /** When tokens become available (after settlement) */
  availableAt?: string;

  /** When tokens were spent/redeemed (ISO 8601) */
  spentAt?: string;

  /** Tokens clawed back due to refund */
  clawbackAmount?: number;
}

// ============================================================================
// REFERRAL & RECRUITMENT TYPES
// ============================================================================

/**
 * Referral code record for recruitment tracking
 * Supports multiple code types: primary (baseline), campaign-specific, event-specific
 */
export interface ReferralCode {
  /** The actual code string used for recruitment */
  code: string;

  /** Ambassador who owns this code */
  ambassadorId: string;

  /** Code type: primary (always active), campaign, or event (time-limited) */
  type: ReferralCodeType;

  /** Campaign name/ID (for campaign type codes) */
  campaignName?: string;

  /** When this code expires (ISO 8601, null = never expires) */
  expiresAt?: string;

  /** Whether this code is currently accepting new recruits */
  isActive: boolean;

  /** Total times this code has been used for recruitment */
  usageCount: number;

  /** When this code was created (ISO 8601) */
  createdAt: string;

  /** Last time this code was used (ISO 8601) */
  lastUsedAt?: string;
}

/**
 * Node in the recruitment tree hierarchy
 * Represents one ambassador and their position in the network graph
 */
export interface TeamNode {
  /** Ambassador ID */
  ambassadorId: string;

  /** ID of ambassador who recruited this person */
  sponsorId?: string;

  /** Depth in tree from root (0 = founder level) */
  level: number;

  /** List of ambassador IDs this person directly recruited */
  directRecruits: string[];

  /** Path from root to this node (array of ancestor ambassador IDs) */
  path: string[];

  /** Personal sales in current month ($) */
  personalSalesThisMonth: number;

  /** Total team sales this month (all descendants + self) */
  teamSalesThisMonth: number;

  /** Whether ambassador meets active requirement for their tier */
  isActive: boolean;

  /** Last updated timestamp (ISO 8601) */
  updatedAt: string;
}

// ============================================================================
// ACTION & ENGAGEMENT TYPES
// ============================================================================

/**
 * Next best action recommendations for users
 * Guides ambassadors toward platform goals (recruitment, sales, engagement)
 */
export interface NextBestAction {
  /** Unique action identifier */
  actionId: string;

  /** User receiving the recommendation */
  userId: string;

  /** User's role (ambassador or admin) */
  role: UserRole;

  /** Type of action (e.g., 'recruit', 'sell', 'verify_kyc', 'reach_milestone') */
  actionType: string;

  /** Short action title */
  title: string;

  /** Detailed description and context */
  description: string;

  /** Current progress toward goal */
  progressCurrent: number;

  /** Target progress value */
  progressTarget: number;

  /** Unit of measurement (e.g., 'recruits', 'sales', '$') */
  progressUnit: string;

  /** Potential reward for completing action (money, tokens, etc.) */
  reward?: string;

  /** Priority level (1 = high, 5 = low) */
  priority: 1 | 2 | 3 | 4 | 5;

  /** When this recommendation expires (ISO 8601) */
  expiresAt?: string;

  /** Timestamp created (ISO 8601) */
  createdAt: string;
}

// ============================================================================
// COMMUNICATION & CONTACT TYPES
// ============================================================================

/**
 * Telegram contact record for messaging campaigns and outreach
 * Tracks user preferences, opt-in status, and communication segments
 */
export interface TelegramContact {
  /** Firebase UID of the user */
  userId: string;

  /** Telegram username (without @ symbol) */
  username: string;

  /** Telegram chat ID (numeric, used for sending direct messages) */
  chatId: number;

  /** User's opt-in status for Telegram communications */
  optInStatus: OptInStatus;

  /** Campus/location of user (for localized campaigns) */
  campus?: string;

  /** User's rank/tier on platform */
  rank?: AmbassadorRank;

  /** Whether user meets active sales requirement */
  activeStatus?: boolean;

  /** Campaign codes user is subscribed to */
  campaignTags: string[];

  /** Event codes user is subscribed to */
  eventTags: string[];

  /** Message categories user wants to receive */
  preferredCategories: string[];

  /** When user muted notifications (ISO 8601, null = not muted) */
  mutedAt?: string;

  /** Timestamp of last update (ISO 8601) */
  updatedAt: string;
}

/**
 * Marketing campaign configuration and metrics
 * Supports multi-channel outreach (Telegram, email, SMS, push)
 */
export interface Campaign {
  /** Unique campaign identifier */
  campaignId: string;

  /** Campaign name */
  name: string;

  /** Campaign description and objectives */
  description: string;

  /** Campaign start date (ISO 8601) */
  startDate: string;

  /** Campaign end date (ISO 8601) */
  endDate: string;

  /** Target audience segment (e.g., 'tier_4_plus', 'new_ambassadors') */
  targetSegment: string;

  /** Message template (supports variables like {{ambassadorName}}) */
  messageTemplate: string;

  /** Primary communication channel */
  channel: MessageChannel;

  /** Campaign status (draft, active, paused, completed) */
  status: CampaignStatus;

  /** Campaign performance metrics */
  metrics: {
    /** Total messages sent */
    sent: number;

    /** Messages successfully delivered */
    delivered: number;

    /** Links clicked in messages */
    clicked: number;

    /** Conversions attributed to campaign */
    converted: number;
  };

  /** When campaign was created (ISO 8601) */
  createdAt: string;

  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Event record for in-person or online gatherings
 * Tracks RSVPs, attendance, and ambassador hosts
 */
export interface Event {
  /** Unique event identifier */
  eventId: string;

  /** Event name/title */
  name: string;

  /** Event description */
  description: string;

  /** Event date and time (ISO 8601) */
  date: string;

  /** Event location (address or 'Online' for virtual events) */
  location: string;

  /** Event type (online, offline, hybrid) */
  type: EventType;

  /** List of ambassador IDs who RSVP'd */
  rsvpList: string[];

  /** Ambassador hosting/organizing the event */
  ambassadorHost: string;

  /** Campus/location ID (for filtering regional events) */
  campusId?: string;

  /** Campaign codes associated with this event */
  campaignTags: string[];

  /** When event was created (ISO 8601) */
  createdAt: string;

  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

// ============================================================================
// AUDIT & COMPLIANCE TYPES
// ============================================================================

/**
 * Audit log entry for compliance and fraud detection
 * Records all platform actions for security and dispute resolution
 */
export interface AuditLog {
  /** Unique log entry identifier */
  logId: string;

  /** Action performed (e.g., 'order_created', 'commission_paid', 'refund_issued') */
  action: string;

  /** User ID who performed the action */
  performedBy: string;

  /** Entity ID affected by the action (order, ambassador, etc.) */
  targetId: string;

  /** Detailed information about the action */
  details: Record<string, any>;

  /** When action was performed (ISO 8601) */
  timestamp: string;

  /** IP address from which action was initiated */
  ipAddress?: string;

  /** User agent/device information */
  userAgent?: string;
}

// ============================================================================
// CONFIGURATION & LOOKUP TYPES
// ============================================================================

/**
 * Hold-to-Save tier configuration
 * Maps $FAME token holdings to discount percentages
 */
export interface HoldToSaveTierConfig {
  /** $FAME token balance threshold */
  tokensRequired: number;

  /** Discount percentage for this tier */
  discountPercentage: number;

  /** Human-readable tier name */
  tierName: string;
}

/**
 * Commission tier configuration entry
 * Defines rates for each level in the affiliate hierarchy
 */
export interface CommissionTierConfigEntry {
  /** Tier level (0-6) */
  tier: AmbassadorRank;

  /** Commission rate (0.01 to 0.25) */
  rate: number;

  /** Whether this tier requires active status ($300/month sales) */
  requiresActiveStatus: boolean;

  /** Description of tier position in hierarchy */
  description: string;
}

/**
 * Settlement window configuration
 * Controls when commissions and tokens become available
 */
export interface SettlementWindowConfig {
  /** Number of days to wait after order before settling */
  windowDays: number;

  /** When last settlement ran (ISO 8601) */
  lastSettlementAt: string;

  /** When next settlement is scheduled (ISO 8601) */
  nextSettlementAt: string;

  /** Whether manual settlement adjustments are allowed */
  allowManualAdjustments: boolean;
}

// ============================================================================
// EXPORT UTILITY TYPES FOR RE-USE
// ============================================================================

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items in this page */
  items: T[];

  /** Total number of items (across all pages) */
  total: number;

  /** Current page number (0-indexed) */
  page: number;

  /** Items per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;
}

/**
 * API error response format
 */
export interface ApiError {
  /** Error code for client-side handling */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Additional error context */
  details?: Record<string, any>;

  /** Timestamp when error occurred (ISO 8601) */
  timestamp: string;
}

/**
 * Generic data mutation response
 */
export interface MutationResponse<T> {
  /** Whether operation succeeded */
  success: boolean;

  /** Response data (if successful) */
  data?: T;

  /** Error details (if failed) */
  error?: ApiError;
}

// ============================================================================
// TYPE GUARDS & PREDICATES
// ============================================================================

/**
 * Type guard to check if user is an ambassador
 */
export function isAmbassador(user: User): user is AmbassadorProfile {
  return user.role === 'ambassador';
}

/**
 * Check if a user can view ambassador pages (ambassadors + admins)
 */
export function canViewAmbassadorPages(user: User): boolean {
  return user.role === 'ambassador' || user.role === 'admin';
}

/**
 * Determines if ambassador qualifies for active status requirement
 */
export function requiresActiveStatus(tier: AmbassadorRank): boolean {
  return tier >= 4; // Tiers 4, 5, 6 require $300/month
}

/**
 * Calculates discount percentage based on $FAME holdings
 */
export function getHoldToSaveDiscount(fameBalance: number): number {
  if (fameBalance >= 100000) return 20;
  if (fameBalance >= 50000) return 15;
  if (fameBalance >= 25000) return 10;
  if (fameBalance >= 10000) return 5;
  return 0;
}

/**
 * Calculates total commission for an order given the referral chain
 */
export function calculateTotalCommission(referralChain: ReferralChainEntry[]): number {
  return referralChain.reduce((sum, entry) => sum + entry.commissionAmount, 0);
}

/**
 * Checks if a token event should be clawed back based on refund
 */
export function shouldClawBackTokens(tokenEvent: TokenEvent, orderStatus: SettlementStatus): boolean {
  return (orderStatus === 'refunded' || orderStatus === 'clawedback') &&
         (tokenEvent.status === 'pending' || tokenEvent.status === 'available' || tokenEvent.status === 'spent');
}
