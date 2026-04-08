# FameBar OS: Referral Attribution System & Next Best Action Engine

This guide covers the two core engagement systems that make FameBar OS feel alive and personalized.

## Table of Contents

1. [Referral Attribution System](#referral-attribution-system)
2. [Next Best Action Engine](#next-best-action-engine)
3. [Component Library](#component-library)
4. [Integration Guide](#integration-guide)

---

## Referral Attribution System

The referral system manages recruitment, code generation, and team hierarchy. It consists of two modules:

### 1. Referral Engine (`src/lib/referral/engine.ts`)

Handles referral codes, attribution tracking, and anti-fraud validation.

#### Key Functions

**Code Generation**
```typescript
// Generate primary code (permanent, never expires)
const code = generateReferralCode(ambassadorId, 'primary');

// Generate campaign code (time-limited, expires in 90 days)
const campaignCode = createCampaignCode(ambassadorId, 'BlackFriday2024', expiresAt);
```

**Code Resolution**
```typescript
// Resolve a code to get ambassador info
const resolved = resolveReferralCode('BABIDOY');
if (resolved.isValid && !resolved.isExpired) {
  console.log(resolved.ambassadorId);
}
```

**Session Locking** (Fraud Prevention)
```typescript
// Lock a buyer's referral choice during checkout
lockReferralSession(buyerSessionId, referralCode);

// Retrieve locked code (within 30min window)
const lockedCode = getLockedReferralCode(buyerSessionId);
```

**Anti-Abuse Validation**
```typescript
// Validate code usage with fraud checks
const validation = validateCodeUsage(
  code,
  buyerId,
  ambassadorId,
  ipAddress,
  paymentMethod
);

if (!validation.valid) {
  console.log(validation.reason); // "Self-referral", "Too many signups from this device", etc.
}
```

**Recording Usage**
```typescript
// Called after successful purchase settlement
recordCodeUsage(referralCode);
```

#### In-Memory Storage (Placeholder)

Current implementation uses in-memory Maps for quick prototyping:
- `referralCodes`: All active codes
- `sessionLocks`: Current checkout locks
- `codeUsageCache`: Abuse tracking per code

**In production, replace with:**
- Firestore collection: `referral_codes`
- Redis for session locks (with TTL)
- MongoDB/PostgreSQL for usage analytics

### 2. Referral Tree (`src/lib/referral/tree.ts`)

Manages the recruitment hierarchy, upline/downline navigation, and team statistics.

#### Key Functions

**Tree Navigation**
```typescript
// Get upline (sponsor chain) up to this ambassador
const upline = getUpline(ambassadorId, maxDepth: 6);
// Returns: [sponsorId, grandSponsorId, ...]

// Get downline (all recruits under this ambassador)
const downline = getDownline(ambassadorId, maxDepth: 6);
// Returns: [recruit1, recruit2, team1, team2, ...]

// Get only direct recruits (level 1)
const directs = getDirectRecruits(ambassadorId);
```

**Team Statistics**
```typescript
const stats = getTeamStats(ambassadorId);
// Returns:
// {
//   totalTeamSize: 47,
//   activeCount: 32,
//   stalledCount: 15,
//   newThisMonth: 3,
//   totalTeamSalesThisMonth: $12,450,
//   salesByLevel: { 1: $5000, 2: $3200, 3: $2100, ... },
//   teamByLevel: { 1: 5, 2: 12, 3: 18, ... }
// }
```

**Commission Potential**
```typescript
const potential = getCommissionPotential(ambassadorId, COMMISSION_TIER_CONFIG);
// Returns:
// {
//   currentMonthEarnings: $1,245.50,
//   estimatedMonthlyCapacity: $2,400,
//   breakdownByLevel: { 0: $600, 1: $400, 2: $245.50 }
// }
```

**Onboarding New Ambassadors**
```typescript
// Add new ambassador to tree under their sponsor
const newNode = addToTree(newAmbassadorId, sponsorId);
// newNode.path = [root, ..., sponsorId] (ancestor chain)
// newNode.level = path.length
```

**Hierarchy Checks**
```typescript
// Check if person A is descended from person B
const isTeamMember = isDescendantOf(personA, personB);

// Get full path from root to this ambassador
const path = getAncestorPath(ambassadorId);
// Returns: [founder1, level1, level2, ambassadorId]
```

**Inactive Tracking**
```typescript
// Get ambassadors with no activity in 7+ days
const inactive = getInactiveAmbassadors(daysSinceLastActivity: 7);
```

---

## Next Best Action Engine

The NBA engine generates prioritized, contextual recommendations that drive user engagement and platform revenue.

### Core Philosophy

**Every screen should answer three questions:**
1. **What have I earned?** (EarningsCard shows real money/tokens)
2. **What should I do next?** (NBAWidget shows top 3 actions)
3. **What unlocks if I do it?** (Each action shows reward/impact)

### Main Entry Point

```typescript
import { getNextBestActions } from '@/lib/nba/engine';

const user = await getCurrentUser();
const actions = getNextBestActions(user, maxActions: 5);
// Returns: NextBestAction[] sorted by priority
```

### Action Generation by Role

#### Buyers
1. **Hold-to-Save Tier Progress** - "X $FAME away from Y% discount"
2. **Reorder Window** - "Your reorder window is open" (14+ days since last order)
3. **Share & Earn** - "Introduce friends" (if purchased 2+ times)
4. **Age Verification** - "Unlock full benefits" (if not verified)

#### New Ambassadors (Tier 0-2)
1. **KYC Verification** - Gates code activation (highest priority)
2. **Telegram Handle** - For communications
3. **Onboarding Checklist** - Profile setup, first share, first order, first recruit
4. **Share with Contacts** - "Share with 5 contacts to get started"
5. **Active Requirement** - "$X more to stay active this month" (if tier 4+)
6. **First Recruit Milestone** - "Get your first recruit"
7. **Tier Advancement** - "You qualify for Tier 3!" (when threshold met)

#### Leaders (Tier 4+)
1. **Inactive Team Alert** - "X members inactive for 7+ days" (HIGH IMPACT)
2. **Pending Approvals** - "X recruits awaiting approval"
3. **Monthly Milestone** - "$X away from $5k goal" (shows bonus potential)
4. **Mentor Opportunities** - "X team members close to ranking up"
5. **Unclaimed Commission** - **"You left $X on the table"** (powerful motivator)
6. **Recruitment Challenge** - Gamification: "Recruit 5 this month for $500 bonus"

#### Admins
1. **Orders Needing Review** - Compliance/high-value orders
2. **Missing Payout Info** - Ambassadors can't receive commissions without banking details
3. **Refund Batch Ready** - Clawback processing
4. **Telegram Event Reminder** - Scheduled broadcasts
5. **Settlement Window Closing** - Routine operations

### Priority Levels

| Priority | Label | Use Case |
|----------|-------|----------|
| 1 | Urgent | Account at risk, time-sensitive, revenue-critical |
| 2 | High | Action drives immediate revenue/engagement |
| 3 | Medium | Important but not urgent |
| 4 | Low | Nice-to-have |
| 5 | Optional | Supplementary actions |

### Reward Descriptions

Each action includes a `reward` field that shows the impact of completing it:

- **Money**: `"$50-100 commission on first recruit"`, `"Earn $5-20 per referral"`
- **Tokens**: `"$FAME tokens (10 per $1 spent)"`
- **Unlocks**: `"Unlock primary referral code + commission earnings"`
- **Multipliers**: `"2x founder boost on first 6 months"`
- **Badges/Status**: `"Advance to Tier 3 status + deeper commission access"`

### Scoring & Prioritization

The engine uses `scoreActionByPriority()` to prioritize intelligently:

```
Base Score = priority * 100
- 50 points: Revenue-driving actions (recruit, milestone, active req)
- 30 points: Verification actions (new user activation)
+ (daysSinceCreation * 2): Age decay (older actions ranked lower)
```

---

## Component Library

### 1. NextBestActionCard

Renders a single NBA recommendation with full styling.

```typescript
import NextBestActionCard from '@/components/shared/NextBestActionCard';

<NextBestActionCard
  action={action}
  onCTA={(actionId) => handleAction(actionId)}
  isLoading={false}
/>
```

**Features:**
- Icon based on `actionType`
- Title + description
- Animated progress bar (if applicable)
- Reward badge with glow effect
- High-priority cards get red accent + urgent badge
- CTA button styled by priority level

### 2. NBAWidget

Shows top 3 personalized actions for current user.

```typescript
import NBAWidget from '@/components/shared/NBAWidget';

<NBAWidget
  maxActions={3}
  onActionClick={(action) => navigateTo(action.actionType)}
  showTitle={true}
/>
```

**Features:**
- Auto-fetches actions based on `useAuth()` user
- Loading skeleton during fetch
- Empty state if no actions
- Insight footer with tip
- Title changes by role ("Build Your Business" for ambassadors, etc.)

### 3. EarningsCard

Displays earnings dashboard with cash, tokens, and tier progress.

```typescript
import EarningsCard from '@/components/shared/EarningsCard';

<EarningsCard
  availableCash={1250.50}
  pendingCash={340.75}
  availableTokens={45000}
  pendingTokens={12500}
  holdToSaveTier={10}
  fameBalance={45000}
  isAmbassador={true}
  onWithdraw={() => openWithdrawalFlow()}
  onViewDetails={() => navigate('/earnings')}
/>
```

**Features:**
- Big number display for available cash (green)
- Pending amounts (amber) in secondary position
- Token balances side-by-side
- Hold-to-Save tier badge with progress (buyer only)
- Tier emoji: 🔷 Bronze → ⭐ Silver → ✨ Gold → 💎 Diamond → 🌟 Platinum
- Settlement notice if funds pending
- Withdraw button (disabled if $0)
- Empty state for new users

### 4. ProgressRing

Circular SVG progress indicator for goals/requirements.

```typescript
import ProgressRing from '@/components/shared/ProgressRing';

<ProgressRing
  progress={65}
  size={120}
  strokeWidth={8}
  color="emerald"
  label="Active Req"
  sublabel="$300/month"
  showPercentage={true}
  animated={true}
/>
```

**Features:**
- Smooth animations on progress changes
- Custom colors: emerald, amber, green, blue, purple
- Configurable size and stroke width
- Center labels + percentage
- Gradient fill with glow effect
- Used for: active requirements, tier progress, team goals

---

## Integration Guide

### Step 1: Add Referral Code to Ambassador Signup

```typescript
// In your sign-up flow
import { generateReferralCode } from '@/lib/referral';

const ambassador = await createAmbassador(data);

// Generate primary code after KYC
const refCode = generateReferralCode(ambassador.userId, 'primary');
await updateAmbassador(ambassador.userId, { referralCode: refCode.code });
```

### Step 2: Lock Referral Session During Checkout

```typescript
// In checkout page
import { lockReferralSession } from '@/lib/referral';

const handleCodeInput = (code: string) => {
  lockReferralSession(buyerSessionId, code);
};
```

### Step 3: Validate Code at Purchase

```typescript
// In payment processing
import { validateCodeUsage, recordCodeUsage } from '@/lib/referral';

const validation = validateCodeUsage(code, buyerId, ambassadorId, ipAddress, paymentMethod);
if (!validation.valid) {
  throw new Error(validation.reason);
}

// After successful payment
recordCodeUsage(code);
await assignBuyerToAmbassador(buyerId, ambassadorId);
```

### Step 4: Add New Recruit to Tree

```typescript
// When new ambassador is approved
import { addToTree } from '@/lib/referral/tree';

const treeNode = addToTree(newAmbassadorId, sponsorId);
// Node now appears in sponsor's downline
// Tier is auto-calculated based on path depth
```

### Step 5: Display NBA Widget on Dashboard

```typescript
// In dashboard.tsx
import NBAWidget from '@/components/shared/NBAWidget';
import EarningsCard from '@/components/shared/EarningsCard';

export default function Dashboard({ user, earnings }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column: NBA Widget */}
      <NBAWidget maxActions={3} />

      {/* Right column: Earnings */}
      <EarningsCard {...earnings} />
    </div>
  );
}
```

### Step 6: Update Team Stats on Order Settlement

```typescript
// In order settlement logic
import { updateNodeSales } from '@/lib/referral/tree';

const settlementAmount = order.total;
updateNodeSales(ambassadorId, settlementAmount);

// This propagates sales up the upline automatically
```

### Step 7: Refresh NBA Actions (Real-time)

```typescript
// After any significant user action (order, recruit, etc.)
// Re-fetch actions to show updated recommendations

const refreshActions = async () => {
  const updated = await getNextBestActions(currentUser);
  setActions(updated);
};
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    PURCHASE FLOW                        │
└─────────────────────────────────────────────────────────┘

Buyer                      Code Resolution              Sponsor
  │                              │                        │
  ├─ Enter code ──────────────>  resolveReferralCode()
  │                              │ ↓
  │                      Get ambassadorId
  │                              │
  ├─ Lock session ──────────>  lockReferralSession()
  │                              │
  ├─ Validate code ──────────>  validateCodeUsage()
  │                      (fraud checks)
  │                              │
  ├─ Process payment
  │                              │
  └─ Order created         recordCodeUsage()
                                 │
                           addToTree()
                                 │ ↓
                          updateNodeSales()
                                 │ ↓
                         (propagates upline)
                                 │ ↓
                           Sponsor earns
                           commission

┌─────────────────────────────────────────────────────────┐
│              NBA RECOMMENDATION FLOW                    │
└─────────────────────────────────────────────────────────┘

Current User
     │
     ├─ Load profile (role, tier, sales, etc.)
     │
     ├─ getNextBestActions(user)
     │   ├─ Check role
     │   │
     │   ├─ Get team stats (via getTeamStats)
     │   ├─ Get upline info (via getUpline)
     │   ├─ Check profile completeness
     │   │
     │   └─ Generate role-specific actions:
     │       ├─ KYC status
     │       ├─ Onboarding progress
     │       ├─ Active requirement progress
     │       ├─ Team health metrics
     │       ├─ Milestone proximity
     │       └─ ...
     │
     ├─ Sort by scoreActionByPriority()
     │
     ├─ Return top 5 actions
     │
     └─ Display in NBAWidget
         ├─ NextBestActionCard (x3)
         └─ Insight footer
```

---

## Testing & Debugging

### Test Referral Code Generation

```typescript
import { generateReferralCode } from '@/lib/referral';

const code = generateReferralCode('amb_001', 'primary');
console.log(code.code); // "BABIDOY" (8-char consonant-vowel pattern)
console.log(code.isActive); // true
console.log(code.expiresAt); // undefined (primary codes never expire)
```

### Test Team Tree Building

```typescript
import { addToTree, getTeamStats, getDownline } from '@/lib/referral/tree';

addToTree('amb_001'); // Founder at level 0
addToTree('amb_002', 'amb_001'); // Level 1
addToTree('amb_003', 'amb_002'); // Level 2

const stats = getTeamStats('amb_001');
console.log(stats.totalTeamSize); // 3
console.log(stats.teamByLevel); // { 1: 1, 2: 1 }
```

### Test NBA Action Generation

```typescript
import { getNextBestActions } from '@/lib/nba/engine';

const buyer = { userId: 'buyer_1', role: 'buyer', fameBalance: 12000, ... };
const actions = getNextBestActions(buyer);
console.log(actions[0].actionType); // 'hold_to_save_progress'
console.log(actions[0].priority); // 2
```

---

## Performance Considerations

1. **In-Memory Storage**: Current implementation uses Maps. In production:
   - Use Firestore indexes on `ambassadorId`, `expiresAt`
   - Cache getTeamStats() results (update on order settlement)
   - Use Redis for session locks with 30min TTL

2. **Upline/Downline Queries**: 
   - Limit maxDepth to 6 (theoretical max commission depth)
   - Cache upline traversals (rarely changes)
   - Batch downline queries for large teams (1000+ members)

3. **NBA Generation**:
   - Memoize `getTeamStats()` calls
   - Run `generateAmbassadorActions()` in background on profile changes
   - Cache for 5 minutes per user

4. **Code Validation**:
   - Pre-compute fraud scores in background
   - Use Redis for real-time IP/payment method tracking
   - Implement rate limiting (max 3 codes per session per hour)

---

## Future Enhancements

1. **ML-Based Prioritization**: Use user behavior to score actions
2. **A/B Testing**: Track which action types drive conversions
3. **Dynamic Rewards**: Calculate potential earnings in real-time
4. **Team Notifications**: Alert sponsors when team members complete actions
5. **Achievement Badges**: Unlock badges for milestone completions
6. **Leaderboards**: Show team rankings and top performers

---

## Quick Reference

| What | Where | Function |
|------|-------|----------|
| Generate code | `src/lib/referral/engine.ts` | `generateReferralCode()` |
| Validate code | `src/lib/referral/engine.ts` | `validateCodeUsage()` |
| Get team stats | `src/lib/referral/tree.ts` | `getTeamStats()` |
| Get NBA actions | `src/lib/nba/engine.ts` | `getNextBestActions()` |
| Display action card | `src/components/shared/NextBestActionCard.tsx` | Component |
| Display earnings | `src/components/shared/EarningsCard.tsx` | Component |
| Display progress | `src/components/shared/ProgressRing.tsx` | Component |
